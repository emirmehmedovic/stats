'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
  TrendingUp,
  Plus,
  Trash2,
  Calculator,
  Calendar,
  Plane,
  Users,
  BarChart3,
  AlertCircle,
  Download,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

interface RouteInput {
  id: string;
  destination: string;
  airlineIcao: string;
  weeklyOperations: number;
  startDate: string;
  endDate: string;
  estimatedLoadFactor: number;
  aircraftType: string;
  isCharter: boolean;
  operatingDays?: string; // e.g., "Utorak, četvrtak, subota"
}

interface ProjectionResult {
  yearly: {
    totalOperations: number;
    totalPassengers: number;
    averageLoadFactor: number;
  };
  quarterly: Array<{
    quarter: number;
    operations: number;
    passengers: number;
    loadFactor: number;
  }>;
  seasonal: Array<{
    season: string;
    operations: number;
    passengers: number;
    loadFactor: number;
  }>;
  monthly: Array<{
    month: string;
    operations: number;
    passengers: number;
    loadFactor: number;
  }>;
  routeBreakdown: Array<{
    destination: string;
    operations: number;
    passengers: number;
    contribution: number;
  }>;
}

export default function ProjectionsPage() {
  const [routes, setRoutes] = useState<RouteInput[]>([]);
  const [projectionYear, setProjectionYear] = useState(new Date().getFullYear() + 1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [projectionResult, setProjectionResult] = useState<ProjectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [airlines, setAirlines] = useState<Array<{ icaoCode: string; name: string }>>([]);
  const [aircraftTypes, setAircraftTypes] = useState<Array<{ icaoCode: string; capacity: number }>>([]);
  const [useBaseline, setUseBaseline] = useState(true);

  useEffect(() => {
    fetchAirlines();
    fetchAircraftTypes();
  }, []);

  const fetchAirlines = async () => {
    try {
      // Fetch without limit to get all airlines
      const response = await fetch('/api/airlines?limit=100&page=1');
      const result = await response.json();
      console.log('Airlines API response:', result);
      
      if (result.success && result.data) {
        // If there are more pages, fetch all
        let allAirlines = [...result.data];
        
        if (result.pagination && result.pagination.hasMore) {
          const totalPages = result.pagination.totalPages;
          const promises = [];
          
          for (let page = 2; page <= totalPages; page++) {
            promises.push(
              fetch(`/api/airlines?limit=100&page=${page}`).then(r => r.json())
            );
          }
          
          const results = await Promise.all(promises);
          results.forEach(r => {
            if (r.success && r.data) {
              allAirlines = [...allAirlines, ...r.data];
            }
          });
        }
        
        const mappedAirlines = allAirlines.map((airline: any) => ({
          icaoCode: airline.icaoCode,
          name: airline.name,
        }));
        
        console.log('Total airlines loaded:', mappedAirlines.length);
        console.log('Wizz airlines:', mappedAirlines.filter((a: any) => 
          a.name.toLowerCase().includes('wizz') || a.icaoCode.toLowerCase().includes('w')
        ));
        setAirlines(mappedAirlines);
      }
    } catch (err) {
      console.error('Failed to fetch airlines:', err);
    }
  };

  const fetchAircraftTypes = async () => {
    try {
      const response = await fetch('/api/aircraft-types?limit=100&page=1');
      const result = await response.json();
      if (result.success && result.data) {
        const mappedTypes = result.data.map((type: any) => ({
          icaoCode: type.model,
          capacity: type.seats,
        }));
        setAircraftTypes(mappedTypes);
      }
    } catch (err) {
      console.error('Failed to fetch aircraft types:', err);
    }
  };

  const addRoute = () => {
    const newRoute: RouteInput = {
      id: `route-${Date.now()}`,
      destination: '',
      airlineIcao: '',
      weeklyOperations: 2,
      startDate: `${projectionYear}-01-01`,
      endDate: `${projectionYear}-12-31`,
      estimatedLoadFactor: 80,
      aircraftType: '',
      isCharter: false,
      operatingDays: '',
    };
    setRoutes([...routes, newRoute]);
  };

  const addWizzAirRoute = (destination: string, days: string, startDate: string, weeklyOps: number) => {
    const newRoute: RouteInput = {
      id: `route-${Date.now()}`,
      destination,
      airlineIcao: 'WZZ',
      weeklyOperations: weeklyOps,
      startDate,
      endDate: `${projectionYear}-10-25`,
      estimatedLoadFactor: 85,
      aircraftType: 'A320',
      isCharter: false,
      operatingDays: days,
    };
    setRoutes([...routes, newRoute]);
  };

  const addCharterRoute = (airline: string, destination: string = 'Antalya') => {
    const newRoute: RouteInput = {
      id: `route-${Date.now()}`,
      destination,
      airlineIcao: airline,
      weeklyOperations: 2,
      startDate: `${projectionYear}-06-01`,
      endDate: `${projectionYear}-09-30`,
      estimatedLoadFactor: 95,
      aircraftType: 'A321',
      isCharter: true,
      operatingDays: '',
    };
    setRoutes([...routes, newRoute]);
  };

  const loadAllRoutes = () => {
    // Wizz Air - Existing routes from December 2025 (continuing into 2026)
    const wizzExistingRoutes = [
      { destination: 'Köln', days: 'Ponedjeljak, srijeda, petak', startDate: '2025-12-12', ops: 3 },
      { destination: 'Maastricht', days: 'Ponedjeljak, srijeda, petak', startDate: '2025-12-12', ops: 3 },
      { destination: 'Malmö', days: 'Utorak, subota', startDate: '2025-12-13', ops: 2 },
      { destination: 'Hamburg', days: 'Četvrtak, nedjelja', startDate: '2025-12-14', ops: 2 },
    ];

    // Wizz Air - New routes from March 2026
    const wizzNewRoutes = [
      { destination: 'Bratislava', days: 'Utorak, četvrtak, subota, nedjelja', startDate: '2026-03-29', ops: 4 },
      { destination: 'Göteborg', days: 'Srijeda, nedjelja', startDate: '2026-03-29', ops: 2 },
      { destination: 'Berlin Brandenburg', days: 'Ponedjeljak, srijeda, petak', startDate: '2026-03-30', ops: 3 },
      { destination: 'Frankfurt Hahn', days: 'Utorak, četvrtak, subota', startDate: '2026-03-31', ops: 3 },
      { destination: 'Larnaca', days: 'Utorak, subota', startDate: '2026-03-31', ops: 2 },
      { destination: 'Paris Beauvais', days: 'Utorak, četvrtak, subota', startDate: '2026-03-31', ops: 3 },
    ];

    // Wizz Air - Routes with frequency increase in April 2026
    const wizzAprilIncrease = [
      { destination: 'Malmö (April povećanje)', days: 'Utorak, četvrtak, subota, nedjelja', startDate: '2026-04-01', ops: 4 },
      { destination: 'Hamburg (April povećanje)', days: 'Ponedjeljak, srijeda, petak', startDate: '2026-04-01', ops: 3 },
    ];
    
    const allWizzRoutes = [...wizzExistingRoutes, ...wizzNewRoutes, ...wizzAprilIncrease].map(route => ({
      id: `route-${Date.now()}-${Math.random()}`,
      destination: route.destination,
      airlineIcao: 'WZZ',
      weeklyOperations: route.ops,
      startDate: route.startDate,
      endDate: `${projectionYear}-10-25`,
      estimatedLoadFactor: 85,
      aircraftType: 'A321',
      isCharter: false,
      operatingDays: route.days,
    }));

    // Charter routes - only Hurghada (Antalya already in baseline data)
    const charterRoutes = [
      // Hurghada charters (mid-June to mid-September) - NEW routes
      { airline: 'CHARTER1', name: 'Charter 1', destination: 'Hurghada', startDate: `${projectionYear}-06-15`, endDate: `${projectionYear}-09-15` },
      { airline: 'CHARTER2', name: 'Charter 2', destination: 'Hurghada', startDate: `${projectionYear}-06-15`, endDate: `${projectionYear}-09-15` },
    ];
    
    const allCharterRoutes = charterRoutes.map(charter => ({
      id: `route-${Date.now()}-${Math.random()}`,
      destination: charter.destination,
      airlineIcao: charter.airline,
      weeklyOperations: 2,
      startDate: charter.startDate,
      endDate: charter.endDate,
      estimatedLoadFactor: 95,
      aircraftType: 'A321',
      isCharter: true,
      operatingDays: '',
    }));

    // Combine all routes and set
    const allNewRoutes = [...allWizzRoutes, ...allCharterRoutes];
    setRoutes([...routes, ...allNewRoutes]);
    
    // Enable baseline automatically
    setUseBaseline(true);
  };

  const removeRoute = (id: string) => {
    setRoutes(routes.filter((r) => r.id !== id));
  };

  const updateRoute = (id: string, field: keyof RouteInput, value: any) => {
    setRoutes(
      routes.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const calculateProjections = async () => {
    if (routes.length === 0 && !useBaseline) {
      setError('Molimo dodajte barem jednu rutu ili koristite baseline podatke');
      return;
    }

    const invalidRoutes = routes.filter(
      (r) => !r.destination || !r.airlineIcao || !r.aircraftType
    );

    if (invalidRoutes.length > 0) {
      setError('Popunite sva obavezna polja za sve rute');
      return;
    }

    setIsCalculating(true);
    setError(null);

    console.log('Sending projection request:', { projectionYear, routeCount: routes.length, useBaseline });

    try {
      const response = await fetch('/api/projections/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectionYear,
          routes,
          useBaseline,
        }),
      });

      if (!response.ok) {
        throw new Error('Greška pri izračunavanju projekcija');
      }

      const data = await response.json();

      if (data.success) {
        setProjectionResult(data.projection);
      } else {
        throw new Error(data.error || 'Nepoznata greška');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsCalculating(false);
    }
  };

  const exportProjections = () => {
    if (!projectionResult) return;

    const dataStr = JSON.stringify(projectionResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projekcije-${projectionYear}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-900 mb-2">Projekcije prometa</h1>
            <p className="text-dark-500">Planirajte i projektirajte budući promet na aerodromu</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={projectionYear}
              onChange={(e) => setProjectionYear(Number(e.target.value))}
              className="px-4 py-2 border border-dark-200 rounded-xl bg-white text-dark-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              {[0, 1, 2, 3, 4, 5].map((offset) => {
                const year = new Date().getFullYear() + offset;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Route Input Section */}
        <div className="bg-white rounded-3xl p-8 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-dark-900">Planirane rute</h2>
              <p className="text-sm text-dark-500">Dodajte rute i operacije za projekciju</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={loadAllRoutes}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all font-semibold text-sm shadow-soft"
              >
                <TrendingUp className="w-5 h-5" />
                Učitaj sve rute (2025 + Wizz Air + Charter)
              </button>
              <button
                onClick={addRoute}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Dodaj rutu
              </button>
            </div>
          </div>

          {routes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-dark-200 rounded-2xl">
              <Plane className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-500 font-medium">Nema dodanih ruta</p>
              <p className="text-sm text-dark-400 mt-1">Kliknite "Dodaj rutu" da započnete</p>
            </div>
          ) : (
            <div className="space-y-4">
              {routes.map((route, index) => (
                <div
                  key={route.id}
                  className="bg-dark-50 rounded-2xl p-6 border border-dark-200 relative group hover:border-primary-300 transition-all"
                >
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => removeRoute(route.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-2">
                        Destinacija *
                      </label>
                      <input
                        type="text"
                        value={route.destination}
                        onChange={(e) => updateRoute(route.id, 'destination', e.target.value)}
                        placeholder="npr. Basel, Dortmund"
                        className="w-full px-3 py-2 border border-dark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-2">
                        Aviokompanija *
                      </label>
                      <SearchableSelect
                        options={airlines.map((airline) => ({
                          value: airline.icaoCode,
                          label: airline.icaoCode,
                          subtitle: airline.name,
                        }))}
                        value={route.airlineIcao}
                        onChange={(value) => updateRoute(route.id, 'airlineIcao', value)}
                        placeholder="Izaberite aviokompaniju..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-2">
                        Tip aviona *
                      </label>
                      <SearchableSelect
                        options={aircraftTypes.map((aircraft) => ({
                          value: aircraft.icaoCode,
                          label: aircraft.icaoCode,
                          subtitle: `${aircraft.capacity} sjedišta`,
                        }))}
                        value={route.aircraftType}
                        onChange={(value) => updateRoute(route.id, 'aircraftType', value)}
                        placeholder="Izaberite tip aviona..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-2">
                        Operacija sedmično
                      </label>
                      <input
                        type="number"
                        value={route.weeklyOperations}
                        onChange={(e) =>
                          updateRoute(route.id, 'weeklyOperations', Number(e.target.value))
                        }
                        min="1"
                        max="14"
                        className="w-full px-3 py-2 border border-dark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-2">
                        Početak
                      </label>
                      <input
                        type="date"
                        value={route.startDate}
                        onChange={(e) => updateRoute(route.id, 'startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-dark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-2">
                        Kraj
                      </label>
                      <input
                        type="date"
                        value={route.endDate}
                        onChange={(e) => updateRoute(route.id, 'endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-dark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-dark-700 mb-2">
                        Očekivani Load Factor (%)
                      </label>
                      <input
                        type="number"
                        value={route.estimatedLoadFactor}
                        onChange={(e) =>
                          updateRoute(route.id, 'estimatedLoadFactor', Number(e.target.value))
                        }
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-dark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-dark-700 mb-2">
                        Operativni dani (opciono)
                      </label>
                      <input
                        type="text"
                        value={route.operatingDays || ''}
                        onChange={(e) => updateRoute(route.id, 'operatingDays', e.target.value)}
                        placeholder="npr. Utorak, četvrtak, subota"
                        className="w-full px-3 py-2 border border-dark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={route.isCharter}
                          onChange={(e) => updateRoute(route.id, 'isCharter', e.target.checked)}
                          className="w-4 h-4 border-dark-300 rounded text-orange-600 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-dark-700">Charter let</span>
                      </label>
                    </div>
                  </div>

                  {route.isCharter && (
                    <div className="mt-3 px-4 py-2 bg-orange-50 border border-orange-200 rounded-xl">
                      <p className="text-xs text-orange-800 font-medium">
                        ✈️ Charter let - Obično viši load factor (90-95%) i sezonski karakter
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">{error}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-dark-100">
            <div className="flex items-center gap-4">
              <p className="text-sm text-dark-500">
                Ukupno ruta: <span className="font-semibold text-dark-900">{routes.length}</span>
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBaseline}
                  onChange={(e) => setUseBaseline(e.target.checked)}
                  className="w-4 h-4 border-dark-300 rounded text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-dark-700">
                  Koristi baseline podatke iz 2025
                </span>
              </label>
            </div>
            <button
              onClick={calculateProjections}
              disabled={isCalculating || (routes.length === 0 && !useBaseline)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Izračunavanje...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  Izračunaj projekcije
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {projectionResult && (
          <>
            {/* Yearly Summary */}
            <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-soft-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-6">Godišnja projekcija {projectionYear}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary-500 rounded-xl">
                        <Plane className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm text-dark-200 font-medium">Ukupno operacija</p>
                    </div>
                    <p className="text-4xl font-bold">{projectionResult.yearly.totalOperations.toLocaleString('bs-BA')}</p>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-500 rounded-xl">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm text-dark-200 font-medium">Ukupno putnika</p>
                    </div>
                    <p className="text-4xl font-bold">{projectionResult.yearly.totalPassengers.toLocaleString('bs-BA')}</p>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-md border border-white/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-indigo-500 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm text-dark-200 font-medium">Prosječan Load Factor</p>
                    </div>
                    <p className="text-4xl font-bold">{projectionResult.yearly.averageLoadFactor.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quarterly Breakdown */}
            <div className="bg-white rounded-3xl p-8 shadow-soft">
              <h2 className="text-xl font-bold text-dark-900 mb-6">Kvartalna projekcija</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {projectionResult.quarterly.map((q) => (
                  <div
                    key={q.quarter}
                    className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-6 border border-primary-100"
                  >
                    <p className="text-sm font-bold text-primary-600 mb-3">Q{q.quarter} {projectionYear}</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-dark-500">Operacije</p>
                        <p className="text-2xl font-bold text-dark-900">{q.operations.toLocaleString('bs-BA')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-500">Putnici</p>
                        <p className="text-xl font-bold text-dark-900">{q.passengers.toLocaleString('bs-BA')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-500">Load Factor</p>
                        <p className="text-lg font-bold text-primary-600">{q.loadFactor.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonal Breakdown */}
            <div className="bg-white rounded-3xl p-8 shadow-soft">
              <h2 className="text-xl font-bold text-dark-900 mb-6">Sezonska projekcija</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {projectionResult.seasonal.map((s) => (
                  <div
                    key={s.season}
                    className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100"
                  >
                    <p className="text-sm font-bold text-indigo-600 mb-3">{s.season}</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-dark-500">Operacije</p>
                        <p className="text-2xl font-bold text-dark-900">{s.operations.toLocaleString('bs-BA')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-500">Putnici</p>
                        <p className="text-xl font-bold text-dark-900">{s.passengers.toLocaleString('bs-BA')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-500">Load Factor</p>
                        <p className="text-lg font-bold text-indigo-600">{s.loadFactor.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Breakdown */}
            <div className="bg-white rounded-3xl p-8 shadow-soft">
              <h2 className="text-xl font-bold text-dark-900 mb-6">Projekcija po rutama</h2>
              <div className="space-y-3">
                {projectionResult.routeBreakdown.map((route, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-dark-50 rounded-2xl border border-dark-100"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-dark-900">{route.destination}</p>
                      <p className="text-sm text-dark-500">
                        {route.operations} operacija • {route.passengers.toLocaleString('bs-BA')} putnika
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">{route.contribution.toFixed(1)}%</p>
                      <p className="text-xs text-dark-500">doprinos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Chart */}
            <div className="bg-white rounded-3xl p-8 shadow-soft">
              <h2 className="text-xl font-bold text-dark-900 mb-6">Mjesečna distribucija</h2>
              <div className="space-y-2">
                {projectionResult.monthly.map((m) => (
                  <div key={m.month} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-semibold text-dark-700">{m.month}</div>
                    <div className="flex-1 bg-dark-50 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full flex items-center justify-end pr-3"
                        style={{ width: `${(m.operations / Math.max(...projectionResult.monthly.map(x => x.operations))) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-white">{m.operations}</span>
                      </div>
                    </div>
                    <div className="w-32 text-right">
                      <p className="text-sm font-bold text-dark-900">{m.passengers.toLocaleString('bs-BA')}</p>
                      <p className="text-xs text-dark-500">putnika</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
