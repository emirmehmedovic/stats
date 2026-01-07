import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/airlines/[id]/logo - Upload airline logo
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const ip = getClientIp(request);
    const rate = rateLimit(`upload:airline-logo:${ip}`, { windowMs: 60_000, max: 20 });
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Previše zahtjeva. Pokušajte ponovo kasnije.' },
        { status: 429 }
      );
    }

    const { id } = await context.params;

    // Provjera da li aviokompanija postoji
    const airline = await prisma.airline.findUnique({
      where: { id },
    });

    if (!airline) {
      return NextResponse.json(
        { error: 'Aviokompanija nije pronađena' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nije priložena slika' },
        { status: 400 }
      );
    }

    // Validacija tipa fajla - samo slike
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nepodržan tip fajla. Dozvoljeni su samo slike (JPEG, PNG, WebP, SVG)' },
        { status: 400 }
      );
    }

    // Validacija veličine (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Slika je prevelika. Maksimalna veličina je 5MB' },
        { status: 400 }
      );
    }

    // Kreiranje unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = file.name.split('.').pop() || 'png';
    const fileName = `airline_${id}_${timestamp}.${fileExtension}`;
    
    // Putanja za čuvanje
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'airlines');
    
    // Kreiranje direktorija ako ne postoji
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filePath = join(uploadsDir, fileName);
    const publicPath = `/uploads/airlines/${fileName}`;

    // Brišemo staru sliku ako postoji
    if (airline.logoUrl) {
      const oldFilePath = join(process.cwd(), 'public', airline.logoUrl);
      if (existsSync(oldFilePath)) {
        try {
          await unlink(oldFilePath);
        } catch (err) {
          console.error('Error deleting old logo:', err);
          // Nastavljamo i ako brisanje starih slika ne uspije
        }
      }
    }

    // Čuvanje fajla
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Ažuriranje aviokompanije sa novim logo URL-om
    const updatedAirline = await prisma.airline.update({
      where: { id },
      data: {
        logoUrl: publicPath,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedAirline,
      message: 'Logo je uspješno uploadovan',
    }, { status: 200 });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Greška pri uploadovanju logoa' },
      { status: 500 }
    );
  }
}

// DELETE /api/airlines/[id]/logo - Delete airline logo
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const ip = getClientIp(request);
    const rate = rateLimit(`upload:airline-logo:${ip}`, { windowMs: 60_000, max: 20 });
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Previše zahtjeva. Pokušajte ponovo kasnije.' },
        { status: 429 }
      );
    }

    const { id } = await context.params;

    const airline = await prisma.airline.findUnique({
      where: { id },
    });

    if (!airline) {
      return NextResponse.json(
        { error: 'Aviokompanija nije pronađena' },
        { status: 404 }
      );
    }

    if (!airline.logoUrl) {
      return NextResponse.json(
        { error: 'Aviokompanija nema logo' },
        { status: 400 }
      );
    }

    // Brišemo fajl sa diska
    const filePath = join(process.cwd(), 'public', airline.logoUrl);
    if (existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch (err) {
        console.error('Error deleting logo file:', err);
      }
    }

    // Ažuriranje aviokompanije - uklanjamo logoUrl
    const updatedAirline = await prisma.airline.update({
      where: { id },
      data: {
        logoUrl: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedAirline,
      message: 'Logo je uspješno obrisan',
    });
  } catch (error) {
    console.error('Logo delete error:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju logoa' },
      { status: 500 }
    );
  }
}
