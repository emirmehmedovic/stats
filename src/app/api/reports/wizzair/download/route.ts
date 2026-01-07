import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/reports/wizzair/download?fileName=Wizz_Air_Performance_Oktobar_2025.xlsx
 * Preuzmi generisani Wizz Air Performance izvještaj
 */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = rateLimit(`download:reports:${ip}`, { windowMs: 60_000, max: 30 });
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Previše zahtjeva. Pokušajte ponovo kasnije.' },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName parametar je obavezan' },
        { status: 400 }
      );
    }

    // Sigurnosna provjera: samo .xlsx fajlovi i bez path traversal
    if (!fileName.endsWith('.xlsx') || fileName.includes('..') || fileName.includes('/')) {
      return NextResponse.json(
        { error: 'Nevalidan naziv fajla' },
        { status: 400 }
      );
    }

    // Putanja do generisanog fajla
    const projectRoot = process.cwd();
    const filePath = path.join(projectRoot, 'izvještaji', 'generated', fileName);

    // Čitanje fajla
    try {
      const fileBuffer = await readFile(filePath);

      // Vraćanje fajla kao download
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch (error) {
      console.error('Greška pri čitanju fajla:', error);
      return NextResponse.json(
        { error: 'Fajl nije pronađen' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Greška u download endpoint-u:', error);
    return NextResponse.json(
      { error: 'Nepoznata greška', details: error.message },
      { status: 500 }
    );
  }
}
