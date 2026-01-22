import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json({ error: 'fileName je obavezan' }, { status: 400 });
    }

    const safeName = path.basename(fileName);
    if (safeName !== fileName) {
      return NextResponse.json({ error: 'Nevažeće ime fajla' }, { status: 400 });
    }

    const generatedDir = path.join(process.cwd(), 'izvještaji', 'generated');
    const filePath = path.join(generatedDir, safeName);
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(generatedDir) + path.sep)) {
      return NextResponse.json({ error: 'Nevažeća putanja fajla' }, { status: 400 });
    }

    const fileBuffer = await fs.readFile(filePath);

    // RFC 5987 encoding za imena sa specijalnim karakterima
    const encodedFilename = encodeURIComponent(safeName);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Error downloading generated report:', error);
    return NextResponse.json(
      { error: 'Fajl nije pronađen' },
      { status: 404 }
    );
  }
}
