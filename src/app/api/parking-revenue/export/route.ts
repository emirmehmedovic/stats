import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import { format } from 'date-fns';
import { bs } from 'date-fns/locale';

async function requireParkingAccess(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const token = getTokenFromCookie(cookieHeader);

  if (!token) {
    return { error: NextResponse.json({ success: false, error: 'Niste autentifikovani' }, { status: 401 }) };
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return { error: NextResponse.json({ success: false, error: 'Niste autentifikovani' }, { status: 401 }) };
  }

  if (decoded.role !== 'ADMIN' && decoded.role !== 'PARKING') {
    return { error: NextResponse.json({ success: false, error: 'Nemate dozvolu za pristup' }, { status: 403 }) };
  }

  return { user: decoded };
}

// GET /api/parking-revenue/export - Eksport izvještaja
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireParkingAccess(request);
    if ('error' in authResult) return authResult.error;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'monthly'; // weekly, monthly, yearly, custom
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const exportFormat = searchParams.get('format') || 'csv'; // csv or json

    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    switch (type) {
      case 'weekly':
        // Last 7 days
        endDate = new Date(now);
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        break;
      case 'monthly':
        // Current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'yearly':
        // Current year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'custom':
        if (!dateFrom || !dateTo) {
          return NextResponse.json(
            { success: false, error: 'Za custom izvještaj potrebni su dateFrom i dateTo parametri' },
            { status: 400 }
          );
        }
        startDate = new Date(dateFrom);
        endDate = new Date(dateTo);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Nepoznat tip izvještaja' },
          { status: 400 }
        );
    }

    const revenues = await prisma.parkingRevenue.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    const totalAmount = revenues.reduce((sum, r) => sum + Number(r.amount), 0);

    if (exportFormat === 'json') {
      return NextResponse.json({
        success: true,
        data: {
          period: {
            from: startDate.toISOString().split('T')[0],
            to: endDate.toISOString().split('T')[0],
            type,
          },
          summary: {
            totalAmount,
            daysCount: revenues.length,
            dailyAverage: revenues.length > 0 ? Math.round((totalAmount / revenues.length) * 100) / 100 : 0,
          },
          records: revenues.map((r) => ({
            date: new Date(r.date).toISOString().split('T')[0],
            amount: Number(r.amount),
            notes: r.notes,
            createdBy: r.createdBy?.name || 'N/A',
          })),
        },
      });
    }

    // CSV format
    const monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];

    let csv = 'IZVJEŠTAJ O PRIHODIMA OD PARKINGA\n';
    csv += `Period: ${format(startDate, 'dd.MM.yyyy', { locale: bs })} - ${format(endDate, 'dd.MM.yyyy', { locale: bs })}\n`;
    csv += `Tip izvještaja: ${type === 'weekly' ? 'Sedmični' : type === 'monthly' ? 'Mjesečni' : type === 'yearly' ? 'Godišnji' : 'Custom'}\n`;
    csv += `Generisano: ${format(now, 'dd.MM.yyyy HH:mm', { locale: bs })}\n\n`;
    csv += 'Datum;Iznos (KM);Napomena;Unio\n';

    revenues.forEach((r) => {
      const dateStr = format(new Date(r.date), 'dd.MM.yyyy', { locale: bs });
      const amount = Number(r.amount).toFixed(2).replace('.', ',');
      const notes = r.notes ? r.notes.replace(/;/g, ',').replace(/\n/g, ' ') : '';
      const createdBy = r.createdBy?.name || 'N/A';
      csv += `${dateStr};${amount};${notes};${createdBy}\n`;
    });

    csv += '\nSUMARNO\n';
    csv += `Ukupan broj dana;${revenues.length}\n`;
    csv += `Ukupan iznos;${totalAmount.toFixed(2).replace('.', ',')} KM\n`;
    csv += `Prosječno dnevno;${revenues.length > 0 ? (totalAmount / revenues.length).toFixed(2).replace('.', ',') : '0,00'} KM\n`;

    // Group by month for yearly report
    if (type === 'yearly') {
      csv += '\nPO MJESECIMA\n';
      csv += 'Mjesec;Iznos (KM);Broj dana\n';
      for (let month = 0; month < 12; month++) {
        const monthRevenues = revenues.filter((r) => new Date(r.date).getMonth() === month);
        const monthTotal = monthRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
        if (monthTotal > 0 || monthRevenues.length > 0) {
          csv += `${monthNames[month]};${monthTotal.toFixed(2).replace('.', ',')};${monthRevenues.length}\n`;
        }
      }
    }

    const filename = `parking-izvjestaj-${type}-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting parking revenue:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri eksportovanju izvještaja' },
      { status: 500 }
    );
  }
}
