import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/route-guards';

type MigrationMapping = {
  key: string;
  sourceOperationCode: string;
  targetOperationCode: string;
  targetFlightTypeCode: string;
  label: string;
};

const MIGRATION_MAPPINGS: MigrationMapping[] = [
  {
    key: 'scheduled',
    sourceOperationCode: 'SCHEDULED',
    targetOperationCode: 'SCHEDULED',
    targetFlightTypeCode: 'SCHEDULED',
    label: 'Redovan → International Scheduled',
  },
  {
    key: 'charter',
    sourceOperationCode: 'CHARTER',
    targetOperationCode: 'INTERNATIONAL-NON-SCHEDULED',
    targetFlightTypeCode: 'CHARTER FLIGHT',
    label: 'Charter → International Non-Scheduled / Charter Flight',
  },
  {
    key: 'medevac',
    sourceOperationCode: 'MEDEVAC',
    targetOperationCode: 'INTERNATIONAL-NON-SCHEDULED',
    targetFlightTypeCode: 'HOSPITAL MEDEVAC',
    label: 'Medevac → International Non-Scheduled / Hospital Medevac',
  },
  {
    key: 'general-aviation',
    sourceOperationCode: 'GENERAL_AVIATION',
    targetOperationCode: 'INTERNATIONAL-NON-SCHEDULED',
    targetFlightTypeCode: 'GENERAL AVIATON PRIVAT',
    label: 'Generalna avijacija → International Non-Scheduled / General Aviation Privat',
  },
  {
    key: 'military',
    sourceOperationCode: 'MILITARY',
    targetOperationCode: 'ALL-OTHER-MVMT',
    targetFlightTypeCode: 'MILITARY',
    label: 'Vojni → All Other Movement / Military',
  },
  {
    key: 'diverted',
    sourceOperationCode: 'DIVERTED',
    targetOperationCode: 'INTERNATIONAL-NON-SCHEDULED',
    targetFlightTypeCode: 'DIVERTED',
    label: 'Divertovani → International Non-Scheduled / Diverted',
  },
];

const buildUpdateWhere = (
  sourceOperationId: string,
  targetOperationId: string,
  targetFlightTypeId: string
) => {
  if (sourceOperationId === targetOperationId) {
    return {
      operationTypeId: sourceOperationId,
      OR: [{ flightTypeId: null }, { flightTypeId: { not: targetFlightTypeId } }],
    };
  }

  return {
    operationTypeId: sourceOperationId,
    OR: [
      { flightTypeId: null },
      { flightTypeId: { not: targetFlightTypeId } },
      { operationTypeId: { not: targetOperationId } },
    ],
  };
};

const resolveMappings = (
  operationMap: Map<string, { id: string; code: string; name: string }>,
  flightTypeMap: Map<string, { id: string; code: string; name: string }>
) => {
  const activeMappings: Array<{
    mapping: MigrationMapping;
    sourceOperation: { id: string; code: string; name: string };
    targetOperation: { id: string; code: string; name: string };
    targetFlightType: { id: string; code: string; name: string };
  }> = [];
  const skippedMappings: Array<{ key: string; label: string; reason: string }> = [];
  const missingTargets: { operationTypes: string[]; flightTypes: string[] } = {
    operationTypes: [],
    flightTypes: [],
  };

  for (const mapping of MIGRATION_MAPPINGS) {
    const sourceOperation = operationMap.get(mapping.sourceOperationCode);
    const targetOperation = operationMap.get(mapping.targetOperationCode);
    const targetFlightType = flightTypeMap.get(mapping.targetFlightTypeCode);

    if (!sourceOperation) {
      skippedMappings.push({
        key: mapping.key,
        label: mapping.label,
        reason: `Nedostaje izvorni tip operacije: ${mapping.sourceOperationCode}`,
      });
      continue;
    }

    if (!targetOperation) {
      missingTargets.operationTypes.push(mapping.targetOperationCode);
      continue;
    }

    if (!targetFlightType) {
      missingTargets.flightTypes.push(mapping.targetFlightTypeCode);
      continue;
    }

    activeMappings.push({
      mapping,
      sourceOperation,
      targetOperation,
      targetFlightType,
    });
  }

  return { activeMappings, skippedMappings, missingTargets };
};

