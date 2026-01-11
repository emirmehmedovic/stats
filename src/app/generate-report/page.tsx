'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  FileText,
  Calendar,
  TrendingUp,
  Download,
  Building2,
  Users,
  Info,
  Search,
  Clock,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Filter,
  FileSpreadsheet,
  Loader2,
  Plane,
  MapPin
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
  const [wizzairDay, setWizzairDay] = useState(new Date().getDate());
  const [isWizzairDayGenerating, setIsWizzairDayGenerating] = useState(false);
  const [wizzairDayMessage, setWizzairDayMessage] = useState('');
  const [wizzairDayFileName, setWizzairDayFileName] = useState('');

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

  const wizzairDaysInMonth = new Date(wizzairYear, wizzairMonth, 0).getDate();
  const wizzairToday = new Date();
  const isCurrentWizzairMonth =
    wizzairYear === wizzairToday.getFullYear() && wizzairMonth === wizzairToday.getMonth() + 1;
  const wizzairMaxSelectableDay = isCurrentWizzairMonth
    ? Math.min(wizzairDaysInMonth, wizzairToday.getDate())
    : wizzairDaysInMonth;
  const wizzairSelectedDate = new Date(wizzairYear, wizzairMonth - 1, wizzairDay);
  wizzairSelectedDate.setHours(0, 0, 0, 0);
  const wizzairTodayDate = new Date();
  wizzairTodayDate.setHours(0, 0, 0, 0);
  const isWizzairFutureDay = wizzairSelectedDate > wizzairTodayDate;

  useEffect(() => {
    if (wizzairDay > wizzairMaxSelectableDay) {
      setWizzairDay(wizzairMaxSelectableDay || 1);
    }
  }, [wizzairDay, wizzairMaxSelectableDay]);

  // State za Custom izvještaj
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [customOperationTypes, setCustomOperationTypes] = useState<string[]>([]);
  const [customAirlines, setCustomAirlines] = useState<string[]>([]);
  const [customRoutes, setCustomRoutes] = useState<string[]>([]);
  const [customPassengerType, setCustomPassengerType] = useState<'all' | 'departure' | 'arrival' | 'infants'>('all');
  const [isCustomGenerating, setIsCustomGenerating] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [customFileName, setCustomFileName] = useState('');
  const [useMultiSheet, setUseMultiSheet] = useState(false);
  
  // Data za filtere
  const [availableOperationTypes, setAvailableOperationTypes] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [availableAirlines, setAvailableAirlines] = useState<Array<{ id: string; name: string; icaoCode: string }>>([]);
  const [availableRoutes, setAvailableRoutes] = useState<Array<{ route: string; display: string }>>([]);
  const [operationTypesSearchQuery, setOperationTypesSearchQuery] = useState('');
  const [airlinesSearchQuery, setAirlinesSearchQuery] = useState('');

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

  const handleGenerateWizzairDay = async () => {
    setIsWizzairDayGenerating(true);
    setWizzairDayMessage('');
    setWizzairDayFileName('');

    try {
      const response = await fetch('/api/reports/wizzair/generate-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: wizzairYear,
          month: wizzairMonth,
          day: wizzairDay,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri generisanju izvještaja');
      }

      setWizzairDayMessage('Izvještaj za dan uspješno generisan!');
      setWizzairDayFileName(data.fileName);
    } catch (error: any) {
      setWizzairDayMessage(`Greška: ${error.message}`);
    } finally {
      setIsWizzairDayGenerating(false);
    }
  };

  const handleWizzairDayDownload = () => {
    if (wizzairDayFileName) {
      window.open(`/api/reports/wizzair/download?fileName=${wizzairDayFileName}`, '_blank');
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

  // Učitavanje podataka za filtere
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        // Fetch operation types
        const opTypesRes = await fetch('/api/operation-types');
        if (opTypesRes.ok) {
          const opTypesData = await opTypesRes.json();
          setAvailableOperationTypes(opTypesData.data || []);
        }

        // Fetch airlines - need to fetch all pages
        let allAirlines: any[] = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore && page <= 10) { // Max 10 pages as safety
          const airlinesRes = await fetch(`/api/airlines?page=${page}&limit=100`);
          if (airlinesRes.ok) {
            const airlinesData = await airlinesRes.json();
            if (airlinesData.data && airlinesData.data.length > 0) {
              allAirlines = [...allAirlines, ...airlinesData.data];
              hasMore = airlinesData.data.length === 100;
              page++;
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }
        
        setAvailableAirlines(allAirlines);

        // Fetch routes from airline routes
        const routesRes = await fetch('/api/airline-routes');
        if (routesRes.ok) {
          const routesData = await routesRes.json();
          const routes = routesData.data.map((r: any) => ({
            route: r.route,
            display: `${r.route} (${r.destination}, ${r.country})`
          }));
          
          // Deduplicate routes by route code
          const uniqueRoutes = Array.from(
            new Map(routes.map((r: { route: string; display: string }) => [r.route, r])).values()
          ) as Array<{ route: string; display: string }>;
          
          setAvailableRoutes(uniqueRoutes);
        }
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };

    fetchFilterData();
  }, []);

  // Auto-enable multi-sheet for long periods
  useEffect(() => {
    if (customDateFrom && customDateTo) {
      const from = new Date(customDateFrom);
      const to = new Date(customDateTo);
      const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      
      // Auto-enable multi-sheet for periods longer than 30 days
      if (daysDiff > 30 && !useMultiSheet) {
        setUseMultiSheet(true);
      }
    }
  }, [customDateFrom, customDateTo]);

  // Funkcija za generisanje custom izvještaja
  const handleGenerateCustom = async () => {
    setIsCustomGenerating(true);
    setCustomMessage('');
    setCustomFileName('');

    try {
      // Determine which endpoint to use
      const endpoint = useMultiSheet 
        ? '/api/reports/custom-multi-sheet/generate'
        : '/api/reports/custom-advanced/generate';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateFrom: customDateFrom,
          dateTo: customDateTo,
          operationTypes: customOperationTypes,
          airlines: customAirlines,
          routes: customRoutes,
          passengerType: customPassengerType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri generisanju izvještaja');
      }

      // Support both fileName (old API) and filename (new API)
      const fileName = data.fileName || data.filename;
      console.log('API Response:', data);
      console.log('Extracted fileName:', fileName);
      
      setCustomMessage(data.message || 'Izvještaj uspješno generisan!');
      setCustomFileName(fileName);
    } catch (error: any) {
      setCustomMessage(`Greška: ${error.message}`);
    } finally {
      setIsCustomGenerating(false);
    }
  };

  // Funkcija za preuzimanje custom izvještaja
  const handleCustomDownload = () => {
    if (customFileName) {
      window.open(`/api/reports/custom-advanced/download?fileName=${customFileName}`, '_blank');
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
                  <p className="text-2xl font-bold text-slate-900">7</p>
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

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Dan</label>
                      <select
                        value={wizzairDay}
                        onChange={(e) => setWizzairDay(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all bg-white text-slate-900"
                      >
                        {Array.from({ length: wizzairMaxSelectableDay }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day}>{day}</option>
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
                          Generiši mjesečni izvještaj
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleGenerateWizzairDay}
                      disabled={isWizzairDayGenerating || isWizzairFutureDay}
                      className="w-full py-3 px-4 bg-violet-100 text-violet-800 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-violet-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isWizzairDayGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generišem...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-4 h-4" />
                          Generiši izvještaj za dan
                        </>
                      )}
                    </button>
                    {isWizzairFutureDay && (
                      <p className="text-xs text-amber-600">
                        Izvještaj za budući datum nije dozvoljen.
                      </p>
                    )}
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
                  {wizzairDayMessage && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      wizzairDayMessage.includes('Greška')
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        wizzairDayMessage.includes('Greška')
                          ? 'text-red-700'
                          : 'text-green-700'
                      }`}>
                        {wizzairDayMessage}
                      </p>
                      {wizzairDayFileName && (
                        <button
                          onClick={handleWizzairDayDownload}
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

        {/* Custom Advanced Report Generator */}
        <section>
          <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl shadow-xl border border-amber-200/50 overflow-hidden">
            <div className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 px-8 py-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                      <Filter className="w-5 h-5 text-white" />
                    </div>
                    <div className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Napredno filtriranje</span>
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Custom izvještaj</h2>
                  <p className="text-amber-50 text-base max-w-2xl leading-relaxed">
                    Kreirajte prilagođeni izvještaj sa naprednim filterima po tipu saobraćaja, aviokompanijama, rutama, periodu i tipu putnika.
                  </p>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
                  <FileSpreadsheet className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Filters */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Filter className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Filteri</h3>
                  </div>

                  {/* Date Range Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-amber-600" />
                      <label className="text-base font-semibold text-slate-900">Period</label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">Od datuma</label>
                        <input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => setCustomDateFrom(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all bg-slate-50 text-slate-900 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">Do datuma</label>
                        <input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => setCustomDateTo(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all bg-slate-50 text-slate-900 font-medium"
                        />
                      </div>
                    </div>
                    
                    {/* Multi-Sheet Toggle */}
                    {customDateFrom && customDateTo && (() => {
                      const from = new Date(customDateFrom);
                      const to = new Date(customDateTo);
                      const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
                      const isLongPeriod = daysDiff > 30;
                      
                      return (
                        <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="multiSheetToggle"
                              checked={useMultiSheet}
                              onChange={(e) => setUseMultiSheet(e.target.checked)}
                              className="mt-1 w-5 h-5 rounded border-2 border-blue-400 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                            />
                            <div className="flex-1">
                              <label htmlFor="multiSheetToggle" className="flex items-center gap-2 cursor-pointer">
                                <span className="text-sm font-bold text-blue-900">Multi-sheet izvještaj</span>
                                {isLongPeriod && (
                                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                                    Preporučeno
                                  </span>
                                )}
                              </label>
                              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                {isLongPeriod ? (
                                  <>Period duži od mjesec dana ({daysDiff} dana) - preporučujemo multi-sheet format sa detaljnim summary-em i mjesečnim breakdown-om</>
                                ) : (
                                  <>Generiši izvještaj sa više sheet-ova: Summary + mjesečni breakdown sa dnevnim pregledom</>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Operation Types Multi-Select Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <Plane className="w-5 h-5 text-amber-600" />
                      <label className="text-base font-semibold text-slate-900">Tip saobraćaja</label>
                      <span className="ml-auto px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{customOperationTypes.length}</span>
                    </div>
                      
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Pretraži tipove..."
                        value={operationTypesSearchQuery}
                        onChange={(e) => setOperationTypesSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all bg-slate-50 text-slate-900 text-sm"
                      />
                    </div>
                      
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = availableOperationTypes.filter(opType => 
                            opType.name.toLowerCase().includes(operationTypesSearchQuery.toLowerCase()) ||
                            opType.code.toLowerCase().includes(operationTypesSearchQuery.toLowerCase())
                          );
                          const filteredIds = filtered.map(o => o.id);
                          setCustomOperationTypes([...new Set([...customOperationTypes, ...filteredIds])]);
                        }}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-xs font-bold hover:from-amber-600 hover:to-amber-700 transition-all shadow-sm hover:shadow-md"
                      >
                        Odaberi sve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = availableOperationTypes.filter(opType => 
                            opType.name.toLowerCase().includes(operationTypesSearchQuery.toLowerCase()) ||
                            opType.code.toLowerCase().includes(operationTypesSearchQuery.toLowerCase())
                          );
                          const filteredIds = filtered.map(o => o.id);
                          setCustomOperationTypes(customOperationTypes.filter(id => !filteredIds.includes(id)));
                        }}
                        className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                      >
                        Poništi sve
                      </button>
                    </div>
                      
                    <div className="border-2 border-slate-200 rounded-xl p-2 bg-slate-50 max-h-48 overflow-y-auto custom-scrollbar">
                      {availableOperationTypes
                        .filter(opType => 
                          opType.name.toLowerCase().includes(operationTypesSearchQuery.toLowerCase()) ||
                          opType.code.toLowerCase().includes(operationTypesSearchQuery.toLowerCase())
                        )
                        .map((opType) => (
                          <label key={opType.id} className="flex items-center gap-3 py-2.5 px-3 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                            <input
                              type="checkbox"
                              checked={customOperationTypes.includes(opType.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCustomOperationTypes([...customOperationTypes, opType.id]);
                                } else {
                                  setCustomOperationTypes(customOperationTypes.filter(id => id !== opType.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-2 border-slate-300 text-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0"
                            />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{opType.name}</span>
                            <span className="ml-auto text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{opType.code}</span>
                          </label>
                        ))}
                      {availableOperationTypes.filter(opType => 
                        opType.name.toLowerCase().includes(operationTypesSearchQuery.toLowerCase()) ||
                        opType.code.toLowerCase().includes(operationTypesSearchQuery.toLowerCase())
                      ).length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-8">Nema rezultata</p>
                      )}
                    </div>
                  </div>

                  {/* Airlines Multi-Select Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5 text-amber-600" />
                      <label className="text-base font-semibold text-slate-900">Aviokompanije</label>
                      <span className="ml-auto px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{customAirlines.length}</span>
                    </div>
                    
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Pretraži aviokompanije..."
                        value={airlinesSearchQuery}
                        onChange={(e) => setAirlinesSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all bg-slate-50 text-slate-900 text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = availableAirlines.filter(airline => 
                            airline.name.toLowerCase().includes(airlinesSearchQuery.toLowerCase()) ||
                            airline.icaoCode.toLowerCase().includes(airlinesSearchQuery.toLowerCase())
                          );
                          const filteredIds = filtered.map(a => a.id);
                          setCustomAirlines([...new Set([...customAirlines, ...filteredIds])]);
                        }}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-xs font-bold hover:from-amber-600 hover:to-amber-700 transition-all shadow-sm hover:shadow-md"
                      >
                        Odaberi sve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = availableAirlines.filter(airline => 
                            airline.name.toLowerCase().includes(airlinesSearchQuery.toLowerCase()) ||
                            airline.icaoCode.toLowerCase().includes(airlinesSearchQuery.toLowerCase())
                          );
                          const filteredIds = filtered.map(a => a.id);
                          setCustomAirlines(customAirlines.filter(id => !filteredIds.includes(id)));
                        }}
                        className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                      >
                        Poništi sve
                      </button>
                    </div>
                    
                    <div className="border-2 border-slate-200 rounded-xl p-2 bg-slate-50 max-h-48 overflow-y-auto custom-scrollbar">
                      {availableAirlines
                        .filter(airline => 
                          airline.name.toLowerCase().includes(airlinesSearchQuery.toLowerCase()) ||
                          airline.icaoCode.toLowerCase().includes(airlinesSearchQuery.toLowerCase())
                        )
                        .map((airline) => (
                          <label key={airline.id} className="flex items-center gap-3 py-2.5 px-3 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                            <input
                              type="checkbox"
                              checked={customAirlines.includes(airline.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCustomAirlines([...customAirlines, airline.id]);
                                } else {
                                  setCustomAirlines(customAirlines.filter(id => id !== airline.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-2 border-slate-300 text-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0"
                            />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{airline.name}</span>
                            <span className="ml-auto text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{airline.icaoCode}</span>
                          </label>
                        ))}
                      {availableAirlines.filter(airline => 
                        airline.name.toLowerCase().includes(airlinesSearchQuery.toLowerCase()) ||
                        airline.icaoCode.toLowerCase().includes(airlinesSearchQuery.toLowerCase())
                      ).length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-8">Nema rezultata</p>
                      )}
                    </div>
                  </div>

                  {/* Routes Multi-Select Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-amber-600" />
                      <label className="text-base font-semibold text-slate-900">Rute</label>
                      <span className="ml-auto px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{customRoutes.length}</span>
                    </div>
                    <div className="border-2 border-slate-200 rounded-xl p-2 bg-slate-50 max-h-48 overflow-y-auto custom-scrollbar">
                      {availableRoutes.map((routeObj) => (
                        <label key={routeObj.route} className="flex items-center gap-3 py-2.5 px-3 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                          <input
                            type="checkbox"
                            checked={customRoutes.includes(routeObj.route)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCustomRoutes([...customRoutes, routeObj.route]);
                              } else {
                                setCustomRoutes(customRoutes.filter(r => r !== routeObj.route));
                              }
                            }}
                            className="w-4 h-4 rounded border-2 border-slate-300 text-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0"
                          />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{routeObj.display}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Passenger Type Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-amber-600" />
                      <label className="text-base font-semibold text-slate-900">Tip putnika</label>
                    </div>
                    <select
                      value={customPassengerType}
                      onChange={(e) => setCustomPassengerType(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition-all bg-slate-50 text-slate-900 font-medium"
                    >
                      <option value="all">Svi putnici (ukrcani + iskrcani)</option>
                      <option value="departure">Samo odlazni (ukrcani)</option>
                      <option value="arrival">Samo dolazni (iskrcani)</option>
                      <option value="infants">Samo bebe u naručju</option>
                    </select>
                  </div>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Info className="w-5 h-5 text-amber-600" />
                      <h3 className="text-base font-bold text-slate-900">Mogućnosti</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm mb-0.5">Multi-select</p>
                          <p className="text-xs text-slate-600 leading-relaxed">Odaberite više tipova saobraćaja, aviokompanija i ruta</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm mb-0.5">Fleksibilan period</p>
                          <p className="text-xs text-slate-600 leading-relaxed">Bilo koji vremenski period od-do</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm mb-0.5">Excel export</p>
                          <p className="text-xs text-slate-600 leading-relaxed">Strukturirana Excel tabela</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateCustom}
                    disabled={isCustomGenerating || !customDateFrom || !customDateTo}
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                  >
                    {isCustomGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generišem izvještaj...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-5 h-5" />
                        Generiši izvještaj
                      </>
                    )}
                  </button>

                  {customMessage && (
                    <div className={`p-5 rounded-2xl border-2 ${
                      customMessage.includes('Greška')
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <p className={`text-sm font-semibold ${
                        customMessage.includes('Greška')
                          ? 'text-red-700'
                          : 'text-green-700'
                      }`}>
                        {customMessage}
                      </p>
                      {customFileName && (
                        <button
                          onClick={handleCustomDownload}
                          className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                        >
                          <Download className="w-5 h-5" />
                          Preuzmi izvještaj
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
