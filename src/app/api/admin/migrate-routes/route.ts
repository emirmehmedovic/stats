import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Hardcoded route mappings for common routes
const ROUTE_MAPPINGS = {
  // Wizz Air Malta (W4) routes
  'W4': {
    // Mulhouse/Basel (LFSB)
    'TZL-MLH': { destination: 'Mulhouse', country: 'France' },
    'MLH-TZL': { destination: 'Mulhouse', country: 'France' },
    'TZL-MLH-TZL': { destination: 'Mulhouse', country: 'France' },
    'MLH-TZL-MLH': { destination: 'Mulhouse', country: 'France' },
    'TZL-BSL': { destination: 'Basel', country: 'Switzerland' },
    'BSL-TZL': { destination: 'Basel', country: 'Switzerland' },
    'TZL-BSL-TZL': { destination: 'Basel', country: 'Switzerland' },
    'BSL-TZL-BSL': { destination: 'Basel', country: 'Switzerland' },
    'LFSB-LFSB': { destination: 'Basel-Mulhouse', country: 'France/Switzerland' },
    'MLH-Basel': { destination: 'Basel', country: 'Switzerland' },
    
    // Memmingen (EDJA)
    'TZL-FMM': { destination: 'Memmingen', country: 'Germany' },
    'FMM-TZL': { destination: 'Memmingen', country: 'Germany' },
    'TZL-FMM-TZL': { destination: 'Memmingen', country: 'Germany' },
    'FMM-TZL-FMM': { destination: 'Memmingen', country: 'Germany' },
    'EDJA-EDJA': { destination: 'Memmingen', country: 'Germany' },
    'FMM-Memmingen': { destination: 'Memmingen', country: 'Germany' },
    
    // Dortmund (EDLW)
    'TZL-DTM': { destination: 'Dortmund', country: 'Germany' },
    'DTM-TZL': { destination: 'Dortmund', country: 'Germany' },
    'TZL-DTM-TZL': { destination: 'Dortmund', country: 'Germany' },
    'DTM-TZL-DTM': { destination: 'Dortmund', country: 'Germany' },
    'EDLW-EDLW': { destination: 'Dortmund', country: 'Germany' },
    'DTM-Dortmund': { destination: 'Dortmund', country: 'Germany' },
    
    // Malmö (ESMS)
    'TZL-MMX': { destination: 'Malmö', country: 'Sweden' },
    'MMX-TZL': { destination: 'Malmö', country: 'Sweden' },
    'TZL-MMX-TZL': { destination: 'Malmö', country: 'Sweden' },
    'MMX-TZL-MMX': { destination: 'Malmö', country: 'Sweden' },
    'ESMS-ESMS': { destination: 'Malmö', country: 'Sweden' },
    'MMX-Malmö-Sturup': { destination: 'Malmö', country: 'Sweden' },
    
    // Istanbul Sabiha Gökçen (LTAI/SAW)
    'TZL-SAW': { destination: 'Istanbul Sabiha Gökçen', country: 'Turkey' },
    'SAW-TZL': { destination: 'Istanbul Sabiha Gökçen', country: 'Turkey' },
    'SAW-TZL-SAW': { destination: 'Istanbul Sabiha Gökçen', country: 'Turkey' },
    'TZL-SAW-TZL': { destination: 'Istanbul Sabiha Gökçen', country: 'Turkey' },
    'LTAI-LTAI': { destination: 'Istanbul Sabiha Gökçen', country: 'Turkey' },
    'SAW-Istanbul': { destination: 'Istanbul Sabiha Gökçen', country: 'Turkey' },
    
    // Antalya (AYT)
    'TZL-AYT': { destination: 'Antalya', country: 'Turkey' },
    'AYT-TZL': { destination: 'Antalya', country: 'Turkey' },
    'AYT-TZL-AYT': { destination: 'Antalya', country: 'Turkey' },
    'TZL-AYT-TZL': { destination: 'Antalya', country: 'Turkey' },
    
    // Vienna (LOWW/VIE)
    'TZL-VIE': { destination: 'Vienna', country: 'Austria' },
    'VIE-TZL': { destination: 'Vienna', country: 'Austria' },
    'VIE-TZL-VIE': { destination: 'Vienna', country: 'Austria' },
    'TZL-VIE-TZL': { destination: 'Vienna', country: 'Austria' },
    'LOWW-LOWW': { destination: 'Vienna', country: 'Austria' },
    
    // Maastricht (MST)
    'TZL-MST': { destination: 'Maastricht', country: 'Netherlands' },
    'MST-TZL': { destination: 'Maastricht', country: 'Netherlands' },
    'TZL-MST-TZL': { destination: 'Maastricht', country: 'Netherlands' },
    'MST-TZL-MST': { destination: 'Maastricht', country: 'Netherlands' },
    'MST-Maastricht': { destination: 'Maastricht', country: 'Netherlands' },
    
    // Halmstad (HAD)
    'TZL-HAD': { destination: 'Halmstad', country: 'Sweden' },
    'HAD-TZL': { destination: 'Halmstad', country: 'Sweden' },
    'TZL-HAD-TZL': { destination: 'Halmstad', country: 'Sweden' },
    'HAD-TZL-HAD': { destination: 'Halmstad', country: 'Sweden' },
    
    // Stockholm Skavsta (NYO)
    'TZL-NYO': { destination: 'Stockholm Skavsta', country: 'Sweden' },
    'NYO-TZL': { destination: 'Stockholm Skavsta', country: 'Sweden' },
    'TZL-NYO-TZL': { destination: 'Stockholm Skavsta', country: 'Sweden' },
    'NYO-TZL-NYO': { destination: 'Stockholm Skavsta', country: 'Sweden' },
    
    // Esbjerg (EBJ)
    'TZL-EBJ': { destination: 'Esbjerg', country: 'Denmark' },
    'EBJ-TZL': { destination: 'Esbjerg', country: 'Denmark' },
    'TZL-EBJ-TZL': { destination: 'Esbjerg', country: 'Denmark' },
    'EBJ-TZL-EBJ': { destination: 'Esbjerg', country: 'Denmark' },
    
    // Saarbrücken (SCN/EDSB)
    'TZL-SCN': { destination: 'Saarbrücken', country: 'Germany' },
    'SCN-TZL': { destination: 'Saarbrücken', country: 'Germany' },
    'TZL-SCN-TZL': { destination: 'Saarbrücken', country: 'Germany' },
    'SCN-TZL-SCN': { destination: 'Saarbrücken', country: 'Germany' },
    'EDSB-EDSB': { destination: 'Saarbrücken', country: 'Germany' },
    
    // Cologne/Bonn (CGN/EDDK)
    'TZL-CGN': { destination: 'Cologne/Bonn', country: 'Germany' },
    'CGN-TZL': { destination: 'Cologne/Bonn', country: 'Germany' },
    'TZL-CGN-TZL': { destination: 'Cologne/Bonn', country: 'Germany' },
    'CGN-TZL-CGN': { destination: 'Cologne/Bonn', country: 'Germany' },
    'EDDK-EDDK': { destination: 'Cologne/Bonn', country: 'Germany' },
    'CGN-Köln Bonn': { destination: 'Cologne/Bonn', country: 'Germany' },
    
    // Frankfurt-Hahn (HHN/EDFH)
    'TZL-HHN': { destination: 'Frankfurt-Hahn', country: 'Germany' },
    'HHN-TZL': { destination: 'Frankfurt-Hahn', country: 'Germany' },
    'HHN-TZL-HHN': { destination: 'Frankfurt-Hahn', country: 'Germany' },
    'TZL-HHN-TZL': { destination: 'Frankfurt-Hahn', country: 'Germany' },
    'EDFH-EDFH': { destination: 'Frankfurt-Hahn', country: 'Germany' },
    
    // Belgrade (BEG)
    'TZL-BEG': { destination: 'Belgrade', country: 'Serbia' },
    'BEG-TZL': { destination: 'Belgrade', country: 'Serbia' },
    'BEG-TZL-BEG': { destination: 'Belgrade', country: 'Serbia' },
    'TZL-BEG-TZL': { destination: 'Belgrade', country: 'Serbia' },
    
    // Berlin (EDDB)
    'EDDB-EDDB': { destination: 'Berlin', country: 'Germany' },
    
    // Nuremberg (EDDN)
    'EDDN-EDDN': { destination: 'Nuremberg', country: 'Germany' },
    
    // Eindhoven (EHEH)
    'EHEH-EHEH': { destination: 'Eindhoven', country: 'Netherlands' },
    
    // Gothenburg (ESGG)
    'ESGG-ESGG': { destination: 'Gothenburg', country: 'Sweden' },
    
    // Kristianstad (ESKN)
    'ESKN-ESKN': { destination: 'Kristianstad', country: 'Sweden' },
    
    // Billund (EKBI)
    'EKBI-EKBI': { destination: 'Billund', country: 'Denmark' },
    
    // Friedrichshafen (EDNY)
    'EDNY-EDNY': { destination: 'Friedrichshafen', country: 'Germany' },
    
    // Stockholm Arlanda (ESSA)
    'ESSA-ESSA': { destination: 'Stockholm Arlanda', country: 'Sweden' },
    
    // Istanbul (ISL)
    'TZL-ISL': { destination: 'Istanbul', country: 'Turkey' },
    'ISL-TZL': { destination: 'Istanbul', country: 'Turkey' },
    'ISL-TZL-ISL': { destination: 'Istanbul', country: 'Turkey' },
    'TZL-ISL-TZL': { destination: 'Istanbul', country: 'Turkey' },
  },
  // Wizz Air Hungary (W6) - same routes
  'W6': {
    // Copy all routes from W4
    'TZL-MLH': { destination: 'Mulhouse', country: 'France' },
    'MLH-TZL': { destination: 'Mulhouse', country: 'France' },
    'TZL-MLH-TZL': { destination: 'Mulhouse', country: 'France' },
    'MLH-TZL-MLH': { destination: 'Mulhouse', country: 'France' },
    'TZL-BSL': { destination: 'Basel', country: 'Switzerland' },
    'BSL-TZL': { destination: 'Basel', country: 'Switzerland' },
    'TZL-BSL-TZL': { destination: 'Basel', country: 'Switzerland' },
    'BSL-TZL-BSL': { destination: 'Basel', country: 'Switzerland' },
    'LFSB-LFSB': { destination: 'Basel-Mulhouse', country: 'France/Switzerland' },
    'MLH-Basel': { destination: 'Basel', country: 'Switzerland' },
    'TZL-FMM': { destination: 'Memmingen', country: 'Germany' },
    'FMM-TZL': { destination: 'Memmingen', country: 'Germany' },
    'TZL-FMM-TZL': { destination: 'Memmingen', country: 'Germany' },
    'FMM-TZL-FMM': { destination: 'Memmingen', country: 'Germany' },
    'EDJA-EDJA': { destination: 'Memmingen', country: 'Germany' },
    'FMM-Memmingen': { destination: 'Memmingen', country: 'Germany' },
    'TZL-DTM': { destination: 'Dortmund', country: 'Germany' },
    'DTM-TZL': { destination: 'Dortmund', country: 'Germany' },
    'TZL-DTM-TZL': { destination: 'Dortmund', country: 'Germany' },
    'DTM-TZL-DTM': { destination: 'Dortmund', country: 'Germany' },
    'EDLW-EDLW': { destination: 'Dortmund', country: 'Germany' },
    'DTM-Dortmund': { destination: 'Dortmund', country: 'Germany' },
    'TZL-MMX': { destination: 'Malmö', country: 'Sweden' },
    'MMX-TZL': { destination: 'Malmö', country: 'Sweden' },
    'TZL-MMX-TZL': { destination: 'Malmö', country: 'Sweden' },
    'MMX-TZL-MMX': { destination: 'Malmö', country: 'Sweden' },
    'ESMS-ESMS': { destination: 'Malmö', country: 'Sweden' },
    'MMX-Malmö-Sturup': { destination: 'Malmö', country: 'Sweden' },
    'TZL-SAW': { destination: 'Istanbul Sabiha Gökçen', country: 'Turkey' },
    'SAW-TZL': { destination: 'Istanbul Sabiha Gökçen', country: 'Turkey' },
    'SAW-TZL-SAW': { destination: 'Istanbul Sabiha Gökçen', country: 'Turkey' },
    'TZL-SAW-TZL': { destination: 'Istanbul Sabiha Gökçen', country: 'Turkey' },
    'LTAI-LTAI': { destination: 'Istanbul Sabiha Gökçen', country: 'Turkey' },
    'SAW-Istanbul': { destination: 'Istanbul Sabiha Gökçen', country: 'Turkey' },
    'TZL-AYT': { destination: 'Antalya', country: 'Turkey' },
    'AYT-TZL': { destination: 'Antalya', country: 'Turkey' },
    'AYT-TZL-AYT': { destination: 'Antalya', country: 'Turkey' },
    'TZL-AYT-TZL': { destination: 'Antalya', country: 'Turkey' },
    'TZL-VIE': { destination: 'Vienna', country: 'Austria' },
    'VIE-TZL': { destination: 'Vienna', country: 'Austria' },
    'VIE-TZL-VIE': { destination: 'Vienna', country: 'Austria' },
    'TZL-VIE-TZL': { destination: 'Vienna', country: 'Austria' },
    'LOWW-LOWW': { destination: 'Vienna', country: 'Austria' },
    'TZL-MST': { destination: 'Maastricht', country: 'Netherlands' },
    'MST-TZL': { destination: 'Maastricht', country: 'Netherlands' },
    'TZL-MST-TZL': { destination: 'Maastricht', country: 'Netherlands' },
    'MST-TZL-MST': { destination: 'Maastricht', country: 'Netherlands' },
    'MST-Maastricht': { destination: 'Maastricht', country: 'Netherlands' },
    'TZL-HAD': { destination: 'Halmstad', country: 'Sweden' },
    'HAD-TZL': { destination: 'Halmstad', country: 'Sweden' },
    'TZL-HAD-TZL': { destination: 'Halmstad', country: 'Sweden' },
    'HAD-TZL-HAD': { destination: 'Halmstad', country: 'Sweden' },
    'TZL-NYO': { destination: 'Stockholm Skavsta', country: 'Sweden' },
    'NYO-TZL': { destination: 'Stockholm Skavsta', country: 'Sweden' },
    'TZL-NYO-TZL': { destination: 'Stockholm Skavsta', country: 'Sweden' },
    'NYO-TZL-NYO': { destination: 'Stockholm Skavsta', country: 'Sweden' },
    'TZL-EBJ': { destination: 'Esbjerg', country: 'Denmark' },
    'EBJ-TZL': { destination: 'Esbjerg', country: 'Denmark' },
    'TZL-EBJ-TZL': { destination: 'Esbjerg', country: 'Denmark' },
    'EBJ-TZL-EBJ': { destination: 'Esbjerg', country: 'Denmark' },
    'TZL-SCN': { destination: 'Saarbrücken', country: 'Germany' },
    'SCN-TZL': { destination: 'Saarbrücken', country: 'Germany' },
    'TZL-SCN-TZL': { destination: 'Saarbrücken', country: 'Germany' },
    'SCN-TZL-SCN': { destination: 'Saarbrücken', country: 'Germany' },
    'EDSB-EDSB': { destination: 'Saarbrücken', country: 'Germany' },
    'TZL-CGN': { destination: 'Cologne/Bonn', country: 'Germany' },
    'CGN-TZL': { destination: 'Cologne/Bonn', country: 'Germany' },
    'TZL-CGN-TZL': { destination: 'Cologne/Bonn', country: 'Germany' },
    'CGN-TZL-CGN': { destination: 'Cologne/Bonn', country: 'Germany' },
    'EDDK-EDDK': { destination: 'Cologne/Bonn', country: 'Germany' },
    'CGN-Köln Bonn': { destination: 'Cologne/Bonn', country: 'Germany' },
    'TZL-HHN': { destination: 'Frankfurt-Hahn', country: 'Germany' },
    'HHN-TZL': { destination: 'Frankfurt-Hahn', country: 'Germany' },
    'HHN-TZL-HHN': { destination: 'Frankfurt-Hahn', country: 'Germany' },
    'TZL-HHN-TZL': { destination: 'Frankfurt-Hahn', country: 'Germany' },
    'EDFH-EDFH': { destination: 'Frankfurt-Hahn', country: 'Germany' },
    'TZL-BEG': { destination: 'Belgrade', country: 'Serbia' },
    'BEG-TZL': { destination: 'Belgrade', country: 'Serbia' },
    'BEG-TZL-BEG': { destination: 'Belgrade', country: 'Serbia' },
    'TZL-BEG-TZL': { destination: 'Belgrade', country: 'Serbia' },
    'EDDB-EDDB': { destination: 'Berlin', country: 'Germany' },
    'EDDN-EDDN': { destination: 'Nuremberg', country: 'Germany' },
    'EHEH-EHEH': { destination: 'Eindhoven', country: 'Netherlands' },
    'ESGG-ESGG': { destination: 'Gothenburg', country: 'Sweden' },
    'ESKN-ESKN': { destination: 'Kristianstad', country: 'Sweden' },
    'EKBI-EKBI': { destination: 'Billund', country: 'Denmark' },
    'EDNY-EDNY': { destination: 'Friedrichshafen', country: 'Germany' },
    'ESSA-ESSA': { destination: 'Stockholm Arlanda', country: 'Sweden' },
    'TZL-ISL': { destination: 'Istanbul', country: 'Turkey' },
    'ISL-TZL': { destination: 'Istanbul', country: 'Turkey' },
    'ISL-TZL-ISL': { destination: 'Istanbul', country: 'Turkey' },
    'TZL-ISL-TZL': { destination: 'Istanbul', country: 'Turkey' },
  },
};

