'use client';

import { useState, useEffect } from 'react';
import { Plane, Plus, Edit, Trash2, Search, Users, Weight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error';
import { showToast } from '@/components/ui/toast';
import { AircraftTypeModal } from '@/components/aircraft-types/AircraftTypeModal';
import { MainLayout } from '@/components/layout/MainLayout';

type AircraftType = {
  id: string;
  model: string;
  seats: number;
  mtow: number;
  _count: {
    flights: number;
  };
};

export default function AircraftTypesPage() {
  const [aircraftTypes, setAircraftTypes] = useState<AircraftType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAircraftType, setEditingAircraftType] = useState<AircraftType | null>(null);

  useEffect(() => {
    fetchAircraftTypes();
  }, [searchTerm]);

  const fetchAircraftTypes = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/aircraft-types?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setAircraftTypes(result.data);
      } else {
        setError(result.error || 'Greška pri učitavanju tipova aviona');
      }
    } catch (err) {
      setError('Greška pri učitavanju tipova aviona');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (aircraftType: AircraftType) => {
    if (!confirm(`Da li ste sigurni da želite obrisati "${aircraftType.model}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/aircraft-types/${aircraftType.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Tip aviona je uspješno obrisan!', 'success');
        fetchAircraftTypes();
      } else {
        showToast(result.error || 'Greška pri brisanju', 'error');
      }
    } catch (err) {
      showToast('Greška pri brisanju tipa aviona', 'error');
      console.error(err);
    }
  };

  const handleEdit = (aircraftType: AircraftType) => {
    setEditingAircraftType(aircraftType);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingAircraftType(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAircraftType(null);
  };

  const handleModalSuccess = () => {
    fetchAircraftTypes();
    handleModalClose();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <LoadingSpinner text="Učitavam tipove aviona..." />
        </div>
      </MainLayout>
    );
  }

  if (error && aircraftTypes.length === 0) {
    return (
      <MainLayout>
        <div className="p-8">
          <ErrorDisplay error={error} onRetry={fetchAircraftTypes} />
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
              <h1 className="text-3xl font-bold tracking-tight">Tipovi aviona</h1>
              <p className="text-dark-300 mt-2">Upravljanje tipovima aviona, MTOW i brojem sjedišta</p>
            </div>
            <Button
              onClick={handleAdd}
              className="bg-white text-dark-900 hover:bg-dark-50 font-semibold shadow-soft-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj tip aviona
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
                placeholder="Pretraži tipove aviona (model)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-5 py-4 bg-white border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-shadow text-dark-900 placeholder:text-dark-400 shadow-soft text-base"
              />
            </div>
          </div>
        </div>

        {/* Aircraft Types List - Dashboard stil */}
        <div className="bg-white rounded-3xl shadow-soft relative overflow-hidden border-[6px] border-white">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-blue-100/40 opacity-60"></div>
          <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-40"></div>

          <div className="relative z-10 p-8 border-b border-dark-100">
            <h2 className="text-xl font-bold text-dark-900">
              Svi tipovi aviona ({aircraftTypes.length})
            </h2>
          </div>

          {aircraftTypes.length === 0 ? (
            <div className="relative z-10 p-12 text-center">
              <div className="p-6 bg-blue-50 rounded-3xl inline-block mb-4">
                <Plane className="w-12 h-12 text-blue-600" />
              </div>
              <p className="text-dark-600 text-lg mb-4">Nema tipova aviona</p>
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-br from-dark-900 to-dark-800 text-white hover:from-dark-800 hover:to-dark-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Dodaj prvi tip aviona
              </Button>
            </div>
          ) : (
            <div className="relative z-10 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aircraftTypes.map((aircraftType) => (
                <div
                  key={aircraftType.id}
                  className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer border-[6px] border-white relative overflow-hidden"
                >
                  {/* Dekorativni gradijenti - Dashboard stil */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-200 rounded-full blur-xl opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100 rounded-full blur-xl -mb-12 -ml-12 opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3.5 bg-blue-50 rounded-2xl shadow-soft group-hover:scale-110 transition-transform">
                        <Plane className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(aircraftType)}
                          className="bg-white border-2 border-dark-200 text-dark-900 hover:bg-dark-50 hover:border-dark-300 shadow-soft"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(aircraftType)}
                          className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
                          size="sm"
                          disabled={aircraftType._count.flights > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-dark-900 mb-4">{aircraftType.model}</h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-dark-50 rounded-2xl border border-dark-200">
                        <Users className="w-5 h-5 text-dark-600" />
                        <div>
                          <span className="text-xs text-dark-600 font-semibold uppercase tracking-wide">Sjedišta</span>
                          <p className="text-base font-bold text-dark-900">{aircraftType.seats}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-dark-50 rounded-2xl border border-dark-200">
                        <Weight className="w-5 h-5 text-dark-600" />
                        <div>
                          <span className="text-xs text-dark-600 font-semibold uppercase tracking-wide">MTOW</span>
                          <p className="text-base font-bold text-dark-900">{aircraftType.mtow.toLocaleString()} kg</p>
                        </div>
                      </div>
                      <div className="pt-3 mt-3 border-t border-dark-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-dark-500 font-medium uppercase tracking-wide">Ukupno letova</span>
                          <span className="text-lg font-bold text-dark-900">{aircraftType._count.flights}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        <AircraftTypeModal
          aircraftType={editingAircraftType}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      </div>
    </MainLayout>
  );
}

