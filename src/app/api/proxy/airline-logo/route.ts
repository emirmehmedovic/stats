import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/proxy/airline-logo?url=...
 *
 * Proxy endpoint for fetching airline logos
 * Converts external images to base64 for use in PDF generation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const logoUrl = searchParams.get('url');

    if (!logoUrl) {
      return NextResponse.json(
        { error: 'URL parametar je obavezan' },
        { status: 400 }
      );
    }

    // Fetch the image
    const response = await fetch(logoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TZL-Stats/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.statusText}`);
    }

    // Get the image as buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to base64
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (error) {
    console.error('Logo proxy error:', error);
    return NextResponse.json(
      {
        error: 'Greška pri preuzimanju logotipa',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
