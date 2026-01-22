import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/reports/customs/download?fileName=Statistika_za_carinu_Oktobar_2025.xlsx
 * Preuzmi generisani carinski izvještaj
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

    if (!fileName.endsWith('.xlsx') || fileName.includes('..') || fileName.includes('/')) {
      return NextResponse.json(
        { error: 'Nevalidan naziv fajla' },
        { status: 400 }
      );
    }

    const projectRoot = process.cwd();
    const filePath = path.join(projectRoot, 'izvještaji', 'generated', fileName);

    try {
      const fileBuffer = await readFile(filePath);

      // RFC 5987 encoding za imena sa specijalnim karakterima
      const encodedFilename = encodeURIComponent(fileName);

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
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
