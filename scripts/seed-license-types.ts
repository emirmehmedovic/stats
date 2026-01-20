/**
 * Seed script for bulk importing license types from PLAN OBUKA CZOK 2025
 *
 * This script:
 * 1. Reads parsed license type data from JSON file
 * 2. Creates parent license types (base training programs)
 * 3. Creates variants (INITIAL, RENEWAL, EXTENSION) for each program
 * 4. Links variants to their parent via parentLicenseTypeId
 *
 * Usage:
 *   npx ts-node scripts/seed-license-types.ts
 */

import { PrismaClient, TrainingType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

interface ParsedLicenseType {
  number: number;
  name: string;
  instructors: string;
  programDuration: string;
  theoryHours: number;
  practicalHours: number;
  workplaceTraining: string;
  validityMonths: number;
  variants: string[]; // ["INITIAL", "RENEWAL", "EXTENSION"]
}

const trainingTypeMapping: Record<string, TrainingType> = {
  'INITIAL': 'INITIAL',
  'RENEWAL': 'RENEWAL',
  'EXTENSION': 'EXTENSION',
};

const trainingTypeSuffix: Record<TrainingType, string> = {
  'INITIAL': 'Sticanje',
  'RENEWAL': 'Obnavljanje',
  'EXTENSION': 'Produženje',
};

async function main() {
  console.log('🚀 Starting license types import...\n');

  // Read parsed data
  const dataPath = path.join(__dirname, 'parsed-license-types.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const licenseTypesData: ParsedLicenseType[] = JSON.parse(rawData);

  console.log(`📋 Found ${licenseTypesData.length} license types to import\n`);

  let parentCount = 0;
  let variantCount = 0;

  for (const data of licenseTypesData) {
    console.log(`\n📦 Processing: ${data.name}`);

    // Create parent license type (base program without training type)
    const parent = await prisma.licenseType.create({
      data: {
        name: data.name,
        code: `TRN-${data.number.toString().padStart(3, '0')}`,
        category: 'Training Program',
        validityPeriodMonths: data.validityMonths,
        requiresRenewal: true,
        isActive: true,
        instructors: data.instructors,
        programDuration: data.programDuration,
        theoryHours: data.theoryHours,
        practicalHours: data.practicalHours,
        workplaceTraining: data.workplaceTraining || null,
        trainingType: null, // Parent has no training type
        parentLicenseTypeId: null,
      },
    });

    parentCount++;
    console.log(`   ✅ Created parent: ${parent.name}`);

    // Create variants (INITIAL, RENEWAL, EXTENSION)
    for (const variantType of data.variants) {
      const trainingType = trainingTypeMapping[variantType];
      if (!trainingType) {
        console.log(`   ⚠️  Unknown variant type: ${variantType}, skipping...`);
        continue;
      }

      const variantName = `${data.name} - ${trainingTypeSuffix[trainingType]}`;
      const variantCode = `${parent.code}-${variantType.substring(0, 3)}`;

      const variant = await prisma.licenseType.create({
        data: {
          name: variantName,
          code: variantCode,
          category: 'Training Program',
          validityPeriodMonths: data.validityMonths,
          requiresRenewal: true,
          isActive: true,
          instructors: data.instructors,
          programDuration: data.programDuration,
          theoryHours: data.theoryHours,
          practicalHours: data.practicalHours,
          workplaceTraining: data.workplaceTraining || null,
          trainingType: trainingType,
          parentLicenseTypeId: parent.id,
        },
      });

      variantCount++;
      console.log(`   ✅ Created variant: ${trainingTypeSuffix[trainingType]} (${variant.code})`);
    }
  }

  console.log('\n\n✨ Import completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Parent programs created: ${parentCount}`);
  console.log(`   - Variant programs created: ${variantCount}`);
  console.log(`   - Total license types: ${parentCount + variantCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
