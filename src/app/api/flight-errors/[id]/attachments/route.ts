import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyAuth } from '@/lib/route-guards';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { FlightErrorStatus } from '@prisma/client';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'flight-errors');

// POST /api/flight-errors/[id]/attachments - Upload attachment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await context.params;

    // Get the error report
    const errorReport = await prisma.flightErrorReport.findUnique({
      where: { id },
    });

    if (!errorReport) {
      return NextResponse.json(
        { success: false, error: 'Greška nije pronađena' },
        { status: 404 }
      );
    }

    // Only assignee can upload attachments
    if (errorReport.assignedToId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Nemate dozvolu za upload priloga' },
        { status: 403 }
      );
    }

    // Check status - cannot upload to closed errors
    if (errorReport.status === FlightErrorStatus.CLOSED) {
      return NextResponse.json(
        { success: false, error: 'Ne možete dodati prilog zatvorenoj grešci' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Fajl nije pronađen' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Fajl je prevelik. Maksimalna veličina je 10MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Nedozvoljeni tip fajla' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.name);
    const safeFileName = `${id}_${timestamp}_${randomString}${extension}`;
    const filePath = path.join(UPLOAD_DIR, safeFileName);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create attachment record
    const attachment = await prisma.flightErrorAttachment.create({
      data: {
        errorReportId: id,
        fileName: file.name,
        filePath: `/uploads/flight-errors/${safeFileName}`,
        fileType: file.type,
        fileSize: file.size,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Add history entry
    await prisma.flightErrorHistory.create({
      data: {
        errorReportId: id,
        action: 'ATTACHMENT_ADDED',
        notes: `Prilog dodan: ${file.name}`,
        performedById: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: attachment,
      message: 'Prilog uspješno dodan',
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload attachment',
      },
      { status: 500 }
    );
  }
}

// GET /api/flight-errors/[id]/attachments - Get all attachments
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await context.params;

    // Get the error report
    const errorReport = await prisma.flightErrorReport.findUnique({
      where: { id },
    });

    if (!errorReport) {
      return NextResponse.json(
        { success: false, error: 'Greška nije pronađena' },
        { status: 404 }
      );
    }

    // Check access
    const isAdminOrOps = user.role === 'ADMIN' || user.role === 'OPERATIONS';
    const isAssignee = errorReport.assignedToId === user.id;
    const isReporter = errorReport.reportedById === user.id;

    if (!isAdminOrOps && !isAssignee && !isReporter) {
      return NextResponse.json(
        { success: false, error: 'Nemate pristup prilozima' },
        { status: 403 }
      );
    }

    const attachments = await prisma.flightErrorAttachment.findMany({
      where: { errorReportId: id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attachments',
      },
      { status: 500 }
    );
  }
}
