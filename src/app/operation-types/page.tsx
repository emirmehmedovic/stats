'use client';

import { useState, useEffect } from 'react';
import { Settings2, Plus, Edit, Trash2, Search, Plane, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error';
import { showToast } from '@/components/ui/toast';
import { OperationTypeModal } from '@/components/operation-types/OperationTypeModal';
import { MainLayout } from '@/components/layout/MainLayout';

type OperationType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count: {
    flights: number;
  };
};

export default function OperationTypesPage() {
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperationType, setEditingOperationType] = useState<OperationType | null>(null);

  useEffect(() => {
    fetchOperationTypes();
  }, [searchTerm]);

  const fetchOperationTypes = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/operation-types?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setOperationTypes(result.data);
      } else {
        setError(result.error || 'Greška pri učitavanju tipova operacije');
      }
    } catch (err) {
      setError('Greška pri učitavanju tipova operacije');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (operationType: OperationType) => {
    if (!confirm(`Da li ste sigurni da želite obrisati "${operationType.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/operation-types/${operationType.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Tip operacije je uspješno obrisan!', 'success');
        fetchOperationTypes();
      } else {
        showToast(result.error || 'Greška pri brisanju', 'error');
      }
    } catch (err) {
      showToast('Greška pri brisanju tipa operacije', 'error');
      console.error(err);
    }
  };

  const handleEdit = (operationType: OperationType) => {
    setEditingOperationType(operationType);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingOperationType(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingOperationType(null);
  };

  const handleModalSuccess = () => {
    fetchOperationTypes();
    handleModalClose();
  };

  if (isLoading) {
    return (
      <MainLayout>
      <div className="p-8">
        <LoadingSpinner text="Učitavam tipove operacije..." />
      </div>
      </MainLayout>
  );
  }

  if (error && operationTypes.length === 0) {
    return (
      <MainLayout>
      <div className="p-8">
        <ErrorDisplay error={error} onRetry={fetchOperationTypes} />
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
            <h1 className="text-3xl font-bold tracking-tight">Tipovi operacije</h1>
            <p className="text-dark-300 mt-2">Upravljanje tipovima operacije letova</p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-white text-dark-900 hover:bg-dark-50 font-semibold shadow-soft-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj tip operacije
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
              placeholder="Pretraži tipove operacije (naziv, kod, opis)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 pr-5 py-4 bg-white border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-shadow text-dark-900 placeholder:text-dark-400 shadow-soft text-base"
            />
          </div>
        </div>
      </div>

      {/* Operation Types List - Dashboard stil */}
      <div className="bg-white rounded-3xl shadow-soft relative overflow-hidden border-[6px] border-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-blue-100/40 opacity-60"></div>
        <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-40"></div>

        <div className="relative z-10 p-8 border-b border-dark-100">
          <h2 className="text-xl font-bold text-dark-900">
            Svi tipovi operacije ({operationTypes.length})
          </h2>
        </div>

        {operationTypes.length === 0 ? (
          <div className="relative z-10 p-12 text-center">
            <div className="p-6 bg-primary-50 rounded-3xl inline-block mb-4">
              <Settings2 className="w-12 h-12 text-primary-600" />
            </div>
            <p className="text-dark-600 text-lg mb-4">Nema tipova operacije</p>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-br from-dark-900 to-dark-800 text-white hover:from-dark-800 hover:to-dark-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj prvi tip operacije
            </Button>
          </div>
        ) : (
          <div className="relative z-10 p-6 space-y-4">
            {operationTypes.map((operationType) => (
              <div
                key={operationType.id}
                className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer border-[6px] border-white relative overflow-hidden"
              >
                {/* Dekorativni gradijenti - Dashboard stil */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-200 rounded-full blur-xl opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100 rounded-full blur-xl -mb-12 -ml-12 opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>

                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-3.5 rounded-2xl shadow-soft group-hover:scale-110 transition-transform ${operationType.isActive ? 'bg-green-50' : 'bg-dark-50'}`}>
                        <Settings2 className={`w-6 h-6 ${operationType.isActive ? 'text-green-600' : 'text-dark-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-xl font-bold text-dark-900">{operationType.name}</h3>
                          {operationType.isActive ? (
                            <span className="px-2.5 py-1 bg-green-50 rounded-full text-xs font-semibold text-green-700 border border-green-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Aktivno
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-dark-50 rounded-full text-xs font-semibold text-dark-500 border border-dark-200 flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Neaktivno
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-dark-50 rounded-full text-xs font-semibold text-dark-700 border border-dark-200">
                            Kod: {operationType.code}
                          </span>
                          {operationType.description && (
                            <span className="text-sm text-dark-500">{operationType.description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 px-4 py-2.5 bg-primary-50 rounded-2xl border border-primary-200 w-fit">
                      <Plane className="w-5 h-5 text-primary-600" />
                      <span className="text-sm font-semibold text-primary-900">{operationType._count.flights} let(ova)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleEdit(operationType)}
                      className="bg-white border-2 border-dark-200 text-dark-900 hover:bg-dark-50 hover:border-dark-300 shadow-soft"
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Uredi
                    </Button>
                    <Button
                      onClick={() => handleDelete(operationType)}
                      className="bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
                      size="sm"
                      disabled={operationType._count.flights > 0}
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
      <OperationTypeModal
        operationType={editingOperationType}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
    </MainLayout>
  );
}

