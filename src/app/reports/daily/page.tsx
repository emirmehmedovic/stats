'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';
import { MainLayout } from '@/components/layout/MainLayout';
import { Plane, Users, Building2, TrendingUp, Download, Calendar, PackageCheck, Package } from 'lucide-react';
import { formatDateDisplay, getTodayDateString } from '@/lib/dates';

interface DailyReportData {
  date: string;
  flights: any[];
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
  byAirline: Array<{
    airline: string;
    icaoCode: string;
    flights: number;
    passengers: number;
  }>;
}

export default function DailyReportPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/daily?date=${selectedDate}`);

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

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['DNEVNI IZVJE`TAJ - Aerodrom Tuzla'],
      ['Datum:', formatDateDisplay(reportData.date)],
      [],
      ['UKUPNO'],
      ['Ukupno letova:', reportData.totals.flights],
      ['Ukupno putnika:', reportData.totals.totalPassengers],
      ['Ukupno prtljaga (kg):', reportData.totals.totalBaggage],
      ['Ukupno cargo (kg):', reportData.totals.totalCargo],
      ['Ukupno poate (kg):', reportData.totals.totalMail],
      [],
      ['DOLAZAK'],
      ['Letova:', reportData.totals.arrivalFlights],
      ['Putnika:', reportData.totals.arrivalPassengers],
      ['Bebe:', reportData.totals.arrivalInfants],
      ['Prtljag (kg):', reportData.totals.arrivalBaggage],
      ['Cargo (kg):', reportData.totals.arrivalCargo],
      ['Poata (kg):', reportData.totals.arrivalMail],
      [],
      ['ODLAZAK'],
      ['Letova:', reportData.totals.departureFlights],
      ['Putnika:', reportData.totals.departurePassengers],
      ['Bebe:', reportData.totals.departureInfants],
      ['Prtljag (kg):', reportData.totals.departureBaggage],
      ['Cargo (kg):', reportData.totals.departureCargo],
      ['Poata (kg):', reportData.totals.departureMail],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Sa~etak');

    // Flights details sheet
    const flightsData = reportData.flights.map(f => ({
      'Datum': formatDateDisplay(f.date),
      'Aviokompanija': f.airline.name,
      'ICAO': f.airline.icaoCode,
      'Ruta': f.route,
      'Avion': f.aircraftType.model,
      'Registracija': f.registration,
      'Tip operacije': f.operationType,
      'Dolazak - Broj leta': f.arrivalFlightNumber || '',
      'Dolazak - Putnici': f.arrivalPassengers || 0,
      'Dolazak - Bebe': f.arrivalInfants || 0,
      'Dolazak - Prtljag (kg)': f.arrivalBaggage || 0,
      'Dolazak - Cargo (kg)': f.arrivalCargo || 0,
      'Dolazak - Poata (kg)': f.arrivalMail || 0,
      'Odlazak - Broj leta': f.departureFlightNumber || '',
      'Odlazak - Putnici': f.departurePassengers || 0,
      'Odlazak - Bebe': f.departureInfants || 0,
      'Odlazak - Prtljag (kg)': f.departureBaggage || 0,
      'Odlazak - Cargo (kg)': f.departureCargo || 0,
      'Odlazak - Poata (kg)': f.departureMail || 0,
    }));

    const flightsSheet = XLSX.utils.json_to_sheet(flightsData);
    XLSX.utils.book_append_sheet(wb, flightsSheet, 'Letovi');

    // By airline sheet
    const byAirlineData = reportData.byAirline.map(a => ({
      'Aviokompanija': a.airline,
      'ICAO kod': a.icaoCode,
      'Broj letova': a.flights,
      'Broj putnika': a.passengers,
    }));

    const byAirlineSheet = XLSX.utils.json_to_sheet(byAirlineData);
    XLSX.utils.book_append_sheet(wb, byAirlineSheet, 'Po aviokompanijama');

    // Download
    XLSX.writeFile(wb, `Dnevni_izvjestaj_${formatDateDisplay(reportData.date)}.xlsx`);
  };

  const reportDateLabel = reportData ? formatDateDisplay(reportData.date) : '';

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Header with Date Picker */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-soft-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Dnevni izvještaj</h1>
                  <p className="text-sm text-dark-300">Detaljni pregled prometa po danu</p>
                </div>
              </div>

              <div className="max-w-xs">
                <Label htmlFor="date" className="text-dark-200 text-sm mb-2 block">Izaberite datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-dark-300"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={fetchReport}
                disabled={isLoading}
                className="bg-white text-dark-900 hover:bg-white/90 font-semibold shadow-soft"
              >
                {isLoading ? 'Učitavam...' : 'Prikaži izvještaj'}
              </Button>
              {reportData && (
                <Button
                  onClick={handleExportToExcel}
                  className="bg-primary-600 hover:bg-primary-500 text-white font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportuj
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 shadow-soft">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Report Data */}
        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="flex flex-wrap gap-6">
              {[
                {
                  title: 'Ukupno letova',
                  value: reportData.totals.flights,
                  icon: Plane,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50',
                  badge: reportDateLabel,
                  size: 'md:basis-1/4',
                },
                {
                  title: 'Ukupno putnika',
                  value: reportData.totals.totalPassengers.toLocaleString('bs-BA'),
                  icon: Users,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50',
                  badge: 'Dolazak + odlazak',
                  size: 'md:basis-1/4',
                },
                {
                  title: 'Dolazaka',
                  value: reportData.totals.arrivalFlights,
                  icon: Plane,
                  color: 'text-indigo-600',
                  bgColor: 'bg-indigo-50',
                  badge: `${reportData.totals.arrivalPassengers} putnika`,
                  size: 'md:basis-1/6',
                },
                {
                  title: 'Odlazaka',
                  value: reportData.totals.departureFlights,
                  icon: Plane,
                  color: 'text-orange-600',
                  bgColor: 'bg-orange-50',
                  badge: `${reportData.totals.departurePassengers} putnika`,
                  size: 'md:basis-1/6',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer flex flex-col justify-between h-[160px] relative overflow-hidden border-[6px] border-white basis-full ${item.size} flex-grow`}
                  style={{ minWidth: '200px' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[2px] transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-primary-200 rounded-full blur-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>

                  <div className="flex justify-between items-start relative z-10">
                    <div className={`p-3.5 rounded-2xl ${item.bgColor} group-hover:scale-110 transition-transform`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <span className="px-3 py-1 bg-dark-50 rounded-full text-[10px] font-bold text-dark-500 uppercase tracking-wide">
                      {item.badge}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-3xl font-bold text-dark-900 mb-1">{item.value}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-dark-500">{item.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Totals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Arrival Totals */}
              <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-indigo-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-2xl">
                      <Plane className="w-6 h-6 text-indigo-600 transform -rotate-45" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-dark-900">Dolazak</h3>
                      <p className="text-sm text-dark-500">Ukupan promet dolaznih letova</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Putnici', value: reportData.totals.arrivalPassengers, icon: Users },
                      { label: 'Bebe', value: reportData.totals.arrivalInfants, icon: Users },
                      { label: 'Prtljag (kg)', value: reportData.totals.arrivalBaggage.toLocaleString('bs-BA'), icon: PackageCheck },
                      { label: 'Cargo (kg)', value: reportData.totals.arrivalCargo.toLocaleString('bs-BA'), icon: Package },
                      { label: 'Pošta (kg)', value: reportData.totals.arrivalMail.toLocaleString('bs-BA'), icon: Package },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-indigo-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-50">
                            <item.icon className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-sm font-medium text-dark-700">{item.label}</span>
                        </div>
                        <span className="text-lg font-bold text-dark-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Departure Totals */}
              <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white/70 to-orange-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-orange-100 rounded-2xl">
                      <Plane className="w-6 h-6 text-orange-600 transform rotate-45" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-dark-900">Odlazak</h3>
                      <p className="text-sm text-dark-500">Ukupan promet odlaznih letova</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Putnici', value: reportData.totals.departurePassengers, icon: Users },
                      { label: 'Bebe', value: reportData.totals.departureInfants, icon: Users },
                      { label: 'Prtljag (kg)', value: reportData.totals.departureBaggage.toLocaleString('bs-BA'), icon: PackageCheck },
                      { label: 'Cargo (kg)', value: reportData.totals.departureCargo.toLocaleString('bs-BA'), icon: Package },
                      { label: 'Pošta (kg)', value: reportData.totals.departureMail.toLocaleString('bs-BA'), icon: Package },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-orange-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-50">
                            <item.icon className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="text-sm font-medium text-dark-700">{item.label}</span>
                        </div>
                        <span className="text-lg font-bold text-dark-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* By Airline */}
            <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary-100 rounded-2xl">
                    <Building2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-dark-900">Po aviokompanijama</h3>
                    <p className="text-sm text-dark-500">Pregled prometa po aviokompanijama</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {reportData.byAirline.map((airline) => (
                    <div
                      key={airline.icaoCode}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-dark-50 border border-dark-100 hover:border-primary-200 hover:bg-primary-50 transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 font-bold flex items-center justify-center text-sm">
                        {airline.icaoCode}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-dark-900">{airline.airline}</p>
                        <p className="text-xs text-dark-500 uppercase tracking-wide">{airline.icaoCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-dark-900">{airline.flights}</p>
                        <p className="text-xs text-dark-500">letova</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-primary-600">{airline.passengers.toLocaleString('bs-BA')}</p>
                        <p className="text-xs text-dark-500">putnika</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Flights List */}
            <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-2xl">
                      <Plane className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-dark-900">Lista letova</h3>
                      <p className="text-sm text-dark-500">{reportData.flights.length} letova za odabrani datum</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-600">
                    {reportData.flights.length} letova
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-dark-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-dark-600 uppercase tracking-wide">
                          Aviokompanija
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-dark-600 uppercase tracking-wide">
                          Ruta
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-dark-600 uppercase tracking-wide">
                          Avion
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-dark-600 uppercase tracking-wide">
                          Dolazak
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-dark-600 uppercase tracking-wide">
                          PAX ARR
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-dark-600 uppercase tracking-wide">
                          Odlazak
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-dark-600 uppercase tracking-wide">
                          PAX DEP
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.flights.map((flight, index) => (
                        <tr
                          key={flight.id}
                          className={`border-b border-dark-100 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white/50' : 'bg-dark-50/30'}`}
                        >
                          <td className="px-4 py-4 text-sm font-medium text-dark-900">{flight.airline.name}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-primary-600">{flight.route}</td>
                          <td className="px-4 py-4 text-sm text-dark-700">{flight.aircraftType.model}</td>
                          <td className="px-4 py-4 text-sm font-mono text-dark-600">{flight.arrivalFlightNumber || '-'}</td>
                          <td className="px-4 py-4 text-sm text-right font-bold text-indigo-600">
                            {flight.arrivalPassengers || 0}
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-dark-600">{flight.departureFlightNumber || '-'}</td>
                          <td className="px-4 py-4 text-sm text-right font-bold text-orange-600">
                            {flight.departurePassengers || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
