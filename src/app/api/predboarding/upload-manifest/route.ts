import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { requireSTW } from '@/lib/route-guards';
import { spawn } from 'child_process';

/**
 * POST /api/predboarding/upload-manifest
 *
 * Upload i parsiraj manifest fajl za let
 * Auth: requireSTW (STW ili ADMIN)
 */
export async function POST(request: Request) {
  const authCheck = await requireSTW(request);
  if ('error' in authCheck) return authCheck.error;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const flightId = formData.get('flightId') as string;

    // Validate inputs
    if (!file || !flightId) {
      return NextResponse.json(
        { error: 'Fajl i flightId su obavezni' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.txt')) {
      return NextResponse.json(
        { error: 'Fajl mora biti .txt format' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Fajl mora biti manji od 5MB' },
        { status: 400 }
      );
    }

    // Check if flight exists and is valid for boarding
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      include: { boardingManifest: true }
    });

    if (!flight) {
      return NextResponse.json(
        { error: 'Let ne postoji' },
        { status: 404 }
      );
    }

    // Check if already has manifest
    if (flight.boardingManifest) {
      return NextResponse.json(
        { error: 'Let već ima aktivan manifest' },
        { status: 400 }
      );
    }

    // Validate flight is today and hasn't departed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const flightDate = new Date(flight.date);
    flightDate.setHours(0, 0, 0, 0);

    if (flightDate.getTime() !== today.getTime()) {
      return NextResponse.json(
        { error: 'Može se uraditi boarding samo za današnje letove' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (flight.departureActualTime && new Date(flight.departureActualTime) < now) {
      return NextResponse.json(
        { error: 'Let je već otišao' },
        { status: 400 }
      );
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'manifests');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `${flightId}-${timestamp}.txt`;
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Parse manifest using Python script
    const scriptPath = join(process.cwd(), 'scripts', 'parse_manifest.py');
    const pythonProcess = spawn('python3', [scriptPath, filepath]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    return new Promise<NextResponse>((resolve) => {
      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          console.error('Python script error:', stderr);
          resolve(
            NextResponse.json(
              { error: 'Greška pri parsiranju manifesta' },
              { status: 500 }
            )
          );
          return;
        }

        try {
          const result = JSON.parse(stdout);

          if (!result.success) {
            resolve(
              NextResponse.json(
                { error: result.error || 'Greška pri parsiranju' },
                { status: 500 }
              )
            );
            return;
          }

          // Create manifest record with passengers
          const manifest = await prisma.boardingManifest.create({
            data: {
              flightId,
              originalFileName: file.name,
              filePath: `/uploads/manifests/${filename}`,
              fileSize: file.size,
              uploadedByUserId: authCheck.user.id,
              boardingStatus: 'IN_PROGRESS',
              passengers: {
                create: result.data.passengers.map((p: any) => ({
                  seatNumber: p.seatNumber,
                  passengerName: p.passengerName,
                  title: p.title,
                  isInfant: p.isInfant,
                  passengerId: p.passengerId,
                  fareClass: p.fareClass,
                  confirmationDate: p.confirmationDate,
                  boardingStatus: 'NO_SHOW' // Default status je NO_SHOW
                }))
              }
            },
            include: {
              passengers: true,
              _count: {
                select: { passengers: true }
              }
            }
          });

          resolve(
            NextResponse.json({
              success: true,
              data: manifest,
              message: `Manifest uspješno uploadovan. Učitano ${result.data.passengers.length} putnika.`
            })
          );
        } catch (error) {
          console.error('Error creating manifest:', error);
          resolve(
            NextResponse.json(
              { error: 'Greška pri kreiranju manifesta' },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error) {
    console.error('Error uploading manifest:', error);
    return NextResponse.json(
      { error: 'Greška pri uploadu manifesta' },
      { status: 500 }
    );
  }
}
