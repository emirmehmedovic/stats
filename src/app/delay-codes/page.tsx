'use client';

import { useMemo, useState, useEffect } from 'react';
import { AlertCircle, Plus, Edit, Trash2, Search, Clock, Tag, Link2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error';
import { showToast } from '@/components/ui/toast';
import { DelayCodeModal } from '@/components/delay-codes/DelayCodeModal';
import { DelayCodeAirlinesModal } from '@/components/delay-codes/DelayCodeAirlinesModal';
import { MainLayout } from '@/components/layout/MainLayout';

type DelayCode = {
  id: string;
  code: string;
  description: string;
  category: string;
  _count: {
    delays: number;
  };
};

type Airline = {
  id: string;
  name: string;
  icaoCode: string;
};

type AirlineDelayCode = {
  airline: Airline;
  delayCode: DelayCode;
};

export default function DelayCodesPage() {
  const [delayCodes, setDelayCodes] = useState<DelayCode[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airlineLinks, setAirlineLinks] = useState<Record<string, Airline[]>>({});
  const [isLinksLoading, setIsLinksLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAirlineId, setSelectedAirlineId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelayCode, setEditingDelayCode] = useState<DelayCode | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkingDelayCode, setLinkingDelayCode] = useState<DelayCode | null>(null);

  useEffect(() => {
    fetchDelayCodes();
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchAirlines();
    fetchAirlineLinks();
  }, []);

  const fetchDelayCodes = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/delay-codes?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setDelayCodes(result.data);
      } else {
        setError(result.error || 'Greška pri učitavanju delay kodova');
      }
    } catch (err) {
      setError('Greška pri učitavanju delay kodova');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAirlines = async () => {
    try {
      const allAirlines: Airline[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: String(page),
          limit: '100',
        });
        const response = await fetch(`/api/airlines?${params.toString()}`);
        if (!response.ok) break;

        const result = await response.json();
        allAirlines.push(...(result.data || []));
        hasMore = !!result.pagination?.hasMore;
        page += 1;
      }

      allAirlines.sort((a, b) => a.name.localeCompare(b.name));
      setAirlines(allAirlines);
    } catch (err) {
      console.error('Error fetching airlines:', err);
    }
  };

  const fetchAirlineLinks = async () => {
    try {
      setIsLinksLoading(true);
      const response = await fetch('/api/airline-delay-codes');
      const result = await response.json();
      if (!result.success) return;

      const links = result.data as AirlineDelayCode[];
      const mapping: Record<string, Airline[]> = {};
      links.forEach((link) => {
        const codeId = link.delayCode.id;
        if (!mapping[codeId]) mapping[codeId] = [];
        mapping[codeId].push(link.airline);
      });
      Object.values(mapping).forEach((list) =>
        list.sort((a, b) => a.name.localeCompare(b.name))
      );
      setAirlineLinks(mapping);
    } catch (err) {
      console.error('Error fetching airline delay links:', err);
    } finally {
      setIsLinksLoading(false);
    }
  };

  const handleDelete = async (delayCode: DelayCode) => {
    if (!confirm(`Da li ste sigurni da želite obrisati delay kod "${delayCode.code}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/delay-codes/${delayCode.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Delay kod je uspješno obrisan!', 'success');
        fetchDelayCodes();
      } else {
        showToast(result.error || 'Greška pri brisanju', 'error');
      }
    } catch (err) {
      showToast('Greška pri brisanju delay koda', 'error');
      console.error(err);
    }
  };

  const handleEdit = (delayCode: DelayCode) => {
    setEditingDelayCode(delayCode);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingDelayCode(null);
    setIsModalOpen(true);
  };

  const handleLinkAirlines = (delayCode: DelayCode) => {
    setLinkingDelayCode(delayCode);
    setIsLinkModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDelayCode(null);
  };

  const handleLinkModalClose = () => {
    setIsLinkModalOpen(false);
    setLinkingDelayCode(null);
  };

  const handleModalSuccess = () => {
    fetchDelayCodes();
    handleModalClose();
  };

  const handleLinkModalSuccess = () => {
    fetchDelayCodes();
    fetchAirlineLinks();
    handleLinkModalClose();
  };

  // Get unique categories
  const categories = Array.from(new Set(delayCodes.map(dc => dc.category))).sort();
  const filteredDelayCodes = useMemo(() => {
    if (!selectedAirlineId) return delayCodes;
    if (isLinksLoading) return [];
    return delayCodes.filter((code) =>
      (airlineLinks[code.id] || []).some((airline) => airline.id === selectedAirlineId)
    );
  }, [delayCodes, airlineLinks, selectedAirlineId, isLinksLoading]);

  if (isLoading) {
    return (
      <MainLayout>
      <div className="p-8">
        <LoadingSpinner text="Učitavam delay kodove..." />
      </div>
      </MainLayout>
  );
  }

  if (error && delayCodes.length === 0) {
    return (
      <MainLayout>
      <div className="p-8">
        <ErrorDisplay error={error} onRetry={fetchDelayCodes} />
      </div>
      </MainLayout>
  );
  }

  return (
    <MainLayout>
    <div className="p-8 space-y-8">
      {/* Header Card - Dashboard stil */}
      <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-soft-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Delay kodovi</h1>
            <p className="text-dark-300 mt-2">Upravljanje delay kodovima i njihovim opisima</p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-white text-dark-900 hover:bg-dark-50 font-semibold shadow-soft-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj delay kod
          </Button>
        </div>
      </div>

      {/* Filters - Dashboard stil */}
      <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70"></div>
        <div className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <Input
                type="text"
                placeholder="Pretraži delay kodove (kod, opis, kategorija)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-5 py-4 bg-white border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-shadow text-dark-900 placeholder:text-dark-400 shadow-soft text-base"
              />
            </div>
            <div className="relative">
              <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none z-10" />
              <select
                value={selectedAirlineId}
                onChange={(e) => setSelectedAirlineId(e.target.value)}
                className="w-full pl-14 pr-5 py-4 bg-white border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-shadow text-dark-900 shadow-soft text-base appearance-none cursor-pointer"
              >
                <option value="">Sve aviokompanije</option>
                {airlines.map((airline) => (
                  <option key={airline.id} value={airline.id}>
                    {airline.name} ({airline.icaoCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none z-10" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-14 pr-5 py-4 bg-white border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-shadow text-dark-900 shadow-soft text-base appearance-none cursor-pointer"
              >
                <option value="">Sve kategorije</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Delay Codes List - Dashboard stil */}
      <div className="bg-white rounded-3xl shadow-soft relative overflow-hidden border-[6px] border-white">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/40 via-white/70 to-primary-100/40 opacity-60"></div>
        <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-40"></div>

        <div className="relative z-10 p-8 border-b border-dark-100">
        <h2 className="text-xl font-bold text-dark-900">
          Svi delay kodovi ({filteredDelayCodes.length})
        </h2>
      </div>

        {isLinksLoading ? (
          <div className="relative z-10 p-12 text-center">
            <p className="text-dark-600 text-lg">Učitavam veze sa aviokompanijama...</p>
          </div>
        ) : filteredDelayCodes.length === 0 ? (
          <div className="relative z-10 p-12 text-center">
            <div className="p-6 bg-orange-50 rounded-3xl inline-block mb-4">
              <AlertCircle className="w-12 h-12 text-orange-600" />
            </div>
            <p className="text-dark-600 text-lg mb-4">Nema delay kodova</p>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-br from-dark-900 to-dark-800 text-white hover:from-dark-800 hover:to-dark-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj prvi delay kod
            </Button>
          </div>
        ) : (
          <div className="relative z-10 p-6 space-y-4">
            {filteredDelayCodes.map((delayCode) => (
              <div
                key={delayCode.id}
                className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer border-[6px] border-white relative overflow-hidden"
              >
                {/* Dekorativni gradijenti - Dashboard stil */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-orange-200 rounded-full blur-xl opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100 rounded-full blur-xl -mb-12 -ml-12 opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>

                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3.5 bg-orange-50 rounded-2xl shadow-soft group-hover:scale-110 transition-transform">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-xl font-bold text-dark-900 font-mono bg-dark-50 px-3 py-1.5 rounded-xl border border-dark-200">
                            {delayCode.code}
                          </h3>
                          <span className="px-3 py-1 bg-blue-50 rounded-full text-xs font-semibold text-blue-700 border border-blue-200">
                            {delayCode.category}
                          </span>
                        </div>
                        <p className="text-dark-600 text-sm mt-2">{delayCode.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 px-4 py-2.5 bg-primary-50 rounded-2xl border border-primary-200 w-fit">
                      <Clock className="w-5 h-5 text-primary-600" />
                      <span className="text-sm font-semibold text-primary-900">{delayCode._count.delays} kašnjenje/a</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(airlineLinks[delayCode.id] || []).length === 0 ? (
                        <span className="text-xs text-slate-500">
                          Nema povezanih aviokompanija
                        </span>
                      ) : (
                        (airlineLinks[delayCode.id] || []).map((airline) => (
                          <span
                            key={airline.id}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700"
                          >
                            {airline.name} ({airline.icaoCode})
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleEdit(delayCode)}
                      className="bg-white border-2 border-dark-200 text-dark-900 hover:bg-dark-50 hover:border-dark-300 shadow-soft"
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Uredi
                    </Button>
                    <Button
                      onClick={() => handleLinkAirlines(delayCode)}
                      className="bg-white border-2 border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300 shadow-soft"
                      size="sm"
                    >
                      <Link2 className="w-4 h-4 mr-1" />
                      Poveži
                    </Button>
                    <Button
                      onClick={() => handleDelete(delayCode)}
                      className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
                      size="sm"
                      disabled={delayCode._count.delays > 0}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Obriši
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <DelayCodeModal
        delayCode={editingDelayCode}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
      <DelayCodeAirlinesModal
        delayCode={linkingDelayCode}
        isOpen={isLinkModalOpen}
        onClose={handleLinkModalClose}
        onSuccess={handleLinkModalSuccess}
      />
    </div>
    </MainLayout>
  );
}
