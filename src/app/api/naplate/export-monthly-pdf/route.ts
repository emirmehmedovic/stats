import { NextRequest, NextResponse } from 'next/server';
import { requireNaplateAccess } from '@/lib/route-guards';
import { prisma } from '@/lib/prisma';
import { aggregateDailyReports } from '@/lib/naplate-aggregate';
import {
  defaultFxRate,
  getBookingTotals,
  getCarrierTotalEur,
  getServiceAmount,
  normalizeDailyReport,
  type DailyReport,
} from '@/lib/naplate-config';

export const runtime = 'nodejs';

const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
};

const formatMoney = (value: number) => value.toFixed(2);
const formatRate = (value: number) => value.toFixed(5);

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireNaplateAccess(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (!from || !to) {
      return NextResponse.json({ error: 'Nedostaje raspon datuma' }, { status: 400 });
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
    const recapCash = normalized.reduce((sum, rep) => sum + Number(rep.recap?.cashKm || 0), 0);
    const recapCards = normalized.reduce((sum, rep) => sum + Number(rep.recap?.cardsKm || 0), 0);

    const html = generatePDFHTML(aggregated, rangeLabel, { recapCash, recapCards });
    const fileName = `Mjesecni-izvjestaj-${from}-${to}.html`;
    const encodedFilename = encodeURIComponent(fileName);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    console.error('Monthly PDF export error:', error);
    return NextResponse.json({ error: 'Greška pri eksportu PDF-a' }, { status: 500 });
  }
}

