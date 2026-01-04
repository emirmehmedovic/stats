import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/licenses/[id]/documents - Upload document
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    // Provjera da li licenca postoji
    const license = await prisma.license.findUnique({
      where: { id },
    });

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validacija tipa fajla
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPEG, PNG allowed.' },
        { status: 400 }
      );
    }

    // Validacija veličine (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Kreiranje unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    
    // Putanja za čuvanje
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents');
    
    // Kreiranje direktorija ako ne postoji
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filePath = join(uploadsDir, fileName);

    // Čuvanje fajla
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Kreiranje record u bazi
    const document = await prisma.licenseDocument.create({
      data: {
        licenseId: id,
        fileName: file.name,
        filePath: `/uploads/documents/${fileName}`,
        fileType: file.type,
        fileSize: file.size,
      },
    });

    return NextResponse.json({
      success: true,
      data: document,
    }, { status: 201 });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// GET /api/licenses/[id]/documents - Lista dokumenata za licencu
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const documents = await prisma.licenseDocument.findMany({
      where: { licenseId: id },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
