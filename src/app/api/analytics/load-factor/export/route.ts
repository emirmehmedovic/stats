import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateFrom, dateTo, airlines, routes, operationTypeId, direction } = body;

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, error: 'dateFrom and dateTo are required' },
        { status: 400 }
      );
    }

    // Prepare filters for Python script
    const filters = {
      dateFrom,
      dateTo,
      airlines: airlines || [],
      routes: routes || [],
      operationTypeId: operationTypeId || 'ALL',
      direction: direction || 'all',
    };

    const filtersJson = JSON.stringify(filters);
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_load_factor_report.py');

    // Execute Python script
    const { stdout, stderr } = await execAsync(
      `python3 "${scriptPath}" '${filtersJson}'`,
      {
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL,
        },
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      }
    );

    if (stderr && !stderr.includes('Warning')) {
      console.error('Python script stderr:', stderr);
    }

    const result = JSON.parse(stdout);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate report' },
        { status: 500 }
      );
    }

    // Read the generated file
    const filePath = path.join(process.cwd(), 'izvještaji', 'generated', result.fileName);
    const fileBuffer = await fs.readFile(filePath);

    // Return file as download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report',
      },
      { status: 500 }
    );
  }
}
