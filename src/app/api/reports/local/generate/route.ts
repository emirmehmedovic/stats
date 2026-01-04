import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * POST /api/reports/local/generate
 * Generiše lokalnu statistiku
 *
 * Body:
 * {
 *   "year": 2025,
 *   "month": 10
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month } = body;

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Godina i mjesec su obavezni' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Mjesec mora biti između 1 i 12' },
        { status: 400 }
      );
    }

    const projectRoot = path.join(process.cwd());
    const scriptPath = path.join(projectRoot, 'scripts', 'generate_local_stats.py');

    try {
      await fs.access(scriptPath);
    } catch (error) {
      return NextResponse.json(
        { error: 'Python skripta ne postoji' },
        { status: 500 }
      );
    }

    console.log(`Pokrećem Python skriptu: ${scriptPath} ${year} ${month}`);

    try {
      const { stdout, stderr } = await execAsync(
        `python3 "${scriptPath}" ${year} ${month}`,
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

      if (stdout.includes('UPOZORENJE: Nema letova za zadati period!')) {
        return NextResponse.json(
          {
            error: 'Nema podataka za odabrani period',
            details: 'Nema letova u bazi za odabrani mjesec.',
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
