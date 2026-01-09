'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showToast } from '@/components/ui/toast';

type AirlineRoute = {
  id: string;
  route: string;
  destination: string;
  country: string;
  isActive: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  airlineId: string;
  airlineName: string;
};

export function AirlineRoutesModal({ isOpen, onClose, airlineId, airlineName }: Props) {
  const [routes, setRoutes] = useState<AirlineRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newRoute, setNewRoute] = useState({ route: '', destination: '', country: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRoutes();
    }
  }, [isOpen, airlineId]);

  const fetchRoutes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/airlines/${airlineId}/routes`);
      const result = await response.json();
      if (result.success) {
        setRoutes(result.data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRoute = async () => {
    if (!newRoute.route || !newRoute.destination || !newRoute.country) {
      showToast('Popunite sva polja', 'error');
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch(`/api/airlines/${airlineId}/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoute),
      });

      const result = await response.json();
      if (result.success) {
        showToast('Ruta uspješno dodana', 'success');
        setNewRoute({ route: '', destination: '', country: '' });
        fetchRoutes();
      } else {
        showToast(result.error || 'Greška pri dodavanju rute', 'error');
      }
    } catch (error) {
      showToast('Greška pri dodavanju rute', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovu rutu?')) {
      return;
    }

    try {
      const response = await fetch(`/api/airlines/${airlineId}/routes/${routeId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        showToast('Ruta uspješno obrisana', 'success');
        fetchRoutes();
      } else {
        showToast(result.error || 'Greška pri brisanju rute', 'error');
      }
    } catch (error) {
      showToast('Greška pri brisanju rute', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Rute</h2>
              <p className="text-sm text-blue-100">{airlineName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Route Form */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Dodaj novu rutu
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Ruta (npr. TZL-BSL)
                </label>
                <Input
                  value={newRoute.route}
                  onChange={(e) => setNewRoute({ ...newRoute, route: e.target.value.toUpperCase() })}
                  placeholder="TZL-BSL"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Destinacija
                </label>
                <Input
                  value={newRoute.destination}
                  onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
                  placeholder="Basel"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Zemlja
                </label>
                <Input
                  value={newRoute.country}
                  onChange={(e) => setNewRoute({ ...newRoute, country: e.target.value })}
                  placeholder="Switzerland"
                  className="text-sm"
                />
              </div>
            </div>
            <Button
              onClick={handleAddRoute}
              disabled={isAdding}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAdding ? 'Dodajem...' : 'Dodaj rutu'}
            </Button>
          </div>

          {/* Routes List */}
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Učitavam rute...</div>
          ) : routes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nema dodanih ruta za ovu aviokompaniju
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 mb-3">
                Postojeće rute ({routes.length})
              </h3>
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{route.route}</div>
                      <div className="text-sm text-slate-600">
                        {route.destination}, {route.country}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRoute(route.id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title="Obriši rutu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <Button onClick={onClose} variant="outline" className="w-full">
            Zatvori
          </Button>
        </div>
      </div>
    </div>
  );
}
