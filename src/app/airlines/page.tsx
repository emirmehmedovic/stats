'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Search, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error';
import { showToast } from '@/components/ui/toast';
import { AirlineModal } from '@/components/airlines/AirlineModal';
import { MainLayout } from '@/components/layout/MainLayout';

type Airline = {
  id: string;
  name: string;
  icaoCode: string;
  iataCode: string | null;
  country: string | null;
  address: string | null;
  logoUrl: string | null;
  _count: {
    flights: number;
  };
};

export default function AirlinesPage() {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAirline, setEditingAirline] = useState<Airline | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 600);

    return () => clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    fetchAirlines();
  }, [debouncedSearchTerm]);

  const fetchAirlines = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      const response = await fetch(`/api/airlines?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setAirlines(result.data);
      } else {
        setError(result.error || 'Greška pri učitavanju aviokompanija');
      }
    } catch (err) {
      setError('Greška pri učitavanju aviokompanija');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (airline: Airline) => {
    if (!confirm(`Da li ste sigurni da želite obrisati "${airline.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/airlines/${airline.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Aviokompanija je uspješno obrisana!', 'success');
        fetchAirlines();
      } else {
        showToast(result.error || 'Greška pri brisanju', 'error');
      }
    } catch (err) {
      showToast('Greška pri brisanju aviokompanije', 'error');
      console.error(err);
    }
  };

  const handleEdit = (airline: Airline) => {
    setEditingAirline(airline);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingAirline(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAirline(null);
  };

  const handleModalSuccess = () => {
    fetchAirlines();
    handleModalClose();
  };

  if (isLoading) {
    return (
      <MainLayout>
      <div className="p-8">
        <LoadingSpinner text="Učitavam aviokompanije..." />
      </div>
      </MainLayout>
  );
  }

  if (error && airlines.length === 0) {
    return (
      <MainLayout>
      <div className="p-8">
        <ErrorDisplay error={error} onRetry={fetchAirlines} />
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
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aviokompanije</h1>
            <p className="text-dark-300 mt-2">Upravljanje aviokompanijama i njihovim kodovima</p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-white text-dark-900 hover:bg-dark-50 font-semibold shadow-soft-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj aviokompaniju
          </Button>
        </div>
      </div>

      {/* Search - Dashboard stil */}
      <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70"></div>
        <div className="relative z-10">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <Input
              type="text"
              placeholder="Pretraži aviokompanije (naziv, ICAO, IATA)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 pr-5 py-4 bg-white border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-shadow text-dark-900 placeholder:text-dark-400 shadow-soft text-base"
            />
          </div>
        </div>
      </div>

      {/* Airlines List - Dashboard stil */}
      <div className="bg-white rounded-3xl shadow-soft relative overflow-hidden border-[6px] border-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-blue-100/40 opacity-60"></div>
        <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-40"></div>

        <div className="relative z-10 p-8 border-b border-dark-100">
          <h2 className="text-xl font-bold text-dark-900">
            Sve aviokompanije ({airlines.length})
          </h2>
        </div>

        {airlines.length === 0 ? (
          <div className="relative z-10 p-12 text-center">
            <div className="p-6 bg-primary-50 rounded-3xl inline-block mb-4">
              <Building2 className="w-12 h-12 text-primary-600" />
            </div>
            <p className="text-dark-600 text-lg mb-4">Nema aviokompanija</p>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-br from-dark-900 to-dark-800 text-white hover:from-dark-800 hover:to-dark-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj prvu aviokompaniju
            </Button>
          </div>
        ) : (
          <div className="relative z-10 p-6 space-y-4">
            {airlines.map((airline) => (
              <div
                key={airline.id}
                className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer border-[6px] border-white relative overflow-hidden"
              >
                {/* Dekorativni gradijenti - Dashboard stil */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-200 rounded-full blur-xl opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100 rounded-full blur-xl -mb-12 -ml-12 opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>

                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {airline.logoUrl ? (
                        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center border border-dark-200 rounded-2xl bg-white p-2 shadow-soft">
                          <img
                            src={airline.logoUrl}
                            alt={`${airline.name} logo`}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              // Fallback na ikonicu ako se slika ne može učitati
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="p-3.5 bg-blue-50 rounded-2xl shadow-soft group-hover:scale-110 transition-transform">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-dark-900">{airline.name}</h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="px-3 py-1 bg-blue-50 rounded-full text-xs font-semibold text-blue-700 border border-blue-200">
                            ICAO: {airline.icaoCode}
                          </span>
                          {airline.iataCode && (
                            <span className="px-3 py-1 bg-indigo-50 rounded-full text-xs font-semibold text-indigo-700 border border-indigo-200">
                              IATA: {airline.iataCode}
                            </span>
                          )}
                          {airline.country && (
                            <span className="px-3 py-1 bg-dark-50 rounded-full text-xs font-semibold text-dark-600 border border-dark-200">
                              {airline.country}
                            </span>
                          )}
                        </div>
                        {airline.address && (
                          <p className="text-sm text-dark-600 mt-2">{airline.address}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 px-4 py-2.5 bg-primary-50 rounded-2xl border border-primary-200 w-fit">
                      <Plane className="w-5 h-5 text-primary-600" />
                      <span className="text-sm font-semibold text-primary-900">{airline._count.flights} let(ova)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleEdit(airline)}
                      className="bg-white border-2 border-dark-200 text-dark-900 hover:bg-dark-50 hover:border-dark-300 shadow-soft"
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Uredi
                    </Button>
                    <Button
                      onClick={() => handleDelete(airline)}
                      className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
                      size="sm"
                      disabled={airline._count.flights > 0}
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
      <AirlineModal
        airline={editingAirline}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
    </MainLayout>
  );
}
