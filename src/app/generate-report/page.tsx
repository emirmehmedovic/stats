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
      <div className="p-8 space-y-8">
        {/* Header Section */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-soft-xl relative overflow-hidden flex flex-col justify-between h-[340px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-700 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-1">Sistem izvještavanja</p>
                  <h3 className="text-4xl font-bold tracking-tight">Generiši izvještaj</h3>
                  <p className="text-xs text-slate-300 mt-1">Kreiraj detaljne izvještaje</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Sparkles className="w-6 h-6 text-slate-200" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                {quickStats.map((stat) => (
                  <div key={stat.label} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[11px] uppercase tracking-wide text-slate-200 font-semibold">{stat.label}</p>
                    <p className="text-xl font-bold text-slate-100">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <p className="text-xs text-slate-300 mb-2">Dostupni formati</p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold shadow-soft">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-200">PDF, Excel, CSV</p>
                  <p className="text-xs text-slate-300">Izvezi u različitim formatima</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BHDCA Report Generator */}
        <section className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl p-8 shadow-soft-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-900 opacity-20 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-slate-200" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">ICAO Standardni izvještaj</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">BHDCA Mjesečni izvještaj</h2>
                <p className="text-slate-200 max-w-2xl">
                  Generiši zvanični mjesečni izvještaj za BHDCA (Bosnia and Herzegovina Department of Civil Aviation)
                  prema ICAO standardima. Izvještaj uključuje saobraćaj aerodroma, city-pair podatke i statistiku letova.
                </p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <FileSpreadsheet className="w-8 h-8 text-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-bold text-dark-900 mb-4">Parametri izvještaja</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Godina</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dark-200 focus:border-slate-500 focus:ring-0 outline-none transition-colors bg-white text-dark-900"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Mjesec</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dark-200 focus:border-slate-500 focus:ring-0 outline-none transition-colors bg-white text-dark-900"
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
                    className="w-full py-4 px-6 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:shadow-soft-lg hover:from-slate-700 hover:to-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generišem izvještaj...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generiši BHDCA izvještaj
                      </>
                    )}
                  </button>
                </div>

                {/* Messages */}
                {generationMessage && (
                  <div className={`mt-4 p-4 rounded-xl ${
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
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-white mb-4">Sadržaj izvještaja</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Airport Traffic</p>
                      <p className="text-sm text-slate-200">Aircraft movements, passengers (embarked/disembarked), freight i mail po tipu operacije</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">O-D Traffic (Scheduled)</p>
                      <p className="text-sm text-slate-200">City-pair podaci za scheduled letove (putnici, freight, mail)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">O-D Traffic (Non-Scheduled)</p>
                      <p className="text-sm text-slate-200">City-pair podaci za non-scheduled letove (charter, MEDEVAC, itd.)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-xs text-slate-200 mb-2">Format izvoza:</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-semibold text-white">Excel (.xlsx)</span>
                    <span className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-medium text-white/60">PDF (uskoro)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BHANSA Report Generator */}
        <section className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl p-8 shadow-soft-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-900 opacity-20 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-slate-200" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Mjesečni izvještaj</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">BHANSA Izvještaj o prometu</h2>
                <p className="text-slate-200 max-w-2xl">
                  Detaljni mjesečni izvještaj o prometu na aerodromu Tuzla za BHANSA.
                  Lista svih letova sa detaljima o avionima, putnicima, infantima i rutama.
                </p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <FileSpreadsheet className="w-8 h-8 text-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-bold text-dark-900 mb-4">Parametri izvještaja</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Godina</label>
                    <select
                      value={bhansaYear}
                      onChange={(e) => setBhansaYear(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dark-200 focus:border-slate-500 focus:ring-0 outline-none transition-colors bg-white text-dark-900"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Mjesec</label>
                    <select
                      value={bhansaMonth}
                      onChange={(e) => setBhansaMonth(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dark-200 focus:border-slate-500 focus:ring-0 outline-none transition-colors bg-white text-dark-900"
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
                    className="w-full py-4 px-6 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:shadow-soft-lg hover:from-slate-700 hover:to-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isBhansaGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generišem izvještaj...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generiši BHANSA izvještaj
                      </>
                    )}
                  </button>
                </div>

                {/* Messages */}
                {bhansaMessage && (
                  <div className={`mt-4 p-4 rounded-xl ${
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
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-white mb-4">Sadržaj izvještaja</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Detalji letova</p>
                      <p className="text-sm text-slate-200">Datum, aviokompanija, tip aviona, registracija, MTOW, broj leta</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Rute i putnici</p>
                      <p className="text-sm text-slate-200">FROM-TO rute, broj putnika (uključujući infante), tip leta (R/H)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Adrese aviokompanija</p>
                      <p className="text-sm text-slate-200">Puni detalji kontakata aviokompanija</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-xs text-slate-200 mb-2">Format izvoza:</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-semibold text-white">Excel (.xlsx)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customs Report Generator */}
        <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-3xl p-8 shadow-soft-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-950 opacity-20 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Mjesečna statistika</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Statistika za Carinu</h2>
                <p className="text-emerald-200 max-w-2xl">
                  Mjesečni statistički izvještaj za carinu sa pregledom putnika i tereta.
                  Razdvajanje po redovnom i vanrednom prometu, uz ukupan pregled.
                </p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <FileSpreadsheet className="w-8 h-8 text-emerald-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-bold text-dark-900 mb-4">Parametri izvještaja</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Godina</label>
                    <select
                      value={customsYear}
                      onChange={(e) => setCustomsYear(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dark-200 focus:border-emerald-500 focus:ring-0 outline-none transition-colors bg-white text-dark-900"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Mjesec</label>
                    <select
                      value={customsMonth}
                      onChange={(e) => setCustomsMonth(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dark-200 focus:border-emerald-500 focus:ring-0 outline-none transition-colors bg-white text-dark-900"
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
                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:shadow-soft-lg hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isCustomsGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generišem izvještaj...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generiši Carina izvještaj
                      </>
                    )}
                  </button>
                </div>

                {/* Messages */}
                {customsMessage && (
                  <div className={`mt-4 p-4 rounded-xl ${
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

              {/* Info */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-white mb-4">Sadržaj izvještaja</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Redovni i vanredni promet</p>
                      <p className="text-sm text-emerald-200">Broj letova, ukrcani i iskrcani putnici po kategorijama</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Aviokompanije</p>
                      <p className="text-sm text-emerald-200">Detaljna razrada redovnog prometa po kompanijama</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Teret</p>
                      <p className="text-sm text-emerald-200">Utovareno, istovareno i ukupno (u tonama)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-xs text-emerald-200 mb-2">Format izvoza:</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-semibold text-white">Excel (.xlsx)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Director Report Generator */}
        <section className="bg-gradient-to-br from-amber-700 to-amber-900 rounded-3xl p-8 shadow-soft-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-950 opacity-20 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">Januar - odabrani mjesec</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Izvještaj za Direktora</h2>
                <p className="text-amber-200 max-w-2xl">
                  Identičan format kao Carina, sa mjesečnim tabelama od januara do odabranog mjeseca
                  i završnim summary ukupnih statistika.
                </p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <FileSpreadsheet className="w-8 h-8 text-amber-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-bold text-dark-900 mb-4">Parametri izvještaja</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Godina</label>
                    <select
                      value={directorYear}
                      onChange={(e) => setDirectorYear(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dark-200 focus:border-amber-500 focus:ring-0 outline-none transition-colors bg-white text-dark-900"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Do mjeseca</label>
                    <select
                      value={directorMonth}
                      onChange={(e) => setDirectorMonth(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dark-200 focus:border-amber-500 focus:ring-0 outline-none transition-colors bg-white text-dark-900"
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
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:shadow-soft-lg hover:from-amber-700 hover:to-amber-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isDirectorGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generišem izvještaj...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generiši izvještaj za direktora
                      </>
                    )}
                  </button>
                </div>

                {/* Messages */}
                {directorMessage && (
                  <div className={`mt-4 p-4 rounded-xl ${
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

              {/* Info */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-white mb-4">Sadržaj izvještaja</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Mjesečne tabele</p>
                      <p className="text-sm text-amber-200">Redovni, vanredni promet i ostala slijetanja po mjesecu</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Summary ukupno</p>
                      <p className="text-sm text-amber-200">Zbir svih mjeseci sa ukupnim brojkama</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Format</p>
                      <p className="text-sm text-amber-200">Identičan izgled kao Carina izvještaj</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-xs text-amber-200 mb-2">Format izvoza:</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-semibold text-white">Excel (.xlsx)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local Statistics Report Generator */}
        <section className="bg-gradient-to-br from-cyan-700 to-cyan-900 rounded-3xl p-8 shadow-soft-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-950 opacity-20 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Mjesečni izvještaj</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Lokalna statistika</h2>
                <p className="text-cyan-200 max-w-2xl">
                  Dinamični izvještaj lokalne statistike sa redovnim, vanrednim i ostalim slijetanjima,
                  te fakturisanje po aviokompanijama.
                </p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <FileSpreadsheet className="w-8 h-8 text-cyan-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-bold text-dark-900 mb-4">Parametri izvještaja</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Godina</label>
                    <select
                      value={localYear}
                      onChange={(e) => setLocalYear(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dark-200 focus:border-cyan-500 focus:ring-0 outline-none transition-colors bg-white text-dark-900"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Mjesec</label>
                    <select
                      value={localMonth}
                      onChange={(e) => setLocalMonth(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dark-200 focus:border-cyan-500 focus:ring-0 outline-none transition-colors bg-white text-dark-900"
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
                    className="w-full py-4 px-6 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:shadow-soft-lg hover:from-cyan-700 hover:to-cyan-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isLocalGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generišem izvještaj...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generiši Lokalnu statistiku
                      </>
                    )}
                  </button>
                </div>

                {/* Messages */}
                {localMessage && (
                  <div className={`mt-4 p-4 rounded-xl ${
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

              {/* Info */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-white mb-4">Sadržaj izvještaja</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Redovni promet</p>
                      <p className="text-sm text-cyan-200">Dinamične destinacije po aviokompanijama za odabrani mjesec</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Vanredni i domestic</p>
                      <p className="text-sm text-cyan-200">Pregled vanrednog i domestic prometa sa teretom</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Fakturisanje</p>
                      <p className="text-sm text-cyan-200">Automatski izračuni po Wizz, Pegasus, Ryanair i Ajet</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-xs text-cyan-200 mb-2">Format izvoza:</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-semibold text-white">Excel (.xlsx)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wizz Air Performance Report Generator */}
        <section className="bg-gradient-to-br from-purple-700 to-purple-900 rounded-3xl p-8 shadow-soft-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-950 opacity-20 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">Daily Performance</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Wizz Air Performance Table</h2>
                <p className="text-purple-200 max-w-2xl">
                  Dnevni performance izvještaj za Wizz Air. Jedan sheet po danu mjeseca sa detaljnim podacima o letovima,
                  kašnjenjima i UTC vremenima. Uključuje sve Wizz Air entitete (W6, W4).
                </p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <FileSpreadsheet className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-bold text-dark-900 mb-4">Parametri izvještaja</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Godina</label>
                    <select
                      value={wizzairYear}
                      onChange={(e) => setWizzairYear(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dark-200 focus:border-purple-500 focus:ring-0 outline-none transition-colors bg-white text-dark-900"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Mjesec</label>
                    <select
                      value={wizzairMonth}
                      onChange={(e) => setWizzairMonth(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dark-200 focus:border-purple-500 focus:ring-0 outline-none transition-colors bg-white text-dark-900"
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
                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:shadow-soft-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isWizzairGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generišem izvještaj...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generiši Wizz Air izvještaj
                      </>
                    )}
                  </button>
                </div>

                {/* Messages */}
                {wizzairMessage && (
                  <div className={`mt-4 p-4 rounded-xl ${
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

              {/* Info */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-white mb-4">Sadržaj izvještaja</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Dnevna organizacija</p>
                      <p className="text-sm text-purple-200">Jedan sheet po danu mjeseca, lakše praćenje</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">UTC vremena</p>
                      <p className="text-sm text-purple-200">STA, ATA, STD, DCT, ATD - svi u UTC timezone</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Delay tracking</p>
                      <p className="text-sm text-purple-200">Do 3 delay koda po letu sa minutama i razlozima</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/90">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Wizz Air flota</p>
                      <p className="text-sm text-purple-200">W6 (Wizz Hungary), W4 (Wizz Malta) - svi entiteti</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-xs text-purple-200 mb-2">Format izvoza:</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-semibold text-white">Excel (.xlsx)</span>
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
