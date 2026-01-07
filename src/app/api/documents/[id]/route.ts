import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireNonOperations } from '@/lib/route-guards';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/documents/[id] - Download document
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const { id } = await context.params;
    const document = await prisma.licenseDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Čitanje fajla
    const filePath = join(process.cwd(), 'public', document.filePath);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found on server' },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(filePath);

    // Return file sa proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.fileType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': document.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Document download error:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const { id } = await context.params;
    const document = await prisma.licenseDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Brisanje fajla sa diska
    const filePath = join(process.cwd(), 'public', document.filePath);
    
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Brisanje record-a iz baze
    await prisma.licenseDocument.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Document delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
