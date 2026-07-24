import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAnyAuth, requireAdmin } from '@/lib/route-guards';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/support-tickets/[id]/attachments - Upload attachment
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const ip = getClientIp(request);
    const rate = rateLimit(`upload:ticket-attachment:${ip}`, { windowMs: 60_000, max: 15 });
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Previše zahtjeva. Pokušajte ponovo kasnije.' },
        { status: 429 }
      );
    }

    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await context.params;

    // Check if ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, submittedById: true, status: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Tiket nije pronađen' },
        { status: 404 }
      );
    }

    // Authorization: ADMIN or ticket owner
    const isAdmin = user.role === 'ADMIN';
    const isOwner = ticket.submittedById === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za upload na ovaj tiket' },
        { status: 403 }
      );
    }

    // Don't allow uploads on closed tickets (except for admin)
    if (ticket.status === 'CLOSED' && !isAdmin) {
      return NextResponse.json(
        { error: 'Ne možete dodavati priloge na zatvoreni tiket' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const commentId = formData.get('commentId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Fajl nije proslijeđen' },
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
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nedozvoljen tip fajla. Dozvoljeni: JPEG, PNG, GIF, WebP, PDF' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Fajl je prevelik. Maksimalna veličina je 10MB' },
        { status: 400 }
      );
    }

    // If commentId is provided, verify the comment exists and belongs to this ticket
    if (commentId) {
      const comment = await prisma.ticketComment.findUnique({
        where: { id: commentId },
        select: { ticketId: true },
      });

      if (!comment || comment.ticketId !== id) {
        return NextResponse.json(
          { error: 'Komentar nije pronađen' },
          { status: 404 }
        );
      }
    }

    // Create unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;

    // Directory path
    const uploadDir = commentId ? 'ticket-comments' : 'tickets';
    const uploadsDir = join(process.cwd(), 'public', 'uploads', uploadDir);

    // Create directory if not exists
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create database record
    const attachment = await prisma.ticketAttachment.create({
      data: {
        fileName: file.name,
        filePath: `/uploads/${uploadDir}/${fileName}`,
        fileType: file.type,
        fileSize: file.size,
        ticketId: commentId ? null : id,
        commentId: commentId || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: attachment,
        message: 'Prilog uspješno dodan',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Attachment upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload attachment' },
      { status: 500 }
    );
  }
}

// DELETE /api/support-tickets/[id]/attachments?attachmentId=xxx - Delete attachment
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAdmin(request);
    if ('error' in authResult) return authResult.error;

    const { id } = await context.params;
    const attachmentId = request.nextUrl.searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'attachmentId je obavezan' },
        { status: 400 }
      );
    }

    // Find attachment
    const attachment = await prisma.ticketAttachment.findUnique({
      where: { id: attachmentId },
      select: { id: true, ticketId: true, commentId: true, filePath: true },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Prilog nije pronađen' },
        { status: 404 }
      );
    }

    // Verify attachment belongs to this ticket (directly or through comment)
    if (attachment.ticketId !== id) {
      if (attachment.commentId) {
        const comment = await prisma.ticketComment.findUnique({
          where: { id: attachment.commentId },
          select: { ticketId: true },
        });
        if (!comment || comment.ticketId !== id) {
          return NextResponse.json(
            { error: 'Prilog ne pripada ovom tiketu' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Prilog ne pripada ovom tiketu' },
          { status: 403 }
        );
      }
    }

    // Delete file from filesystem
    try {
      const fullPath = join(process.cwd(), 'public', attachment.filePath);
      if (existsSync(fullPath)) {
        await unlink(fullPath);
      }
    } catch (fsError) {
      console.error('Error deleting file:', fsError);
      // Continue with database deletion even if file delete fails
    }

    // Delete from database
    await prisma.ticketAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Prilog uspješno obrisan',
    });
  } catch (error) {
    console.error('Attachment delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    );
  }
}

// GET /api/support-tickets/[id]/attachments - List attachments
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await context.params;

    // Check if ticket exists and user has access
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, submittedById: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Tiket nije pronađen' },
        { status: 404 }
      );
    }

    // Non-admins can only see attachments on their own tickets
    if (user.role !== 'ADMIN' && ticket.submittedById !== user.id) {
      return NextResponse.json(
        { error: 'Nemate dozvolu za pristup' },
        { status: 403 }
      );
    }

    const attachments = await prisma.ticketAttachment.findMany({
      where: { ticketId: id },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    console.error('Attachments GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}