export async function GET(request: Request) {
  const adminCheck = await requireAdmin(request);
  if ('error' in adminCheck) return adminCheck.error;

  const operationCodes = Array.from(
    new Set(
      MIGRATION_MAPPINGS.flatMap((mapping) => [
        mapping.sourceOperationCode,
        mapping.targetOperationCode,
      ])
    )
  );
  const flightTypeCodes = Array.from(
    new Set(MIGRATION_MAPPINGS.map((mapping) => mapping.targetFlightTypeCode))
  );

  const [operationTypes, flightTypes] = await Promise.all([
    prisma.operationType.findMany({
      where: { code: { in: operationCodes } },
      select: { id: true, code: true, name: true },
    }),
    prisma.flightType.findMany({
      where: { code: { in: flightTypeCodes } },
      select: { id: true, code: true, name: true },
    }),
  ]);

  const operationMap = new Map(operationTypes.map((op) => [op.code, op]));
  const flightTypeMap = new Map(flightTypes.map((ft) => [ft.code, ft]));

  const { activeMappings, skippedMappings, missingTargets } = resolveMappings(
    operationMap,
    flightTypeMap
  );

  if (missingTargets.operationTypes.length || missingTargets.flightTypes.length) {
    return NextResponse.json(
      {
        success: false,
        error: 'Nedostaju definicije tipova operacije ili tipova leta.',
        missing: {
          operationTypes: missingTargets.operationTypes,
          flightTypes: missingTargets.flightTypes,
        },
      },
      { status: 400 }
    );
  }

  const preview = await Promise.all(
    activeMappings.map(async ({ mapping, sourceOperation, targetOperation, targetFlightType }) => {
      const totalFlights = await prisma.flight.count({
        where: { operationTypeId: sourceOperation.id },
      });

      const willUpdate = await prisma.flight.count({
        where: buildUpdateWhere(sourceOperation.id, targetOperation.id, targetFlightType.id),
      });

      return {
        key: mapping.key,
        label: mapping.label,
        sourceOperation,
        targetOperation,
        targetFlightType,
        totalFlights,
        willUpdate,
      };
    })
  );

  return NextResponse.json({
    success: true,
    preview,
    skippedMappings,
  });
}

export async function POST(request: Request) {
  const adminCheck = await requireAdmin(request);
  if ('error' in adminCheck) return adminCheck.error;

  const operationCodes = Array.from(
    new Set(
      MIGRATION_MAPPINGS.flatMap((mapping) => [
        mapping.sourceOperationCode,
        mapping.targetOperationCode,
      ])
    )
  );
  const flightTypeCodes = Array.from(
    new Set(MIGRATION_MAPPINGS.map((mapping) => mapping.targetFlightTypeCode))
  );

  const [operationTypes, flightTypes] = await Promise.all([
    prisma.operationType.findMany({
      where: { code: { in: operationCodes } },
      select: { id: true, code: true, name: true },
    }),
    prisma.flightType.findMany({
      where: { code: { in: flightTypeCodes } },
      select: { id: true, code: true, name: true },
    }),
  ]);

  const operationMap = new Map(operationTypes.map((op) => [op.code, op]));
  const flightTypeMap = new Map(flightTypes.map((ft) => [ft.code, ft]));

  const { activeMappings, skippedMappings, missingTargets } = resolveMappings(
    operationMap,
    flightTypeMap
  );

  if (missingTargets.operationTypes.length || missingTargets.flightTypes.length) {
    return NextResponse.json(
      {
        success: false,
        error: 'Nedostaju definicije tipova operacije ili tipova leta.',
        missing: {
          operationTypes: missingTargets.operationTypes,
          flightTypes: missingTargets.flightTypes,
        },
      },
      { status: 400 }
    );
  }

  const results: Array<{
    key: string;
    label: string;
    sourceOperationCode: string;
    targetOperationCode: string;
    targetFlightTypeCode: string;
    totalFlights: number;
    updatedFlights: number;
  }> = [];

  for (const { mapping, sourceOperation, targetOperation, targetFlightType } of activeMappings) {
    const totalFlights = await prisma.flight.count({
      where: { operationTypeId: sourceOperation.id },
    });

    const updateResult = await prisma.flight.updateMany({
      where: buildUpdateWhere(sourceOperation.id, targetOperation.id, targetFlightType.id),
      data: {
        operationTypeId: targetOperation.id,
        flightTypeId: targetFlightType.id,
      },
    });

    results.push({
      key: mapping.key,
      label: mapping.label,
      sourceOperationCode: mapping.sourceOperationCode,
      targetOperationCode: mapping.targetOperationCode,
      targetFlightTypeCode: mapping.targetFlightTypeCode,
      totalFlights,
      updatedFlights: updateResult.count,
    });
  }

  const updatedTotal = results.reduce((sum, item) => sum + item.updatedFlights, 0);

  return NextResponse.json({
    success: true,
    results,
    updatedTotal,
    skippedMappings,
  });
}
