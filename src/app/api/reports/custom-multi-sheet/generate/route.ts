import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import { writeReportMetadata } from '@/lib/report-metadata';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const {
      dateFrom,
      dateTo,
      passengerType = 'all',
      operationTypes = [],
      airlines = [],
      routes = []
    } = body;

    // Validation
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Missing dateFrom or dateTo' },
        { status: 400 }
      );
    }

    // Serialize filters to JSON
    const filters = JSON.stringify({
      dateFrom,
      dateTo,
      passengerType,
      operationTypes,
      airlines,
      routes
    });

    // Path to Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_custom_advanced_report.py');

    // Execute Python script
    const pythonProcess = spawn('python3', [scriptPath, filters]);

    let stdout = '';
    let stderr = '';

    // Collect stdout
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Wait for process to complete
    const exitCode = await new Promise<number>((resolve) => {
      pythonProcess.on('close', (code) => {
        resolve(code || 0);
      });
    });

    // Check for errors
    if (exitCode !== 0) {
      console.error('Python script error:', stderr);
      return NextResponse.json(
        { error: 'Failed to generate report', details: stderr },
        { status: 500 }
      );
    }

    // Parse output
    try {
      const result = JSON.parse(stdout.trim());
      
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      try {
        const token = getTokenFromCookie(request.headers.get('cookie'));
        const user = token ? await verifyToken(token) : null;
        const resolvedFileName = result.fileName || result.filename;
        const generatedPath =
          result.filePath ||
          (resolvedFileName
            ? path.join(process.cwd(), 'izvještaji', 'generated', resolvedFileName)
            : null);
        if (generatedPath) {
          await writeReportMetadata(generatedPath, user);
        }
      } catch (error) {
        console.warn('Report metadata write failed:', error);
      }

      return NextResponse.json(result);
    } catch (parseError) {
      console.error('Failed to parse Python output:', stdout);
      return NextResponse.json(
        { error: 'Failed to parse script output', details: stdout },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error generating multi-sheet report:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
