'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatDateDisplay } from '@/lib/dates';

interface MonthlyReportData {
  year: number;
  month: number;
  monthName: string;
  totals: {
    flights: number;
    arrivalFlights: number;
    arrivalPassengers: number;
    arrivalInfants: number;
    arrivalBaggage: number;
    arrivalCargo: number;
    arrivalMail: number;
    departureFlights: number;
    departurePassengers: number;
    departureInfants: number;
    departureBaggage: number;
    departureCargo: number;
    departureMail: number;
    totalPassengers: number;
    totalBaggage: number;
    totalCargo: number;
    totalMail: number;
  };
  dailyBreakdown: Array<{
    date: string;
    dayOfWeek: string;
    flights: number;
    passengers: number;
    arrivalFlights: number;
    departureFlights: number;
  }>;
  byAirline: Array<{
    airline: string;
    icaoCode: string;
    flights: number;
    passengers: number;
    arrivalFlights: number;
    departureFlights: number;
  }>;
  topRoutes: Array<{
    route: string;
    flights: number;
    passengers: number;
  }>;
}

export default function MonthlyReportPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString().padStart(2, '0'));
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri učitavanju izvještaja');
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
      ['MJESEČNI IZVJEŠTAJ - Aerodrom Tuzla'],
      ['Period:', reportData.monthName],
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
      ['Bebe:', reportData.totals.arrivalInfants],
      ['Prtljag (kg):', reportData.totals.arrivalBaggage],
      ['Cargo (kg):', reportData.totals.arrivalCargo],
      ['Pošta (kg):', reportData.totals.arrivalMail],
      [],
      ['ODLAZAK'],
      ['Letova:', reportData.totals.departureFlights],
      ['Putnika:', reportData.totals.departurePassengers],
      ['Bebe:', reportData.totals.departureInfants],
      ['Prtljag (kg):', reportData.totals.departureBaggage],
      ['Cargo (kg):', reportData.totals.departureCargo],
      ['Pošta (kg):', reportData.totals.departureMail],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Sažetak');

    // Daily breakdown sheet
    const dailyData = reportData.dailyBreakdown.map(d => ({
      'Datum': d.date,
      'Dan': d.dayOfWeek,
      'Letovi': d.flights,
      'Putnici': d.passengers,
      'Dolazaka': d.arrivalFlights,
      'Odlazaka': d.departureFlights,
    }));

    const dailySheet = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, dailySheet, 'Po danima');

    // By airline sheet
    const airlineData = reportData.byAirline.map(a => ({
      'Aviokompanija': a.airline,
      'ICAO kod': a.icaoCode,
      'Broj letova': a.flights,
      'Broj putnika': a.passengers,
      'Dolazaka': a.arrivalFlights,
      'Odlazaka': a.departureFlights,
    }));

    const airlineSheet = XLSX.utils.json_to_sheet(airlineData);
    XLSX.utils.book_append_sheet(wb, airlineSheet, 'Po aviokompanijama');

    // Top routes sheet
    const routesData = reportData.topRoutes.map(r => ({
      'Ruta': r.route,
      'Broj letova': r.flights,
      'Broj putnika': r.passengers,
    }));

    const routesSheet = XLSX.utils.json_to_sheet(routesData);
    XLSX.utils.book_append_sheet(wb, routesSheet, 'Top rute');

    // Download
    XLSX.writeFile(wb, `Mjesecni_izvjestaj_${reportData.year}_${reportData.month.toString().padStart(2, '0')}.xlsx`);
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Month/Year Picker */}
        <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="year">Godina</Label>
              <Input
                id="year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                min="2020"
                max="2099"
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="month">Mjesec</Label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full mt-1 flex h-10 rounded-xl border border-dark-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="01">Januar</option>
                <option value="02">Februar</option>
                <option value="03">Mart</option>
                <option value="04">April</option>
                <option value="05">Maj</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Avgust</option>
                <option value="09">Septembar</option>
                <option value="10">Oktobar</option>
                <option value="11">Novembar</option>
                <option value="12">Decembar</option>
              </select>
            </div>
            <Button
              onClick={fetchReport}
              disabled={isLoading}
              className="bg-primary-600 hover:bg-primary-600/90 text-white"
            >
              {isLoading ? 'Učitavam...' : 'Prikaži izvještaj'}
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

        {/* Report Data */}
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

            {/* Daily Trend Chart */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Dnevni trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9A9A9A' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return formatDateDisplay(date);
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E2E4',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return formatDateDisplay(date);
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="flights"
                    stroke="#3392C5"
                    strokeWidth={2}
                    dot={{ fill: '#3392C5', r: 4 }}
                    name="Letovi"
                  />
                  <Line
                    type="monotone"
                    dataKey="passengers"
                    stroke="#16A34A"
                    strokeWidth={2}
                    dot={{ fill: '#16A34A', r: 4 }}
                    name="Putnici"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* By Airline Chart */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Po aviokompanijama</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.byAirline.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                  <XAxis
                    dataKey="icaoCode"
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
                    labelFormatter={(value) => {
                      const airline = reportData.byAirline.find(a => a.icaoCode === value);
                      return airline?.airline || value;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="flights" fill="#3392C5" radius={[8, 8, 0, 0]} name="Letovi" />
                  <Bar dataKey="passengers" fill="#16A34A" radius={[8, 8, 0, 0]} name="Putnici" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Routes */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Top 10 ruta</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Ruta
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Letovi
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Putnici
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topRoutes.map((route, idx) => (
                      <tr key={idx} className="border-b border-dark-100">
                        <td className="px-4 py-3 text-sm font-medium">{route.route}</td>
                        <td className="px-4 py-3 text-sm text-right">{route.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{route.passengers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Breakdown Table */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">
                Dnevni pregled ({reportData.dailyBreakdown.length} dana)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Datum
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Dan
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
                    {reportData.dailyBreakdown.map((day) => (
                      <tr key={day.date} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm">{day.date}</td>
                        <td className="px-4 py-3 text-sm">{day.dayOfWeek}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{day.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{day.passengers}</td>
                        <td className="px-4 py-3 text-sm text-right">{day.arrivalFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">{day.departureFlights}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* By Airline Table */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Po aviokompanijama</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Aviokompanija
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        ICAO
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
                    {reportData.byAirline.map((airline) => (
                      <tr key={airline.icaoCode} className="border-b border-dark-100">
                        <td className="px-4 py-3 text-sm">{airline.airline}</td>
                        <td className="px-4 py-3 text-sm font-mono">{airline.icaoCode}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{airline.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{airline.passengers}</td>
                        <td className="px-4 py-3 text-sm text-right">{airline.arrivalFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">{airline.departureFlights}</td>
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
