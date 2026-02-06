import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { aggregateDailyReports } from '@/lib/naplate-aggregate';
import { getBookingTotals, getServiceAmount, normalizeDailyReport, type DailyReport } from '@/lib/naplate-config';

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatMoney = (value: number) => value.toFixed(2);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const carrier = searchParams.get('carrier');

    if (!from || !to || !carrier) {
      return NextResponse.json({ error: 'Nedostaju parametri za eksport' }, { status: 400 });
    }

    const fromDate = parseDate(from);
    const toDate = parseDate(to);
    if (!fromDate || !toDate) {
      return NextResponse.json({ error: 'Neispravan raspon datuma' }, { status: 400 });
    }

    const reports = await prisma.billingReport.findMany({
      where: {
        type: 'DAILY',
        periodStart: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { periodStart: 'asc' },
    });

    if (!reports.length) {
      return NextResponse.json({ error: 'Nema izvještaja u traženom periodu' }, { status: 404 });
    }

    const normalized = reports
      .map((report) => normalizeDailyReport(report.data as any))
      .filter(Boolean);
    const rangeLabel = `${from} - ${to}`;
    const aggregated = aggregateDailyReports(normalized, rangeLabel);

    const html = generatePDFHTML(aggregated, rangeLabel, carrier);
    const fileName = `Izvjestaj-${carrier}-${from}-${to}.html`;
    const encodedFilename = encodeURIComponent(fileName);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    console.error('Monthly carrier PDF export error:', error);
    return NextResponse.json({ error: 'Greška pri eksportu PDF-a' }, { status: 500 });
  }
}

function generatePDFHTML(report: DailyReport, rangeLabel: string, carrierKey: string): string {
  const carrier = report.carriers[carrierKey];
  if (!carrier) {
    return `
<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8">
  <title>Izvještaj po aviokompaniji</title>
</head>
<body>
  <p>Nema podataka za odabranu aviokompaniju.</p>
</body>
</html>
    `;
  }

  const label = carrier?.label || carrierKey;
  const services = (carrier?.services || []).filter((service) => Number(service.qty || 0) > 0);
  const servicesTotalEur = services.reduce((sum, item) => sum + getServiceAmount(item), 0);
  const servicesRows = services.map((service) => `
      <tr>
        <td>${service.label}</td>
        <td>${service.code || ''}</td>
        <td>${service.unit || ''}</td>
        <td class="right">${formatMoney(service.price || 0)}</td>
        <td class="right">${Number(service.qty || 0)}</td>
        <td class="right">${formatMoney(getServiceAmount(service))}</td>
        <td>EUR</td>
      </tr>
    `).join('');

  const bookings = carrier?.bookings?.transactions || [];
  const bookingTotals = getBookingTotals(report, carrierKey as keyof typeof report.carriers);
  const bookingRows = bookings.map((txn) => `
      <tr>
        <td class="right">${formatMoney(txn.amountEur || 0)}</td>
        <td>${txn.pnr || '-'}</td>
        <td class="right">${Number(txn.pax || 0)}</td>
        <td>EUR</td>
      </tr>
    `).join('');

  const totalEur = Number((servicesTotalEur + bookingTotals.amountEur).toFixed(2));

  return `
<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Izvještaj po aviokompaniji</title>
  <style>
    @media print {
      @page { margin: 1cm; size: A4 portrait; }
      .no-print { display: none; }
    }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 24px; color: #0f172a; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
    .header img { height: 40px; }
    h1 { font-size: 22px; margin: 0; letter-spacing: 0.2px; }
    h2 { font-size: 16px; margin: 22px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #cbd5f5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 12px; }
    th { background: #e0e7ff; text-align: left; font-weight: 700; }
    .right { text-align: right; }
    .summary-table td { font-weight: 700; }
    .summary-table tr:last-child td { background: #e0e7ff; }
    .note { font-size: 11px; color: #64748b; margin-bottom: 6px; }
    .section { margin-bottom: 22px; padding: 12px 12px 4px; border: 1px solid #e2e8f0; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 12px;">
    <button onclick="window.print()">📄 Preuzmi PDF</button>
  </div>

  <div class="header">
    <img src="/AerodromMat-logo.png" alt="Aerodrom Tuzla" />
    <div>
      <h1>Izvještaj po aviokompaniji</h1>
      <div class="note">Aviokompanija: ${label}</div>
      <div class="note">Period: ${rangeLabel}</div>
    </div>
  </div>

  <div class="section">
    <h2>Usluge</h2>
    <table>
      <thead>
        <tr>
          <th>Usluga</th>
          <th>Šifra</th>
          <th>Jedinica</th>
          <th class="right">Cijena</th>
          <th class="right">QTY</th>
          <th class="right">Iznos</th>
          <th>Valuta</th>
        </tr>
      </thead>
      <tbody>
        ${servicesRows || '<tr><td colspan="7" class="right">Nema usluga</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Bookings</h2>
    <table>
      <thead>
        <tr>
          <th class="right">Amount</th>
          <th>PNR</th>
          <th class="right">No:PAX</th>
          <th>Valuta</th>
        </tr>
      </thead>
      <tbody>
        ${bookingRows || '<tr><td colspan="4" class="right">Nema bookinga</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Summary</h2>
    <table class="summary-table">
      <tbody>
        <tr>
          <td>Usluge ukupno</td>
          <td class="right">${formatMoney(servicesTotalEur)}</td>
          <td>EUR</td>
        </tr>
        <tr>
          <td>Bookings ukupno</td>
          <td class="right">${formatMoney(bookingTotals.amountEur)}</td>
          <td>EUR</td>
        </tr>
        <tr>
          <td>Ukupno</td>
          <td class="right">${formatMoney(totalEur)}</td>
          <td>EUR</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>
  `;
}
