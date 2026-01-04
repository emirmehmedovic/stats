'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';

interface YearlyReportData {
  year: number;
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
  monthlyBreakdown: Array<{
    month: string;
    monthNumber: number;
    flights: number;
    passengers: number;
    arrivalFlights: number;
    departureFlights: number;
    cargo: number;
  }>;
  yoyComparison: {
    flights: {
      current: number;
      previous: number;
      growth: number;
    };
    passengers: {
      current: number;
      previous: number;
      growth: number;
    };
    cargo: {
      current: number;
      previous: number;
      growth: number;
    };
  };
  byAirline: Array<{
    airline: string;
    icaoCode: string;
    flights: number;
    passengers: number;
  }>;
  seasonalAnalysis: Array<{
    quarter: string;
    flights: number;
    passengers: number;
    avgFlightsPerMonth: number;
  }>;
  hasPreviousYearData: boolean;
}

export default function YearlyReportPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [reportData, setReportData] = useState<YearlyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/yearly?year=${selectedYear}`);

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
      ['GODIŠNJI IZVJEŠTAJ - Aerodrom Tuzla'],
      ['Godina:', reportData.year],
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

    // Monthly breakdown sheet
    const monthlyData = reportData.monthlyBreakdown.map(m => ({
      'Mjesec': m.month,
      'Letovi': m.flights,
      'Putnici': m.passengers,
      'Dolazaka': m.arrivalFlights,
      'Odlazaka': m.departureFlights,
      'Cargo (kg)': m.cargo,
    }));

    const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, monthlySheet, 'Mjesečni pregled');

    // Seasonal analysis sheet
    const seasonalData = reportData.seasonalAnalysis.map(s => ({
      'Kvartal': s.quarter,
      'Letovi': s.flights,
      'Putnici': s.passengers,
      'Prosječno letova/mj': s.avgFlightsPerMonth,
    }));

    const seasonalSheet = XLSX.utils.json_to_sheet(seasonalData);
    XLSX.utils.book_append_sheet(wb, seasonalSheet, 'Sezonska analiza');

    // By airline sheet
    const airlineData = reportData.byAirline.map(a => ({
      'Aviokompanija': a.airline,
      'ICAO kod': a.icaoCode,
      'Broj letova': a.flights,
      'Broj putnika': a.passengers,
    }));

    const airlineSheet = XLSX.utils.json_to_sheet(airlineData);
    XLSX.utils.book_append_sheet(wb, airlineSheet, 'Po aviokompanijama');

    // YoY comparison sheet (if previous year data exists)
    if (reportData.hasPreviousYearData) {
      const yoyData = [
        ['YEAR-OVER-YEAR KOMPARACIJA'],
        ['Metrika', reportData.year - 1, reportData.year, 'Rast (%)'],
        ['Letovi', reportData.yoyComparison.flights.previous, reportData.yoyComparison.flights.current, reportData.yoyComparison.flights.growth.toFixed(2) + '%'],
        ['Putnici', reportData.yoyComparison.passengers.previous, reportData.yoyComparison.passengers.current, reportData.yoyComparison.passengers.growth.toFixed(2) + '%'],
        ['Cargo (kg)', reportData.yoyComparison.cargo.previous, reportData.yoyComparison.cargo.current, reportData.yoyComparison.cargo.growth.toFixed(2) + '%'],
      ];

      const yoySheet = XLSX.utils.aoa_to_sheet(yoyData);
      XLSX.utils.book_append_sheet(wb, yoySheet, 'YoY komparacija');
    }

    // Download
    XLSX.writeFile(wb, `Godisnji_izvjestaj_${reportData.year}.xlsx`);
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Year Picker */}
        <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="year">Izaberite godinu</Label>
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

            {/* YoY Comparison */}
            {reportData.hasPreviousYearData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                  <p className="text-xs text-dark-500 mb-1">Rast letova (YoY)</p>
                  <p className={`text-3xl font-semibold ${reportData.yoyComparison.flights.growth >= 0 ? 'text-success' : 'text-red-500'}`}>
                    {reportData.yoyComparison.flights.growth >= 0 ? '+' : ''}{reportData.yoyComparison.flights.growth.toFixed(1)}%
                  </p>
                  <p className="text-xs text-dark-500 mt-2">
                    {reportData.year - 1}: {reportData.yoyComparison.flights.previous} | {reportData.year}: {reportData.yoyComparison.flights.current}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                  <p className="text-xs text-dark-500 mb-1">Rast putnika (YoY)</p>
                  <p className={`text-3xl font-semibold ${reportData.yoyComparison.passengers.growth >= 0 ? 'text-success' : 'text-red-500'}`}>
                    {reportData.yoyComparison.passengers.growth >= 0 ? '+' : ''}{reportData.yoyComparison.passengers.growth.toFixed(1)}%
                  </p>
                  <p className="text-xs text-dark-500 mt-2">
                    {reportData.year - 1}: {reportData.yoyComparison.passengers.previous} | {reportData.year}: {reportData.yoyComparison.passengers.current}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                  <p className="text-xs text-dark-500 mb-1">Rast carga (YoY)</p>
                  <p className={`text-3xl font-semibold ${reportData.yoyComparison.cargo.growth >= 0 ? 'text-success' : 'text-red-500'}`}>
                    {reportData.yoyComparison.cargo.growth >= 0 ? '+' : ''}{reportData.yoyComparison.cargo.growth.toFixed(1)}%
                  </p>
                  <p className="text-xs text-dark-500 mt-2">
                    {reportData.year - 1}: {reportData.yoyComparison.cargo.previous} kg | {reportData.year}: {reportData.yoyComparison.cargo.current} kg
                  </p>
                </div>
              </div>
            )}

            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Mjesečni trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                  <XAxis
                    dataKey="month"
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

            {/* Seasonal Analysis Chart */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Sezonska analiza (kvartali)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.seasonalAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                  <XAxis
                    dataKey="quarter"
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
            </div>

            {/* Monthly Breakdown Table */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Mjesečni pregled</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Mjesec
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
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Cargo (kg)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthlyBreakdown.map((month) => (
                      <tr key={month.monthNumber} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm font-medium">{month.month}</td>
                        <td className="px-4 py-3 text-sm text-right">{month.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{month.passengers}</td>
                        <td className="px-4 py-3 text-sm text-right">{month.arrivalFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">{month.departureFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">{month.cargo}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-dark-100 bg-dark-50">
                    <tr>
                      <td className="px-4 py-3 text-sm font-semibold">UKUPNO</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{reportData.totals.flights}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{reportData.totals.totalPassengers}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{reportData.totals.arrivalFlights}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{reportData.totals.departureFlights}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{reportData.totals.totalCargo}</td>
                    </tr>
                  </tfoot>
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
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.byAirline.map((airline) => (
                      <tr key={airline.icaoCode} className="border-b border-dark-100">
                        <td className="px-4 py-3 text-sm">{airline.airline}</td>
                        <td className="px-4 py-3 text-sm font-mono">{airline.icaoCode}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{airline.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{airline.passengers}</td>
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
