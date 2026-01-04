'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatDateDisplay, getTodayDateString } from '@/lib/dates';

interface CustomReportData {
  filters: {
    dateFrom: string;
    dateTo: string;
    airlines: string[];
    routes: string[];
    operationType: string;
    groupBy: string;
  };
  totals: {
    flights: number;
    arrivalFlights: number;
    arrivalPassengers: number;
    arrivalBaggage: number;
    arrivalCargo: number;
    arrivalMail: number;
    departureFlights: number;
    departurePassengers: number;
    departureBaggage: number;
    departureCargo: number;
    departureMail: number;
    totalPassengers: number;
    totalBaggage: number;
    totalCargo: number;
    totalMail: number;
  };
  groupedData: Array<{
    label: string;
    displayLabel: string;
    flights: number;
    passengers: number;
    arrivalFlights: number;
    departureFlights: number;
  }>;
  flights: any[];
  totalFlightsCount: number;
}

interface Airline {
  id: string;
  name: string;
  icaoCode: string;
}

export default function CustomReportPage() {
  const [dateFrom, setDateFrom] = useState(getTodayDateString());
  const [dateTo, setDateTo] = useState(getTodayDateString());
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [operationTypeId, setOperationTypeId] = useState('ALL');
  const [operationTypes, setOperationTypes] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [groupBy, setGroupBy] = useState('day');

  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);

  const [reportData, setReportData] = useState<CustomReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch airlines for filter
  useEffect(() => {
    const fetchAirlines = async () => {
      try {
        const response = await fetch('/api/airlines');
        if (response.ok) {
          const result = await response.json();
          setAirlines(result.data);
        }
      } catch (err) {
        console.error('Error fetching airlines:', err);
      }
    };

    fetchAirlines();
  }, []);

  // Fetch operation types for filter
  useEffect(() => {
    const fetchOperationTypes = async () => {
      try {
        const response = await fetch('/api/operation-types?activeOnly=true');
        if (response.ok) {
          const result = await response.json();
          setOperationTypes(result.data);
        }
      } catch (err) {
        console.error('Error fetching operation types:', err);
      }
    };

    fetchOperationTypes();
  }, []);

  // Fetch routes for filter
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('/api/flights?limit=1000');
        if (response.ok) {
          const result = await response.json();
          const uniqueRoutes = Array.from(new Set(result.data.map((f: any) => f.route))).sort();
          setRoutes(uniqueRoutes as string[]);
        }
      } catch (err) {
        console.error('Error fetching routes:', err);
      }
    };

    fetchRoutes();
  }, []);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateFrom,
          dateTo,
          airlines: selectedAirlines,
          routes: selectedRoutes,
          operationTypeId,
          groupBy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri generisanju izvještaja');
      }

      const result = await response.json();
      setReportData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['CUSTOM IZVJEŠTAJ - Aerodrom Tuzla'],
      ['Period:', `${reportData.filters.dateFrom} - ${reportData.filters.dateTo}`],
      ['Grupe po:', reportData.filters.groupBy],
      [],
      ['UKUPNO'],
      ['Ukupno letova:', reportData.totals.flights],
      ['Ukupno putnika:', reportData.totals.totalPassengers],
      ['Ukupno prtljaga (kg):', reportData.totals.totalBaggage],
      ['Ukupno cargo (kg):', reportData.totals.totalCargo],
      ['Ukupno pošte (kg):', reportData.totals.totalMail],
      [],
      ['DOLAZAK'],
      ['Letova:', reportData.totals.arrivalFlights],
      ['Putnika:', reportData.totals.arrivalPassengers],
      ['Prtljag (kg):', reportData.totals.arrivalBaggage],
      ['Cargo (kg):', reportData.totals.arrivalCargo],
      ['Pošta (kg):', reportData.totals.arrivalMail],
      [],
      ['ODLAZAK'],
      ['Letova:', reportData.totals.departureFlights],
      ['Putnika:', reportData.totals.departurePassengers],
      ['Prtljag (kg):', reportData.totals.departureBaggage],
      ['Cargo (kg):', reportData.totals.departureCargo],
      ['Pošta (kg):', reportData.totals.departureMail],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Sažetak');

    // Grouped data sheet
    const groupedDataExport = reportData.groupedData.map(g => ({
      [reportData.filters.groupBy]: g.displayLabel,
      'Letovi': g.flights,
      'Putnici': g.passengers,
      'Dolazaka': g.arrivalFlights,
      'Odlazaka': g.departureFlights,
    }));

    const groupedSheet = XLSX.utils.json_to_sheet(groupedDataExport);
    XLSX.utils.book_append_sheet(wb, groupedSheet, 'Grupirani podaci');

    // Download
    XLSX.writeFile(wb, `Custom_izvjestaj_${formatDateDisplay(getTodayDateString())}.xlsx`);
  };

  const toggleAirline = (icaoCode: string) => {
    setSelectedAirlines(prev =>
      prev.includes(icaoCode)
        ? prev.filter(a => a !== icaoCode)
        : [...prev, icaoCode]
    );
  };

  const toggleRoute = (route: string) => {
    setSelectedRoutes(prev =>
      prev.includes(route)
        ? prev.filter(r => r !== route)
        : [...prev, route]
    );
  };

  const COLORS = ['#3392C5', '#16A34A', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Filter Builder */}
        <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Filteri</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Date Range */}
            <div>
              <Label htmlFor="dateFrom">Datum od</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Datum do</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Operation Type */}
            <div>
              <Label htmlFor="operationTypeId">Tip operacije</Label>
              <select
                id="operationTypeId"
                value={operationTypeId}
                onChange={(e) => setOperationTypeId(e.target.value)}
                className="w-full mt-1 flex h-10 rounded-xl border border-dark-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="ALL">Sve</option>
                {operationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Group By */}
            <div>
              <Label htmlFor="groupBy">Grupiraj po</Label>
              <select
                id="groupBy"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full mt-1 flex h-10 rounded-xl border border-dark-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="day">Dan</option>
                <option value="airline">Aviokompanija</option>
                <option value="route">Ruta</option>
                <option value="operationType">Tip operacije</option>
              </select>
            </div>
          </div>

          {/* Airlines Multi-Select */}
          <div className="mb-4">
            <Label>Aviokompanije</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {airlines.map((airline) => (
                <button
                  key={airline.icaoCode}
                  onClick={() => toggleAirline(airline.icaoCode)}
                  className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${
                    selectedAirlines.includes(airline.icaoCode)
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-50 text-dark-900 hover:bg-primary-50'
                  }`}
                >
                  {airline.icaoCode} - {airline.name}
                </button>
              ))}
              {selectedAirlines.length > 0 && (
                <button
                  onClick={() => setSelectedAirlines([])}
                  className="px-3 py-1.5 rounded-xl text-sm bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Očisti sve
                </button>
              )}
            </div>
          </div>

          {/* Routes Multi-Select */}
          <div className="mb-4">
            <Label>Rute</Label>
            <div className="mt-2 max-h-40 overflow-y-auto border border-dark-100 rounded-xl p-2">
              <div className="flex flex-wrap gap-2">
                {routes.map((route) => (
                  <button
                    key={route}
                    onClick={() => toggleRoute(route)}
                    className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${
                      selectedRoutes.includes(route)
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-50 text-dark-900 hover:bg-primary-50'
                    }`}
                  >
                    {route}
                  </button>
                ))}
              </div>
            </div>
            {selectedRoutes.length > 0 && (
              <button
                onClick={() => setSelectedRoutes([])}
                className="mt-2 px-3 py-1.5 rounded-xl text-sm bg-red-100 text-red-700 hover:bg-red-200"
              >
                Očisti sve rute
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="bg-primary-600 hover:bg-primary-600/90 text-white"
            >
              {isLoading ? 'Generiše se...' : 'Generiši izvještaj'}
            </Button>
            {reportData && (
              <Button
                onClick={handleExportToExcel}
                variant="outline"
              >
                Exportuj u Excel
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Ukupno letova</p>
                <p className="text-3xl font-semibold text-primary-600">{reportData.totals.flights}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Ukupno putnika</p>
                <p className="text-3xl font-semibold text-primary-600">{reportData.totals.totalPassengers}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Dolazaka</p>
                <p className="text-3xl font-semibold text-success">{reportData.totals.arrivalFlights}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Odlazaka</p>
                <p className="text-3xl font-semibold text-success">{reportData.totals.departureFlights}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">
                Vizualizacija ({groupBy})
              </h3>
              {groupBy === 'day' ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.groupedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                    <XAxis
                      dataKey="displayLabel"
                      tick={{ fontSize: 11, fill: '#9A9A9A' }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E2E2E4',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="flights"
                      stroke="#3392C5"
                      strokeWidth={2}
                      name="Letovi"
                    />
                    <Line
                      type="monotone"
                      dataKey="passengers"
                      stroke="#16A34A"
                      strokeWidth={2}
                      name="Putnici"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : groupBy === 'operationType' ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.groupedData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ payload }) =>
                        payload ? `${payload.displayLabel} (${payload.flights})` : ''
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="flights"
                    >
                      {reportData.groupedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E2E2E4',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.groupedData.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#9A9A9A' }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E2E2E4',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="flights" fill="#3392C5" radius={[8, 8, 0, 0]} name="Letovi" />
                    <Bar dataKey="passengers" fill="#16A34A" radius={[8, 8, 0, 0]} name="Putnici" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Grouped Data Table */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">
                Grupirani podaci ({reportData.groupedData.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        {groupBy === 'day' ? 'Datum' : groupBy === 'airline' ? 'Aviokompanija' : groupBy === 'route' ? 'Ruta' : 'Tip'}
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Letovi
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Putnici
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Dolazaka
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Odlazaka
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.groupedData.map((item, idx) => (
                      <tr key={idx} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm font-medium">{item.displayLabel}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.passengers}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.arrivalFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.departureFlights}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
