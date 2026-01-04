'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  FileText,
  Calendar,
  TrendingUp,
  Download,
  Clock,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Filter,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';

export default function GenerateReportPage() {
  const router = useRouter();

  // State za BHDCA generisanje
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  const [generatedFileName, setGeneratedFileName] = useState('');

  // State za BHANSA generisanje
  const [bhansaYear, setBhansaYear] = useState(new Date().getFullYear());
  const [bhansaMonth, setBhansaMonth] = useState(new Date().getMonth() + 1);
  const [isBhansaGenerating, setIsBhansaGenerating] = useState(false);
  const [bhansaMessage, setBhansaMessage] = useState('');
  const [bhansaFileName, setBhansaFileName] = useState('');

  // State za Wizz Air Performance generisanje
  const [wizzairYear, setWizzairYear] = useState(new Date().getFullYear());
  const [wizzairMonth, setWizzairMonth] = useState(new Date().getMonth() + 1);
  const [isWizzairGenerating, setIsWizzairGenerating] = useState(false);
  const [wizzairMessage, setWizzairMessage] = useState('');
  const [wizzairFileName, setWizzairFileName] = useState('');

  // State za Carina generisanje
  const [customsYear, setCustomsYear] = useState(new Date().getFullYear());
  const [customsMonth, setCustomsMonth] = useState(new Date().getMonth() + 1);
  const [isCustomsGenerating, setIsCustomsGenerating] = useState(false);
  const [customsMessage, setCustomsMessage] = useState('');
  const [customsFileName, setCustomsFileName] = useState('');

  // State za Direktora generisanje
  const [directorYear, setDirectorYear] = useState(new Date().getFullYear());
  const [directorMonth, setDirectorMonth] = useState(new Date().getMonth() + 1);
  const [isDirectorGenerating, setIsDirectorGenerating] = useState(false);
  const [directorMessage, setDirectorMessage] = useState('');
  const [directorFileName, setDirectorFileName] = useState('');

  // State za Lokalnu statistiku
  const [localYear, setLocalYear] = useState(new Date().getFullYear());
  const [localMonth, setLocalMonth] = useState(new Date().getMonth() + 1);
  const [isLocalGenerating, setIsLocalGenerating] = useState(false);
  const [localMessage, setLocalMessage] = useState('');
  const [localFileName, setLocalFileName] = useState('');

  // Funkcija za generisanje BHDCA izvještaja
  const handleGenerateBHDCA = async () => {
    setIsGenerating(true);
    setGenerationMessage('');
    setGeneratedFileName('');

    try {
      const response = await fetch('/api/reports/bhdca/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri generisanju izvještaja');
      }

      setGenerationMessage('Izvještaj uspješno generisan!');
      setGeneratedFileName(data.fileName);
    } catch (error: any) {
      setGenerationMessage(`Greška: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Funkcija za preuzimanje BHDCA izvještaja
  const handleDownload = () => {
    if (generatedFileName) {
      window.open(`/api/reports/bhdca/download?fileName=${generatedFileName}`, '_blank');
    }
  };

  // Funkcija za generisanje BHANSA izvještaja
  const handleGenerateBHANSA = async () => {
    setIsBhansaGenerating(true);
    setBhansaMessage('');
    setBhansaFileName('');

    try {
      const response = await fetch('/api/reports/bhansa/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: bhansaYear,
          month: bhansaMonth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri generisanju izvještaja');
      }

      setBhansaMessage('Izvještaj uspješno generisan!');
      setBhansaFileName(data.fileName);
    } catch (error: any) {
      setBhansaMessage(`Greška: ${error.message}`);
    } finally {
      setIsBhansaGenerating(false);
    }
  };

  // Funkcija za preuzimanje BHANSA izvještaja
  const handleBhansaDownload = () => {
    if (bhansaFileName) {
      window.open(`/api/reports/bhansa/download?fileName=${bhansaFileName}`, '_blank');
    }
  };

  // Funkcija za generisanje Wizz Air Performance izvještaja
  const handleGenerateWizzair = async () => {
    setIsWizzairGenerating(true);
    setWizzairMessage('');
    setWizzairFileName('');

    try {
      const response = await fetch('/api/reports/wizzair/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: wizzairYear,
          month: wizzairMonth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri generisanju izvještaja');
      }

      setWizzairMessage('Izvještaj uspješno generisan!');
      setWizzairFileName(data.fileName);
    } catch (error: any) {
      setWizzairMessage(`Greška: ${error.message}`);
    } finally {
      setIsWizzairGenerating(false);
    }
  };

  // Funkcija za preuzimanje Wizz Air izvještaja
  const handleWizzairDownload = () => {
    if (wizzairFileName) {
      window.open(`/api/reports/wizzair/download?fileName=${wizzairFileName}`, '_blank');
    }
  };

  // Funkcija za generisanje carinskog izvještaja
  const handleGenerateCustoms = async () => {
    setIsCustomsGenerating(true);
    setCustomsMessage('');
    setCustomsFileName('');

    try {
      const response = await fetch('/api/reports/customs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: customsYear,
          month: customsMonth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri generisanju izvještaja');
      }

      setCustomsMessage('Izvještaj uspješno generisan!');
      setCustomsFileName(data.fileName);
    } catch (error: any) {
      setCustomsMessage(`Greška: ${error.message}`);
    } finally {
      setIsCustomsGenerating(false);
    }
  };

  // Funkcija za preuzimanje carinskog izvještaja
  const handleCustomsDownload = () => {
    if (customsFileName) {
      window.open(`/api/reports/customs/download?fileName=${customsFileName}`, '_blank');
    }
  };

  // Funkcija za generisanje izvještaja za direktora
  const handleGenerateDirector = async () => {
    setIsDirectorGenerating(true);
    setDirectorMessage('');
    setDirectorFileName('');

    try {
      const response = await fetch('/api/reports/director/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: directorYear,
          month: directorMonth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri generisanju izvještaja');
      }

      setDirectorMessage('Izvještaj uspješno generisan!');
      setDirectorFileName(data.fileName);
    } catch (error: any) {
      setDirectorMessage(`Greška: ${error.message}`);
    } finally {
      setIsDirectorGenerating(false);
    }
  };

  // Funkcija za preuzimanje izvještaja za direktora
  const handleDirectorDownload = () => {
    if (directorFileName) {
      window.open(`/api/reports/director/download?fileName=${directorFileName}`, '_blank');
    }
  };

  // Funkcija za generisanje lokalne statistike
  const handleGenerateLocal = async () => {
    setIsLocalGenerating(true);
    setLocalMessage('');
    setLocalFileName('');

    try {
      const response = await fetch('/api/reports/local/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: localYear,
          month: localMonth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri generisanju izvještaja');
      }

      setLocalMessage('Izvještaj uspješno generisan!');
      setLocalFileName(data.fileName);
    } catch (error: any) {
      setLocalMessage(`Greška: ${error.message}`);
    } finally {
      setIsLocalGenerating(false);
    }
  };

  // Funkcija za preuzimanje lokalne statistike
  const handleLocalDownload = () => {
    if (localFileName) {
      window.open(`/api/reports/local/download?fileName=${localFileName}`, '_blank');
    }
  };

  const quickStats = [
    { label: 'BHDCA', value: 'ICAO', trend: 'Standard' },
    { label: 'Formati', value: 'Excel', trend: 'Dostupno' },
    { label: 'Generisano', value: '24', trend: '+4' },
  ];

  return (
    <MainLayout>
      <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
        {/* Header Section */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-slate-100 rounded-xl">
                    <FileSpreadsheet className="w-6 h-6 text-slate-700" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">Generiši izvještaje</h1>
                    <p className="text-slate-600 text-sm mt-1">Automatsko generisanje mjesečnih izvještaja u Excel formatu</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <p className="text-slate-500 text-xs">Dostupno izvještaja</p>
                  <p className="text-2xl font-bold text-slate-900">6</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BHDCA Report Generator */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-white/20 rounded-lg">
                      <span className="text-xs font-semibold text-white uppercase tracking-wide">ICAO Standard</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">BHDCA Mjesečni izvještaj</h2>
                  <p className="text-slate-100 text-sm max-w-2xl leading-relaxed">
                    Zvanični mjesečni izvještaj za BHDCA prema ICAO standardima. Uključuje saobraćaj aerodroma,
                    city-pair podatke i statistiku letova.
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <FileSpreadsheet className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-1">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Parametri</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Godina</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mjesec</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {[
                          'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
                          'Juli', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
                        ].map((month, index) => (
                          <option key={index + 1} value={index + 1}>{month}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateBHDCA}
                      disabled={isGenerating}
                      className="w-full py-3 px-4 bg-slate-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generišem...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-4 h-4" />
                          Generiši izvještaj
                        </>
                      )}
                    </button>
                  </div>

                  {/* Messages */}
                  {generationMessage && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      generationMessage.includes('Greška')
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        generationMessage.includes('Greška')
                          ? 'text-red-700'
                          : 'text-green-700'
                      }`}>
                        {generationMessage}
                      </p>
                      {generatedFileName && (
                        <button
                          onClick={handleDownload}
                          className="mt-3 w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Preuzmi izvještaj
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="lg:col-span-2 bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Sadržaj izvještaja</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-slate-700">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Airport Traffic</p>
                        <p className="text-sm text-slate-600">Aircraft movements, passengers (embarked/disembarked), freight i mail po tipu operacije</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-slate-700">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">O-D Traffic (Scheduled)</p>
                        <p className="text-sm text-slate-600">City-pair podaci za scheduled letove (putnici, freight, mail)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-slate-700">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">O-D Traffic (Non-Scheduled)</p>
                        <p className="text-sm text-slate-600">City-pair podaci za non-scheduled letove (charter, MEDEVAC, itd.)</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-300">
                    <p className="text-xs text-slate-600 font-medium mb-2">Format izvoza:</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1.5 bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">Excel (.xlsx)</span>
                      <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs text-slate-500">PDF (uskoro)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BHANSA Report Generator */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-white/20 rounded-lg">
                      <span className="text-xs font-semibold text-white uppercase tracking-wide">Mjesečni izvještaj</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">BHANSA Izvještaj o prometu</h2>
                  <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
                    Detaljni mjesečni izvještaj o prometu sa detaljima o avionima, putnicima, infantima i rutama.
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <FileSpreadsheet className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-1">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Parametri</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Godina</label>
                      <select
                        value={bhansaYear}
                        onChange={(e) => setBhansaYear(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mjesec</label>
                      <select
                        value={bhansaMonth}
                        onChange={(e) => setBhansaMonth(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {[
                          'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
                          'Juli', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
                        ].map((month, index) => (
                          <option key={index + 1} value={index + 1}>{month}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateBHANSA}
                      disabled={isBhansaGenerating}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                      {isBhansaGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generišem...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-4 h-4" />
                          Generiši izvještaj
                        </>
                      )}
                    </button>
                  </div>

                  {bhansaMessage && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      bhansaMessage.includes('Greška')
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        bhansaMessage.includes('Greška')
                          ? 'text-red-700'
                          : 'text-green-700'
                      }`}>
                        {bhansaMessage}
                      </p>
                      {bhansaFileName && (
                        <button
                          onClick={handleBhansaDownload}
                          className="mt-3 w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Preuzmi izvještaj
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="lg:col-span-2 bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Sadržaj izvještaja</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Detalji letova</p>
                        <p className="text-sm text-slate-600">Datum, aviokompanija, tip aviona, registracija, MTOW, broj leta</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Rute i putnici</p>
                        <p className="text-sm text-slate-600">FROM-TO rute, broj putnika (uključujući infante), tip leta (R/H)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Adrese aviokompanija</p>
                        <p className="text-sm text-slate-600">Puni detalji kontakata aviokompanija</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-300">
                    <p className="text-xs text-slate-600 font-medium mb-2">Format izvoza:</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1.5 bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">Excel (.xlsx)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customs Report Generator */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-600 to-slate-500 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-white/20 rounded-lg">
                      <span className="text-xs font-semibold text-white uppercase tracking-wide">Mjesečna statistika</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Statistika za Carinu</h2>
                  <p className="text-slate-100 text-sm max-w-2xl leading-relaxed">
                    Mjesečni statistički izvještaj za carinu sa pregledom putnika i tereta. Razdvajanje po redovnom i vanrednom prometu.
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <FileSpreadsheet className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Parametri</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Godina</label>
                      <select
                        value={customsYear}
                        onChange={(e) => setCustomsYear(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mjesec</label>
                      <select
                        value={customsMonth}
                        onChange={(e) => setCustomsMonth(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {[
                          'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
                          'Juli', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
                        ].map((month, index) => (
                          <option key={index + 1} value={index + 1}>{month}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateCustoms}
                      disabled={isCustomsGenerating}
                      className="w-full py-3 px-4 bg-slate-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                      {isCustomsGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generišem...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-4 h-4" />
                          Generiši izvještaj
                        </>
                      )}
                    </button>
                  </div>

                  {customsMessage && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      customsMessage.includes('Greška')
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        customsMessage.includes('Greška')
                          ? 'text-red-700'
                          : 'text-green-700'
                      }`}>
                        {customsMessage}
                      </p>
                      {customsFileName && (
                        <button
                          onClick={handleCustomsDownload}
                          className="mt-3 w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Preuzmi izvještaj
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Sadržaj izvještaja</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Redovni i vanredni promet</p>
                        <p className="text-sm text-slate-600">Broj letova, ukrcani i iskrcani putnici po kategorijama</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Aviokompanije</p>
                        <p className="text-sm text-slate-600">Detaljna razrada redovnog prometa po kompanijama</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Teret</p>
                        <p className="text-sm text-slate-600">Utovareno, istovareno i ukupno (u tonama)</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-300">
                    <p className="text-xs text-slate-600 font-medium mb-2">Format izvoza:</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1.5 bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">Excel (.xlsx)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Director Report Generator */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-white/20 rounded-lg">
                      <span className="text-xs font-semibold text-white uppercase tracking-wide">Januar - odabrani mjesec</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Izvještaj za Direktora</h2>
                  <p className="text-indigo-100 text-sm max-w-2xl leading-relaxed">
                    Identičan format kao Carina, sa mjesečnim tabelama od januara do odabranog mjeseca i završnim summary.
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <FileSpreadsheet className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Parametri</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Godina</label>
                      <select
                        value={directorYear}
                        onChange={(e) => setDirectorYear(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Do mjeseca</label>
                      <select
                        value={directorMonth}
                        onChange={(e) => setDirectorMonth(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {[
                          'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
                          'Juli', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
                        ].map((month, index) => (
                          <option key={index + 1} value={index + 1}>{month}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateDirector}
                      disabled={isDirectorGenerating}
                      className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                      {isDirectorGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generišem...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-4 h-4" />
                          Generiši izvještaj
                        </>
                      )}
                    </button>
                  </div>

                  {directorMessage && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      directorMessage.includes('Greška')
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        directorMessage.includes('Greška')
                          ? 'text-red-700'
                          : 'text-green-700'
                      }`}>
                        {directorMessage}
                      </p>
                      {directorFileName && (
                        <button
                          onClick={handleDirectorDownload}
                          className="mt-3 w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Preuzmi izvještaj
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Sadržaj izvještaja</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Mjesečne tabele</p>
                        <p className="text-sm text-slate-600">Redovni, vanredni promet i ostala slijetanja po mjesecu</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Summary ukupno</p>
                        <p className="text-sm text-slate-600">Zbir svih mjeseci sa ukupnim brojkama</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Format</p>
                        <p className="text-sm text-slate-600">Identičan izgled kao Carina izvještaj</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-300">
                    <p className="text-xs text-slate-600 font-medium mb-2">Format izvoza:</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1.5 bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">Excel (.xlsx)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local Statistics Report Generator */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-white/20 rounded-lg">
                      <span className="text-xs font-semibold text-white uppercase tracking-wide">Mjesečni izvještaj</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Lokalna statistika</h2>
                  <p className="text-teal-100 text-sm max-w-2xl leading-relaxed">
                    Dinamični izvještaj lokalne statistike sa redovnim, vanrednim slijetanjima i fakturisanjem po aviokompanijama.
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <FileSpreadsheet className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Parametri</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Godina</label>
                      <select
                        value={localYear}
                        onChange={(e) => setLocalYear(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mjesec</label>
                      <select
                        value={localMonth}
                        onChange={(e) => setLocalMonth(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {[
                          'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
                          'Juli', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
                        ].map((month, index) => (
                          <option key={index + 1} value={index + 1}>{month}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateLocal}
                      disabled={isLocalGenerating}
                      className="w-full py-3 px-4 bg-teal-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                      {isLocalGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generišem...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-4 h-4" />
                          Generiši izvještaj
                        </>
                      )}
                    </button>
                  </div>

                  {localMessage && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      localMessage.includes('Greška')
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        localMessage.includes('Greška')
                          ? 'text-red-700'
                          : 'text-green-700'
                      }`}>
                        {localMessage}
                      </p>
                      {localFileName && (
                        <button
                          onClick={handleLocalDownload}
                          className="mt-3 w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Preuzmi izvještaj
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Sadržaj izvještaja</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Redovni promet</p>
                        <p className="text-sm text-slate-600">Dinamične destinacije po aviokompanijama za odabrani mjesec</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Vanredni i domestic</p>
                        <p className="text-sm text-slate-600">Pregled vanrednog i domestic prometa sa teretom</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Fakturisanje</p>
                        <p className="text-sm text-slate-600">Automatski izračuni po Wizz, Pegasus, Ryanair i Ajet</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-300">
                    <p className="text-xs text-slate-600 font-medium mb-2">Format izvoza:</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1.5 bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">Excel (.xlsx)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wizz Air Performance Report Generator */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-700 to-violet-600 px-8 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-white/20 rounded-lg">
                      <span className="text-xs font-semibold text-white uppercase tracking-wide">Daily Performance</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Wizz Air Performance Table</h2>
                  <p className="text-violet-100 text-sm max-w-2xl leading-relaxed">
                    Dnevni performance izvještaj za Wizz Air. Jedan sheet po danu mjeseca sa detaljnim podacima o letovima, kašnjenjima i UTC vremenima.
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <FileSpreadsheet className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Parametri</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Godina</label>
                      <select
                        value={wizzairYear}
                        onChange={(e) => setWizzairYear(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Mjesec</label>
                      <select
                        value={wizzairMonth}
                        onChange={(e) => setWizzairMonth(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {[
                          'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
                          'Juli', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
                        ].map((month, index) => (
                          <option key={index + 1} value={index + 1}>{month}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateWizzair}
                      disabled={isWizzairGenerating}
                      className="w-full py-3 px-4 bg-violet-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                      {isWizzairGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generišem...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-4 h-4" />
                          Generiši izvještaj
                        </>
                      )}
                    </button>
                  </div>

                  {wizzairMessage && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      wizzairMessage.includes('Greška')
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        wizzairMessage.includes('Greška')
                          ? 'text-red-700'
                          : 'text-green-700'
                      }`}>
                        {wizzairMessage}
                      </p>
                      {wizzairFileName && (
                        <button
                          onClick={handleWizzairDownload}
                          className="mt-3 w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Preuzmi izvještaj
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Sadržaj izvještaja</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Dnevna organizacija</p>
                        <p className="text-sm text-slate-600">Jedan sheet po danu mjeseca, lakše praćenje</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">UTC vremena</p>
                        <p className="text-sm text-slate-600">STA, ATA, STD, DCT, ATD - svi u UTC timezone</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Delay tracking</p>
                        <p className="text-sm text-slate-600">Do 3 delay koda po letu sa minutama i razlozima</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 mb-0.5">Wizz Air flota</p>
                        <p className="text-sm text-slate-600">W6 (Wizz Hungary), W4 (Wizz Malta) - svi entiteti</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-300">
                    <p className="text-xs text-slate-600 font-medium mb-2">Format izvoza:</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1.5 bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">Excel (.xlsx)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
