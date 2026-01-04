'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDateStringDaysAgo, getTodayDateString } from '@/lib/dates';
import * as XLSX from 'xlsx';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';

type RouteStats = {
  route: string;
  frequency: number;
  totalPassengers: number;
  totalSeatsOffered: number;
  arrivalCount: number;
  departureCount: number;
  airlines: string[];
  airlinesCount: number;
  avgPassengersPerFlight: number;
  loadFactor: number;
  avgDelayArrival: number;
  avgDelayDeparture: number;
};

type DestinationStats = {
  destination: string;
  routeCount: number;
  totalFlights: number;
  totalPassengers: number;
};

type AnalyticsData = {
  success: boolean;
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalRoutes: number;
    totalFlights: number;
    totalPassengers: number;
    avgLoadFactor: number;
    avgPassengersPerRoute: number;
    topRoute: RouteStats | null;
    busiestRoute: RouteStats | null;
  };
  routes: RouteStats[];
  byDestination: DestinationStats[];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

export default function RouteAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState(getDateStringDaysAgo(30));
  const [dateTo, setDateTo] = useState(getTodayDateString());
  const [airline, setAirline] = useState('');
  const [limit, setLimit] = useState('20');
  const [airlines, setAirlines] = useState<Array<{ icaoCode: string; name: string }>>([]);
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch airlines for filter
  useEffect(() => {
    fetch('/api/airlines')
      .then((res) => res.json())
      .then((data) => {
        if (data.airlines) {
          setAirlines(data.airlines);
        }
      })
      .catch((err) => console.error('Failed to fetch airlines:', err));
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
        limit,
      });
      
      if (airline) {
        params.append('airline', airline);
      }

      const response = await fetch(`/api/analytics/routes?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportToExcel = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Route Analysis Report'],
      ['Period', `${data.period.from} to ${data.period.to}`],
      [],
      ['Summary Statistics'],
      ['Total Routes', data.summary.totalRoutes],
      ['Total Flights', data.summary.totalFlights],
      ['Total Passengers', data.summary.totalPassengers],
      ['Average Load Factor', `${data.summary.avgLoadFactor}%`],
      ['Avg Passengers per Route', data.summary.avgPassengersPerRoute],
      [],
      ['Top Route by Frequency', data.summary.topRoute?.route || 'N/A'],
      ['Flights', data.summary.topRoute?.frequency || 0],
      [],
      ['Busiest Route by Passengers', data.summary.busiestRoute?.route || 'N/A'],
      ['Total Passengers', data.summary.busiestRoute?.totalPassengers || 0],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Routes sheet
    const routesData = data.routes.map((route) => ({
      'Route': route.route,
      'Total Flights': route.frequency,
      'Arrivals': route.arrivalCount,
      'Departures': route.departureCount,
      'Total Passengers': route.totalPassengers,
      'Seats Offered': route.totalSeatsOffered,
      'Load Factor (%)': route.loadFactor,
      'Avg Passengers/Flight': route.avgPassengersPerFlight,
      'Airlines Count': route.airlinesCount,
      'Airlines': route.airlines.join(', '),
      'Avg Arrival Delay (min)': route.avgDelayArrival,
      'Avg Departure Delay (min)': route.avgDelayDeparture,
    }));
    const wsRoutes = XLSX.utils.json_to_sheet(routesData);
    XLSX.utils.book_append_sheet(wb, wsRoutes, 'Routes');

    // Destinations sheet
    if (data.byDestination && data.byDestination.length > 0) {
      const destData = data.byDestination.map((dest) => ({
        'Destination': dest.destination,
        'Route Count': dest.routeCount,
        'Total Flights': dest.totalFlights,
        'Total Passengers': dest.totalPassengers,
      }));
      const wsDest = XLSX.utils.json_to_sheet(destData);
      XLSX.utils.book_append_sheet(wb, wsDest, 'By Destination');
    }

    XLSX.writeFile(wb, `route-analysis-${dateFrom}-to-${dateTo}.xlsx`);
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Filters - Dashboard stil */}
        <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden border-[6px] border-white">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-blue-100/50 opacity-70"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-dark-900 mb-6">Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="dateFrom" className="text-dark-600 font-medium">
                Date From
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="dateTo" className="text-dark-600 font-medium">
                Date To
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="airline" className="text-dark-600 font-medium">
                Airline (Optional)
              </Label>
              <select
                id="airline"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                className="mt-1 w-full rounded-md border border-dark-100 bg-white px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">All Airlines</option>
                {airlines.map((a) => (
                  <option key={a.icaoCode} value={a.icaoCode}>
                    {a.name} ({a.icaoCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="limit" className="text-dark-600 font-medium">
                Top Routes
              </Label>
              <Input
                id="limit"
                type="number"
                min="5"
                max="100"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={fetchAnalytics}
                disabled={loading}
                className="w-full bg-gradient-to-br from-dark-900 to-dark-800 text-white hover:from-dark-800 hover:to-dark-700 shadow-soft-lg"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
              {error}
            </div>
          )}
          </div>
        </div>

        {/* Results */}
        {data && (
          <>
            {/* Summary Cards - Dashboard stil */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-200 rounded-full blur-xl opacity-60"></div>
                <div className="relative z-10">
                  <div className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-2">Total Routes</div>
                  <div className="text-4xl font-bold text-primary-600">{data.summary.totalRoutes}</div>
                  <div className="text-xs text-dark-500 mt-2">Unique routes served</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-indigo-200 rounded-full blur-xl opacity-60"></div>
                <div className="relative z-10">
                  <div className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-2">Total Flights</div>
                  <div className="text-4xl font-bold text-indigo-600">{data.summary.totalFlights}</div>
                  <div className="text-xs text-dark-500 mt-2">In selected period</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-white/70 to-green-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-green-200 rounded-full blur-xl opacity-60"></div>
                <div className="relative z-10">
                  <div className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-2">Total Passengers</div>
                  <div className="text-4xl font-bold text-green-600">{data.summary.totalPassengers.toLocaleString()}</div>
                  <div className="text-xs text-dark-500 mt-2">Across all routes</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-white/70 to-amber-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-200 rounded-full blur-xl opacity-60"></div>
                <div className="relative z-10">
                  <div className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-2">Avg Load Factor</div>
                  <div className="text-4xl font-bold text-amber-600">{data.summary.avgLoadFactor}%</div>
                  <div className="text-xs text-dark-500 mt-2">Average across routes</div>
                </div>
              </div>
            </div>

            {/* Top Routes Chart - Dashboard stil */}
            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden border-[6px] border-white">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-blue-100/40 opacity-60"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-dark-900">Top Routes by Frequency</h2>
                  <Button
                    onClick={exportToExcel}
                    className="bg-white border-2 border-dark-200 text-dark-900 hover:bg-dark-50 hover:border-dark-300 shadow-soft"
                  >
                    Export to Excel
                  </Button>
                </div>

              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.routes.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="route" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="frequency" fill="#3b82f6" name="Total Flights" />
                  <Bar dataKey="totalPassengers" fill="#10b981" name="Total Passengers" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* Destinations Pie Chart - Dashboard stil */}
            {data.byDestination && data.byDestination.length > 0 && (
              <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-white/70 to-indigo-100/40 opacity-60"></div>
                <div className="relative z-10">
                  <h2 className="text-xl font-bold text-dark-900 mb-6">Top 10 Destinations by Passengers</h2>

                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={data.byDestination}
                      dataKey="totalPassengers"
                      nameKey="destination"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ payload }) =>
                        payload
                          ? `${payload.destination}: ${payload.totalPassengers.toLocaleString()}`
                          : ''
                      }
                      labelLine={true}
                    >
                      {data.byDestination.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Detailed Routes Table - Dashboard stil */}
            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden border-[6px] border-white">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-blue-100/40 opacity-60"></div>
              <div className="relative z-10">
                <h2 className="text-xl font-bold text-dark-900 mb-6">Detailed Route Statistics</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-50 border-b-2 border-dark-100">
                    <tr>
                      <th className="text-left p-3 font-semibold text-dark-600">Route</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Flights</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Passengers</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Load Factor</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Avg Pax/Flight</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Airlines</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Avg Delay ARR</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Avg Delay DEP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.routes.map((route, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-dark-100 hover:bg-dark-50 transition-colors"
                      >
                        <td className="p-3 font-medium text-dark-900">{route.route}</td>
                        <td className="p-3 text-right text-dark-600">{route.frequency}</td>
                        <td className="p-3 text-right text-dark-600">{route.totalPassengers.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            route.loadFactor >= 85 
                              ? 'bg-green-100 text-green-800'
                              : route.loadFactor >= 70
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {route.loadFactor}%
                          </span>
                        </td>
                        <td className="p-3 text-right text-dark-600">{route.avgPassengersPerFlight}</td>
                        <td className="p-3 text-right">
                          <span className="text-dark-600 text-xs" title={route.airlines.join(', ')}>
                            {route.airlinesCount} {route.airlinesCount === 1 ? 'airline' : 'airlines'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={route.avgDelayArrival > 15 ? 'text-red-600 font-medium' : 'text-dark-600'}>
                            {route.avgDelayArrival} min
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={route.avgDelayDeparture > 15 ? 'text-red-600 font-medium' : 'text-dark-600'}>
                            {route.avgDelayDeparture} min
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.routes.length === 0 && (
                <div className="text-center py-12 text-dark-500">
                  No route data available for the selected period.
                </div>
              )}
              </div>
            </div>

            {/* Best/Worst Routes - Dashboard stil */}
            {data.summary.topRoute && data.summary.busiestRoute && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-200 rounded-full blur-xl opacity-60"></div>
                  <div className="relative z-10">
                    <h3 className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-3">Most Frequent Route</h3>
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                      {data.summary.topRoute.route}
                    </div>
                    <div className="text-sm text-dark-600">
                      {data.summary.topRoute.frequency} flights
                    </div>
                    <div className="text-sm text-dark-600 mt-1">
                      {data.summary.topRoute.totalPassengers.toLocaleString()} passengers
                    </div>
                    <div className="text-sm text-dark-600 mt-1">
                      Load Factor: {data.summary.topRoute.loadFactor}%
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-white/70 to-green-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-green-200 rounded-full blur-xl opacity-60"></div>
                  <div className="relative z-10">
                    <h3 className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-3">Busiest Route (by Passengers)</h3>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {data.summary.busiestRoute.route}
                    </div>
                    <div className="text-sm text-dark-600">
                      {data.summary.busiestRoute.totalPassengers.toLocaleString()} passengers
                    </div>
                    <div className="text-sm text-dark-600 mt-1">
                      {data.summary.busiestRoute.frequency} flights
                    </div>
                    <div className="text-sm text-dark-600 mt-1">
                      Load Factor: {data.summary.busiestRoute.loadFactor}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
