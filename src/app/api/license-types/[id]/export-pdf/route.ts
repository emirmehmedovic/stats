import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireNonOperations } from '@/lib/route-guards';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/license-types/[id]/export-pdf - Export licence u PDF format
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

    // Pronađi tip licence
    const licenseType = await prisma.licenseType.findUnique({
      where: { id },
    });

    if (!licenseType) {
      return NextResponse.json(
        { error: 'License type not found' },
        { status: 404 }
      );
    }

    // Pronađi sve licence ovog tipa
    const licenses = await prisma.license.findMany({
      where: {
        licenseTypeId: id,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
            sector: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    // Generiši HTML za PDF
    const html = generatePDFHTML(licenseType, licenses);

    // Vrati HTML sa proper headers za download
    // RFC 5987 encoding za imena sa specijalnim karakterima
    const fileName = `licenca-${licenseType.code || 'izvjestaj'}.html`;
    const encodedFilename = encodeURIComponent(fileName);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    console.error('Error exporting license type PDF:', error);
    return NextResponse.json(
      { error: 'Failed to export PDF' },
      { status: 500 }
    );
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('bs-BA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getStatus(status: string, expiryDate: string): string {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (status === 'EXPIRED' || daysUntilExpiry < 0) {
    return 'Istekla';
  }
  if (daysUntilExpiry <= 30) {
    return 'Ističe uskoro';
  }
  return 'Aktivna';
}

function generatePDFHTML(licenseType: any, licenses: any[]): string {
  const rows = licenses.map((license, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${license.employee.firstName} ${license.employee.lastName}<br><small>${license.employee.employeeNumber}</small></td>
      <td>${license.employee.sector?.name || '-'}</td>
      <td>${license.employee.service?.name || '-'}</td>
      <td>${license.employee.position}</td>
      <td>${license.licenseNumber}</td>
      <td>${formatDate(license.issuedDate)}</td>
      <td>${formatDate(license.expiryDate)}</td>
      <td>${getStatus(license.status, license.expiryDate)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Izvještaj - ${licenseType.name}</title>
  <style>
    @media print {
      @page {
        margin: 1cm;
        size: A4 landscape;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .no-print {
        display: none;
      }
    }

    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: white;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #334155;
      padding-bottom: 20px;
    }

    .header h1 {
      margin: 0 0 10px 0;
      color: #1e293b;
      font-size: 24px;
    }

    .header p {
      margin: 5px 0;
      color: #64748b;
      font-size: 14px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    thead {
      background-color: #334155;
      color: white;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    th {
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      font-size: 14px;
      color: #1e293b;
    }

    tbody tr:hover {
      background-color: #f8fafc;
    }

    small {
      color: #64748b;
      font-size: 11px;
      font-family: monospace;
    }

    .footer {
      text-align: center;
      color: #64748b;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .no-print {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    }

    .btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .btn:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn" onclick="window.print()">📄 Preuzmi PDF</button>
  </div>

  <div class="header">
    <h1>${licenseType.name}</h1>
    ${licenseType.code ? `<p><strong>Kod:</strong> ${licenseType.code}</p>` : ''}
    ${licenseType.validityPeriodMonths ? `<p><strong>Period važenja:</strong> ${licenseType.validityPeriodMonths} mjeseci</p>` : ''}
    <p><strong>Datum izvještaja:</strong> ${formatDate(new Date().toISOString())}</p>
    <p><strong>Ukupno radnika:</strong> ${licenses.length}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 4%">#</th>
        <th style="width: 18%">Radnik</th>
        <th style="width: 12%">Sektor</th>
        <th style="width: 12%">Služba</th>
        <th style="width: 14%">Pozicija</th>
        <th style="width: 12%">Broj licence</th>
        <th style="width: 10%">Sticanje</th>
        <th style="width: 10%">Istek</th>
        <th style="width: 8%">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #94a3b8;">Nema radnika sa ovom licencom</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <p>Generisano automatski - Sistem za upravljanje licencama</p>
    <p>${new Date().toLocaleString('bs-BA')}</p>
  </div>

  <script>
    // Auto-print kada se učita (opcionalno)
    // window.onload = () => window.print();
  </script>
</body>
</html>
  `.trim();
}
