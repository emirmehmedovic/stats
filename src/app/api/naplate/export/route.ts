import { NextRequest, NextResponse } from 'next/server';
import { requireNaplateAccess } from '@/lib/route-guards';
import { prisma } from '@/lib/prisma';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';

const buildDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
};

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireNaplateAccess(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    if (!date) {
      return NextResponse.json({ error: 'Nedostaje datum' }, { status: 400 });
    }

    const periodStart = buildDate(date);
    if (!periodStart) {
      return NextResponse.json({ error: 'Neispravan datum' }, { status: 400 });
    }

    const report = await prisma.billingReport.findUnique({
      where: {
        type_periodStart: {
          type: 'DAILY',
          periodStart,
        },
      },
    });

    if (!report?.data) {
      return NextResponse.json({ error: 'Izvještaj nije pronađen' }, { status: 404 });
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'naplate-'));
    const jsonPath = path.join(tempDir, 'report.json');
    const outputPath = path.join(tempDir, `Dnevni-izvjestaj-${date}.xlsx`);
    const templatePath = path.join(process.cwd(), 'templates', 'naplate_daily_template.xlsx');
    const scriptPath = path.join(process.cwd(), 'scripts', 'export_naplate_daily.py');

    await fs.writeFile(jsonPath, JSON.stringify(report.data));

    const pythonProcess = spawn('python3', [scriptPath, jsonPath, templatePath, outputPath]);

    let stderr = '';
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    return await new Promise<NextResponse>((resolve) => {
      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          console.error('Export script error:', stderr);
          resolve(NextResponse.json({ error: 'Greška pri eksportu' }, { status: 500 }));
          return;
        }

        try {
          const fileBuffer = await fs.readFile(outputPath);
          const response = new NextResponse(fileBuffer);
          response.headers.set(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          );
          response.headers.set(
            'Content-Disposition',
            `attachment; filename="Dnevni-izvjestaj-${date}.xlsx"`
          );
          resolve(response);
        } catch (error) {
          console.error('Export read error:', error);
          resolve(NextResponse.json({ error: 'Greška pri eksportu' }, { status: 500 }));
        }
      });
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Greška pri eksportu' }, { status: 500 });
  }
}