// Keep routes in full format - no normalization
// TZL-DTM-TZL stays as TZL-DTM-TZL (base aircraft in Tuzla)
// DTM-TZL-DTM stays as DTM-TZL-DTM (base aircraft in Dortmund)
function normalizeRoute(route: string): string {
  // Just return the route as-is
  return route;
}

export async function POST(request: NextRequest) {
  try {
    // Get all Wizz Air airlines
    const wizzAirlines = await prisma.airline.findMany({
      where: {
        OR: [
          { icaoCode: { contains: 'WZZ' } },
          { icaoCode: { contains: 'W4' } },
          { icaoCode: { contains: 'W6' } },
          { name: { contains: 'Wizz' } },
        ],
      },
    });

    if (wizzAirlines.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Wizz Air aviokompanije nisu pronađene',
      }, { status: 404 });
    }

    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const airline of wizzAirlines) {
      // Get unique routes for this airline
      const flights = await prisma.flight.findMany({
        where: {
          airlineId: airline.id,
        },
        select: {
          route: true,
        },
        distinct: ['route'],
      });

      const uniqueRoutes = [...new Set(flights.map(f => f.route).filter((r): r is string => Boolean(r)))];

      // Determine which mapping to use based on ICAO code
      let mappingKey = 'W6'; // Default to W6
      if (airline.icaoCode.includes('W4')) {
        mappingKey = 'W4';
      }

      const routeMapping = ROUTE_MAPPINGS[mappingKey as keyof typeof ROUTE_MAPPINGS];

      for (const route of uniqueRoutes) {
        results.processed++;

        // Check if route exists in mapping
        const routeInfo = routeMapping[route as keyof typeof routeMapping];
        
        if (!routeInfo) {
          // Try normalized route
          const normalized = normalizeRoute(route);
          const normalizedInfo = routeMapping[normalized as keyof typeof routeMapping];
          
          if (!normalizedInfo) {
            results.skipped++;
            continue;
          }
        }

        const finalRouteInfo = routeInfo || routeMapping[normalizeRoute(route) as keyof typeof routeMapping];
        const normalizedRouteCode = normalizeRoute(route);

        try {
          // Check if route already exists
          const existing = await prisma.airlineRoute.findUnique({
            where: {
              airlineId_route: {
                airlineId: airline.id,
                route: normalizedRouteCode,
              },
            },
          });

          if (existing) {
            results.skipped++;
            continue;
          }

          // Create route
          await prisma.airlineRoute.create({
            data: {
              airlineId: airline.id,
              route: normalizedRouteCode,
              destination: finalRouteInfo.destination,
              country: finalRouteInfo.country,
              isActive: true,
            },
          });

          results.created++;
        } catch (error: any) {
          results.errors.push(`${route}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migracija ruta završena',
      results,
      airlines: wizzAirlines.map(a => ({ name: a.name, icaoCode: a.icaoCode })),
    });
  } catch (error) {
    console.error('Error migrating routes:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri migraciji ruta' },
      { status: 500 }
    );
  }
}

// GET endpoint to preview what would be migrated
export async function GET(request: NextRequest) {
  try {
    const wizzAirlines = await prisma.airline.findMany({
      where: {
        OR: [
          { icaoCode: { contains: 'WZZ' } },
          { icaoCode: { contains: 'W4' } },
          { icaoCode: { contains: 'W6' } },
          { name: { contains: 'Wizz' } },
        ],
      },
    });

    const preview = [];

    for (const airline of wizzAirlines) {
      const flights = await prisma.flight.findMany({
        where: {
          airlineId: airline.id,
        },
        select: {
          route: true,
        },
        distinct: ['route'],
      });

      const uniqueRoutes = [...new Set(flights.map(f => f.route).filter((r): r is string => Boolean(r)))];

      let mappingKey = 'W6';
      if (airline.icaoCode.includes('W4')) {
        mappingKey = 'W4';
      }

      const routeMapping = ROUTE_MAPPINGS[mappingKey as keyof typeof ROUTE_MAPPINGS];

      const mappedRoutes = uniqueRoutes.map(route => {
        const routeInfo = routeMapping[route as keyof typeof routeMapping];
        const normalized = normalizeRoute(route);
        const normalizedInfo = routeMapping[normalized as keyof typeof routeMapping];
        
        return {
          original: route,
          normalized,
          willMigrate: !!(routeInfo || normalizedInfo),
          destination: (routeInfo || normalizedInfo)?.destination || 'Unknown',
          country: (routeInfo || normalizedInfo)?.country || 'Unknown',
        };
      });

      preview.push({
        airline: {
          name: airline.name,
          icaoCode: airline.icaoCode,
        },
        routes: mappedRoutes,
        totalRoutes: uniqueRoutes.length,
        mappableRoutes: mappedRoutes.filter(r => r.willMigrate).length,
      });
    }

    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error) {
    console.error('Error previewing migration:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri pregledu migracije' },
      { status: 500 }
    );
  }
}
