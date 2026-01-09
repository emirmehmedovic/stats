import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookie } from '@/lib/auth-utils';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookie(cookieHeader);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectionYear, routes, useBaseline } = body;

    if (!projectionYear || !routes || !Array.isArray(routes)) {
      return NextResponse.json(
        { error: 'Invalid input: projectionYear and routes are required' },
        { status: 400 }
      );
    }

    // Fetch baseline data if requested
    let baselineData = null;
    if (useBaseline) {
      try {
        console.log('Fetching baseline data from 2025...');
        const baselineResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projections/baseline-2025`,
          {
            headers: {
              cookie: cookieHeader || '',
            },
          }
        );
        
        if (baselineResponse.ok) {
          const baselineResult = await baselineResponse.json();
          console.log('Baseline response:', {
            success: baselineResult.success,
            routeCount: baselineResult.baseline?.routeSummary?.length || 0,
          });
          if (baselineResult.success) {
            baselineData = baselineResult.baseline;
          }
        } else {
          console.error('Baseline fetch failed:', baselineResponse.status);
        }
      } catch (err) {
        console.error('Failed to fetch baseline data:', err);
      }
    }

    console.log('Calculation input:', {
      projectionYear,
      manualRoutesCount: routes.length,
      useBaseline,
      hasBaselineData: !!baselineData,
      baselineRouteCount: baselineData?.routeSummary?.length || 0,
    });

    // Prepare input for Python script
    const pythonInput = {
      projectionYear,
      routes,
      baselineData,
      dbPath: path.join(process.cwd(), 'prisma', 'dev.db'),
    };

    // Run Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'advanced_projections.py');
    
    return new Promise<Response>((resolve) => {
      const pythonProcess = spawn('python3', [scriptPath, JSON.stringify(pythonInput)]);
      
      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorData);
          resolve(
            NextResponse.json(
              { error: 'Calculation failed', details: errorData },
              { status: 500 }
            )
          );
          return;
        }

        try {
          const result = JSON.parse(outputData);
          
          if (result.error) {
            resolve(
              NextResponse.json(
                { error: result.error },
                { status: 500 }
              )
            );
            return;
          }

          resolve(
            NextResponse.json({
              success: true,
              data: result,
            })
          );
        } catch (parseError) {
          console.error('Failed to parse Python output:', parseError);
          console.error('Output was:', outputData);
          resolve(
            NextResponse.json(
              { error: 'Failed to parse calculation results' },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error: any) {
    console.error('Advanced calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
