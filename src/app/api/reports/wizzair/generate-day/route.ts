import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import { writeReportMetadata } from '@/lib/report-metadata';

const execAsync = promisify(exec);

/**
 * POST /api/reports/wizzair/generate-day
 * Generiše Wizz Air Daily Performance izvještaj za jedan dan
 *
 * Body:
 * {
 *   "year": 2025,
 *   "month": 10,
 *   "day": 12
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, day } = body;

    if (!year || !month || !day) {
      return NextResponse.json(
        { error: 'Godina, mjesec i dan su obavezni' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Mjesec mora biti između 1 i 12' },
        { status: 400 }
      );
    }

    if (day < 1 || day > 31) {
      return NextResponse.json(
        { error: 'Dan mora biti između 1 i 31' },
        { status: 400 }
      );
    }

    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      return NextResponse.json(
        { error: 'Ne možete generisati izvještaj za budući datum' },
        { status: 400 }
      );
    }

    const projectRoot = path.join(process.cwd());
    const scriptPath = path.join(projectRoot, 'scripts', 'generate_wizzair_performance.py');

    try {
      await fs.access(scriptPath);
    } catch (error) {
      return NextResponse.json(
        { error: 'Python skripta ne postoji' },
        { status: 500 }
      );
    }

    console.log(`Pokrećem Python skriptu: ${scriptPath} ${year} ${month} ${day}`);

    try {
      const { stdout, stderr } = await execAsync(
        `python3 "${scriptPath}" ${year} ${month} ${day}`,
        {
          env: {
            ...process.env,
            PYTHONIOENCODING: 'utf-8',
          },
          maxBuffer: 10 * 1024 * 1024,
        }
      );

      console.log('Python stdout:', stdout);
      if (stderr) {
        console.error('Python stderr:', stderr);
      }

      if (stdout.includes('UPOZORENJE: Nema Wizz Air letova za zadati period!')) {
        return NextResponse.json(
          {
            error: 'Nema podataka za odabrani dan',
            details: 'Nema Wizz Air letova u bazi za odabrani dan.',
            output: stdout,
          },
          { status: 404 }
        );
      }

      const filePathMatch = stdout.match(/Čuvam izvještaj u: (.+\.xlsx)/);
      if (!filePathMatch) {
        throw new Error('Ne mogu pronaći putanju do generisanog fajla');
      }

      const generatedFilePath = filePathMatch[1].trim();

      try {
        await fs.access(generatedFilePath);
      } catch (error) {
        throw new Error(`Generisani fajl ne postoji: ${generatedFilePath}`);
      }

      const fileName = path.basename(generatedFilePath);

      try {
        const token = getTokenFromCookie(request.headers.get('cookie'));
        const user = token ? await verifyToken(token) : null;
        await writeReportMetadata(generatedFilePath, user);
      } catch (error) {
        console.warn('Report metadata write failed:', error);
      }

      return NextResponse.json({
        success: true,
        message: 'Izvještaj uspješno generisan',
        filePath: generatedFilePath,
        fileName: fileName,
        output: stdout,
      });
    } catch (execError: any) {
      console.error('Greška pri izvršavanju Python skripte:', execError);
      return NextResponse.json(
        {
          error: 'Greška pri generisanju izvještaja',
          details: execError.message,
          stdout: execError.stdout,
          stderr: execError.stderr,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Greška u API endpoint-u:', error);
    return NextResponse.json(
      {
        error: 'Nepoznata greška',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
