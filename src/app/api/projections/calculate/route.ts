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

    console.log('Projection calculation:', {
      year: projectionYear,
      routeCount: routes.length,
      useBaseline: !!useBaseline,
    });

    // Validate routes
    for (const route of routes) {
      if (!route.destination || !route.airlineIcao || !route.aircraftType) {
        return NextResponse.json(
          { error: 'Each route must have destination, airlineIcao, and aircraftType' },
          { status: 400 }
        );
      }
    }

    // Fetch baseline data if requested
    let baselineRoutes: any[] = [];
    if (useBaseline) {
      try {
        const baselineUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projections/baseline-2025`;
        const baselineResponse = await fetch(baselineUrl, {
          headers: { cookie: cookieHeader || '' },
        });
        
        if (baselineResponse.ok) {
          const baselineData = await baselineResponse.json();
          if (baselineData.success && baselineData.baseline?.routeSummary) {
            // Convert baseline data to route format
            baselineRoutes = baselineData.baseline.routeSummary.map((route: any) => ({
              id: `baseline-${route.route}`,
              destination: route.destination,
              airlineIcao: route.airlineIcao,
              aircraftType: route.aircraftType,
              weeklyOperations: Math.max(1, Math.round(route.weeklyFrequency)),
              startDate: `${projectionYear}-01-01`,
              endDate: `${projectionYear}-12-31`,
              estimatedLoadFactor: Math.min(98, Math.round(route.avgLoadFactor * 1.05)),
              isCharter: false,
              isBaseline: true,
            }));
            
            console.log(`Loaded ${baselineRoutes.length} baseline routes from 2025`);
            console.log('Sample baseline routes:', baselineRoutes.slice(0, 3).map(r => ({
              dest: r.destination,
              airline: r.airlineIcao,
              weekly: r.weeklyOperations,
              dates: `${r.startDate} to ${r.endDate}`
            })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch baseline data:', err);
      }
    }

    // Combine baseline routes with manual routes
    const allRoutes = [...baselineRoutes, ...routes];
    console.log(`Total routes for calculation: ${allRoutes.length} (baseline: ${baselineRoutes.length}, manual: ${routes.length})`);

    // Call Python script for calculations
    const scriptPath = path.join(process.cwd(), 'scripts', 'calculate_projections.py');
    const inputData = JSON.stringify({ 
      year: projectionYear, 
      routes: allRoutes,
      useBaseline: false, // Already merged baseline routes
    });

    const projection = await runPythonScript(scriptPath, inputData);

    return NextResponse.json({
      success: true,
      projection,
    });
  } catch (error: any) {
    console.error('Projection calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate projections' },
      { status: 500 }
    );
  }
}

function runPythonScript(scriptPath: string, inputData: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [scriptPath, inputData]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${stdout}`));
      }
    });

    python.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}
