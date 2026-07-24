import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyAuth } from '@/lib/route-guards';
import { getTicketsQuerySchema } from '@/lib/validators/support-ticket';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { renderToStream } from '@react-pdf/renderer';
import { SupportTicketsPDF } from '@/components/support-tickets/SupportTicketsPDF';
import { Prisma } from '@prisma/client';

/**
 * GET /api/support-tickets/export
 *
 * Export support tickets to PDF with applied filters
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rate = rateLimit(`support-tickets:export:${ip}`, {
      windowMs: 60_000,
      max: 10,
    });

    if (!rate.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Previše zahtjeva. Pokušajte ponovo kasnije.',
        },
        { status: 429 }
      );
    }

    // Auth check
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: '1',
      limit: '1000', // Get all matching tickets for export
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      category: searchParams.get('category'),
      location: searchParams.get('location'),
      system: searchParams.get('system'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      reporterName: searchParams.get('reporterName'),
      assignedToId: searchParams.get('assignedToId'),
      submittedById: searchParams.get('submittedById'),
    };

    const validatedQuery = getTicketsQuerySchema.parse(queryParams);
    const { search, status, priority, category, location, system, dateFrom, dateTo, reporterName, assignedToId, submittedById } = validatedQuery;

    // Build where clause
    const where: Prisma.SupportTicketWhereInput = {
      AND: [
        // Non-admins can only see their own tickets
        user.role !== 'ADMIN' ? { submittedById: user.id } : {},
        // Filters
        status ? { status } : {},
        priority ? { priority } : {},
        category ? { category } : {},
        location ? { location } : {},
        system ? { system } : {},
        assignedToId ? { assignedToId } : {},
        submittedById && user.role === 'ADMIN' ? { submittedById } : {},
        // Date range filter (on createdAt)
        dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
        dateTo ? { createdAt: { lte: new Date(dateTo + 'T23:59:59.999Z') } } : {},
        // Reporter name filter
        reporterName ? { reporterName: { contains: reporterName, mode: 'insensitive' } } : {},
        // Search
        search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { reporterName: { contains: search, mode: 'insensitive' } },
                { submittedBy: { name: { contains: search, mode: 'insensitive' } } },
                { submittedBy: { email: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {},
      ],
    };

    // Fetch tickets with comments
    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          where: {
            isInternal: false, // Only public comments in export
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 1000, // Limit to 1000 tickets
    });

    console.log(`Generating PDF export for ${tickets.length} tickets`);

    // Build filters object for display
    const filters = {
      search: search || undefined,
      status: status || undefined,
      priority: priority || undefined,
      category: category || undefined,
      location: location || undefined,
      system: system || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      reporterName: reporterName || undefined,
    };

    // Generate PDF
    const pdfDocument = SupportTicketsPDF({
      tickets: tickets as any,
      filters,
      generatedAt: new Date(),
    }) as any;

    const stream = await renderToStream(pdfDocument);

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    console.log(`PDF generated successfully (${buffer.length} bytes)`);

    // Generate filename with date
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const fileName = `it-tiketi-${dateStr}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Support tickets PDF export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri generiranju PDF-a',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