function generatePDFHTML(
  report: DailyReport,
  rangeLabel: string,
  recap: { recapCash: number; recapCards: number }
): string {
  const carrierSections = Object.keys(report.carriers).map((carrierKey) => {
    const carrier = report.carriers[carrierKey];
    const label = carrier?.label || carrierKey;
    const services = (carrier?.services || []).filter((service) => Number(service.qty || 0) > 0);
    if (!services.length) return '';

    const servicesTotalEur = services.reduce((sum, item) => sum + getServiceAmount(item), 0);
    const serviceQty = services.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const serviceRows = services.map((service) => `
        <tr>
          <td>${service.label}</td>
          <td>${service.code || ''}</td>
          <td>${service.unit || ''}</td>
          <td class="right">${formatMoney(service.price || 0)}</td>
          <td class="right">${Number(service.qty || 0)}</td>
          <td class="right">${formatMoney(getServiceAmount(service))}</td>
          <td>${service.currency || 'EUR'}</td>
        </tr>
      `).join('');

    const bookingTotals = getBookingTotals(report, carrierKey as keyof typeof report.carriers);
    const bookingRows = (carrier?.bookings?.transactions || []).map((txn) => `
        <tr>
          <td class="right">${formatMoney(txn.amountEur || 0)}</td>
          <td>${txn.pnr || '-'}</td>
          <td class="right">${Number(txn.pax || 0)}</td>
          <td>EUR</td>
        </tr>
      `).join('');

    return `
      <div class="section">
        <h2>1. OTHER ${label} SERVICES SOLD TO THE PASSENGERS AT AIRPORT</h2>
        <table>
          <thead>
            <tr>
              <th>Fee types</th>
              <th>Fees code</th>
              <th>Charged</th>
              <th class="right">EUR</th>
              <th class="right">QTY</th>
              <th class="right">Amount</th>
              <th>Valute</th>
            </tr>
          </thead>
          <tbody>
            ${serviceRows || '<tr><td colspan="7">Nema stavki</td></tr>'}
            <tr class="summary">
              <td colspan="5">Total ${label} other services /in "SKY SPEED"/</td>
              <td class="right">${formatMoney(servicesTotalEur)}</td>
              <td>EUR</td>
            </tr>
            <tr class="summary">
              <td colspan="5">Airport remunerations (dodatni aerodromski servis)</td>
              <td class="right">${formatMoney(serviceQty * 10)}</td>
              <td>KM</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>2. BOOKINGS FOR ${label.toUpperCase()} FLIGHTS SOLD TO THE PAX AT AIRPORT</h2>
        <div class="note">Airport ticket</div>
        <table>
          <thead>
            <tr>
              <th>Bookings Sold / AMOUNT</th>
              <th>PNR</th>
              <th class="right">No:PAX</th>
              <th>Valute</th>
            </tr>
          </thead>
          <tbody>
            ${bookingRows || '<tr><td colspan="4">Nema booking transakcija</td></tr>'}
            <tr class="summary">
              <td class="right">${formatMoney(bookingTotals.amountEur)}</td>
              <td colspan="2">Total amount for ${label} bookings /in "SKY SPEED"/</td>
              <td>EUR</td>
            </tr>
            <tr class="summary">
              <td class="right">${formatMoney(bookingTotals.airportRemunerationKm)}</td>
              <td colspan="2">Airport remuneration (Provizija na kartu)</td>
              <td>KM</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }).filter(Boolean).join('');

  const carrierTotals = Object.keys(report.carriers).map((carrier) => ({
    key: carrier,
    label: report.carriers[carrier]?.label || carrier,
    totalEur: getCarrierTotalEur(report, carrier),
  }));

  const totalEurAll = carrierTotals.reduce((sum, item) => sum + item.totalEur, 0);
  const serviceRemunerationKm = Object.keys(report.carriers).reduce((sum, carrier) => {
    const services = report.carriers[carrier]?.services || [];
    const qtyTotal = services.reduce((acc, item) => acc + Number(item.qty || 0), 0);
    return sum + qtyTotal * 10;
  }, 0);
  const bookingRemunerationKm = Object.keys(report.carriers).reduce((sum, carrier) => {
    const totals = getBookingTotals(report, carrier);
    return sum + totals.airportRemunerationKm;
  }, 0);
  const airportServicesTotalKm = report.airportServices.reduce((sum, item) => sum + getServiceAmount(item), 0);
  const amountAirportKm = airportServicesTotalKm + serviceRemunerationKm + bookingRemunerationKm;
  const totalKm = totalEurAll * defaultFxRate + amountAirportKm;

  const airportServicesRows = report.airportServices.map((service) => {
    const amount = getServiceAmount(service);
    const qty = Number(service.qty || 0);
    const displayQty = service.id === 'airport_donation' ? '' : qty.toString();
    return `
      <tr>
        <td>${service.label}</td>
        <td class="right">${displayQty}</td>
        <td class="right">${formatMoney(service.price || 0)}</td>
        <td class="right">${formatMoney(amount)}</td>
        <td>KM</td>
      </tr>
    `;
  }).join('');

  const summaryRows = carrierTotals.map((item) => `
      <tr>
        <td>Amount for ${item.label}</td>
        <td class="right">${formatMoney(item.totalEur)}</td>
        <td>EUR</td>
      </tr>
    `).join('');

  const recapCash = recap.recapCash;
  const recapCards = recap.recapCards;
  const recapTotal = recapCash + recapCards;

  return `
<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mjesečni naplatni izvještaj</title>
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
    .summary { background: #f1f5f9; font-weight: 700; }
    .note { font-size: 11px; color: #64748b; margin-bottom: 6px; }
    .section { margin-bottom: 22px; padding: 12px 12px 4px; border: 1px solid #e2e8f0; border-radius: 8px; }
    .summary-table td { font-weight: 700; }
    .summary-table tr:last-child td { background: #e0e7ff; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 12px;">
    <button onclick="window.print()">📄 Preuzmi PDF</button>
  </div>

  <div class="header">
    <img src="/AerodromMat-logo.png" alt="Aerodrom Tuzla" />
    <div>
      <h1>Mjesečni naplatni izvještaj</h1>
      <div class="note">Period: ${rangeLabel}</div>
    </div>
  </div>

  ${carrierSections || '<div class="note">Nema usluga za prikaz.</div>'}

  <div class="section">
    <h2>Aerodromske usluge</h2>
    <table>
      <thead>
        <tr>
          <th>Usluga</th>
          <th class="right">QTY</th>
          <th class="right">Cijena</th>
          <th class="right">Iznos</th>
          <th>Valuta</th>
        </tr>
      </thead>
      <tbody>
        ${airportServicesRows}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Summary</h2>
    <table class="summary-table">
      <tbody>
        ${summaryRows}
        <tr>
          <td>Amount for Airport Tuzla</td>
          <td class="right">${formatMoney(amountAirportKm)}</td>
          <td>KM</td>
        </tr>
        <tr>
          <td>Total amount</td>
          <td class="right">${formatMoney(totalKm)}</td>
          <td>KM</td>
        </tr>
      </tbody>
    </table>
    <div class="note">Kurs EUR → KM: ${formatRate(defaultFxRate)}</div>
  </div>

  <div class="section">
    <h2>Rekapitulacija</h2>
    <table class="summary-table">
      <tbody>
        <tr>
          <td>Gotovina</td>
          <td class="right">${formatMoney(recapCash)}</td>
          <td>KM</td>
        </tr>
        <tr>
          <td>Kartice</td>
          <td class="right">${formatMoney(recapCards)}</td>
          <td>KM</td>
        </tr>
        <tr>
          <td>Ukupno</td>
          <td class="right">${formatMoney(recapTotal)}</td>
          <td>KM</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>
  `;
}
