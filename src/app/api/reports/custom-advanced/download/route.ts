import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json(
        { error: 'Ime fajla nije proslijeđeno' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'izvještaji', 'generated', fileName);
    const fileBuffer = await readFile(filePath);

    // RFC 5987 encoding za imena sa specijalnim karakterima
    const encodedFilename = encodeURIComponent(fileName);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    console.error('Error downloading custom report:', error);
    return NextResponse.json(
      { error: 'Greška pri preuzimanju izvještaja' },
      { status: 500 }
    );
  }
}
