import { NextRequest, NextResponse } from 'next/server';
import { requireNaplateAccess } from '@/lib/route-guards';
import { prisma } from '@/lib/prisma';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { aggregateDailyReports } from '@/lib/naplate-aggregate';
import { normalizeDailyReport } from '@/lib/naplate-config';

export const runtime = 'nodejs';

const parseDate = (value: string) => {
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
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const mode = searchParams.get('mode') || 'general';
    const carrier = searchParams.get('carrier');

    if (!from || !to) {
      return NextResponse.json({ error: 'Nedostaje raspon datuma' }, { status: 400 });
    }
    if (!['sky-speed', 'carrier-airport', 'general'].includes(mode)) {
      return NextResponse.json({ error: 'Neispravan tip eksportovanja' }, { status: 400 });
    }

    const fromDate = parseDate(from);
    const toDate = parseDate(to);
    if (!fromDate || !toDate) {
      return NextResponse.json({ error: 'Neispravan raspon datuma' }, { status: 400 });
    }

    const reports = await prisma.billingReport.findMany({
      where: {
        type: 'DAILY',
        periodStart: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { periodStart: 'asc' },
    });

    if (!reports.length) {
      return NextResponse.json({ error: 'Nema izvještaja u traženom periodu' }, { status: 404 });
    }

    const normalized = reports
      .map((report) => normalizeDailyReport(report.data as any))
      .filter(Boolean);
    const rangeLabel = `${from} - ${to}`;
    const aggregated = aggregateDailyReports(normalized, rangeLabel);

    if (mode !== 'general' && (!carrier || !aggregated.carriers[carrier])) {
      return NextResponse.json({ error: 'Aviokompanija nije pronađena' }, { status: 404 });
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'naplate-'));
    const jsonPath = path.join(tempDir, 'monthly-report.json');
    const safeRange = `${from}_${to}`.replace(/[^0-9_-]/g, '');
    const outputName = `Mjesecni-${mode}-${safeRange}.xlsx`;
    const outputPath = path.join(tempDir, outputName);

    const templateMap: Record<string, string> = {
      'sky-speed': 'naplate_monthly_sky_speed_only.xlsx',
      'carrier-airport': 'naplate_monthly_wizz_airport.xlsx',
      general: 'naplate_monthly_general_template.xlsx',
    };

    const templatePath = path.join(process.cwd(), 'templates', templateMap[mode]);
    const scriptPath = path.join(process.cwd(), 'scripts', 'export_naplate_monthly.py');

    await fs.writeFile(
      jsonPath,
      JSON.stringify({
        carrier,
        report: aggregated,
      })
    );

    const pythonProcess = spawn('python3', [scriptPath, mode, jsonPath, templatePath, outputPath]);

    let stderr = '';
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    return await new Promise<NextResponse>((resolve) => {
      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          console.error('Monthly export error:', stderr);
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
            `attachment; filename=\"${outputName}\"`
          );
          resolve(response);
        } catch (error) {
          console.error('Monthly export read error:', error);
          resolve(NextResponse.json({ error: 'Greška pri eksportu' }, { status: 500 }));
        }
      });
    });
  } catch (error) {
    console.error('Monthly export error:', error);
    return NextResponse.json({ error: 'Greška pri eksportu' }, { status: 500 });
  }
}
