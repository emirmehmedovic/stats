import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateFrom, dateTo, operationTypes, airlines, routes, passengerType } = body;

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Datum od i do su obavezni' },
        { status: 400 }
      );
    }

    // Prepare filters for Python script
    const filters = JSON.stringify({
      dateFrom,
      dateTo,
      operationTypes: operationTypes || [],
      airlines: airlines || [],
      routes: routes || [],
      passengerType: passengerType || 'all',
    });

    // Path to Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_custom_report.py');

    // Execute Python script
    const pythonProcess = spawn('python3', [scriptPath, filters], {
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    return new Promise<NextResponse>((resolve) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', stderr);
          resolve(
            NextResponse.json(
              { error: stderr || 'Greška pri generisanju izvještaja' },
              { status: 500 }
            )
          );
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (result.success) {
            resolve(NextResponse.json(result));
          } else {
            resolve(
              NextResponse.json(
                { error: result.error || 'Greška pri generisanju izvještaja' },
                { status: 500 }
              )
            );
          }
        } catch (error) {
          console.error('Error parsing Python output:', error);
          resolve(
            NextResponse.json(
              { error: 'Greška pri parsiranju rezultata' },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error) {
    console.error('Error in custom report generation:', error);
    return NextResponse.json(
      { error: 'Greška pri generisanju izvještaja' },
      { status: 500 }
    );
  }
}
