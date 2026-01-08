'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, AlertTriangle, Calendar, Trash2 } from 'lucide-react';

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateFrom: string, dateTo: string) => Promise<void>;
}

export function BulkDeleteModal({ isOpen, onClose, onConfirm }: BulkDeleteModalProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [flightCount, setFlightCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Quick month selection helpers
  const setCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setDateFrom(`${year}-${month}-01`);
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    setDateTo(`${year}-${month}-${lastDay}`);
  };

  const setPreviousMonth = () => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = prevMonth.getFullYear();
    const month = String(prevMonth.getMonth() + 1).padStart(2, '0');
    setDateFrom(`${year}-${month}-01`);
    const lastDay = new Date(year, prevMonth.getMonth() + 1, 0).getDate();
    setDateTo(`${year}-${month}-${lastDay}`);
  };

  // Fetch flight count when dates change
  useEffect(() => {
    if (!dateFrom || !dateTo) {
      setFlightCount(null);
      return;
    }

    const fetchCount = async () => {
      setIsLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          dateFrom,
          dateTo,
          limit: '1', // We only need the count
        });
        const response = await fetch(`/api/flights?${params.toString()}`);
        if (!response.ok) throw new Error('Greška pri učitavanju broja letova');
        const data = await response.json();
        setFlightCount(data.pagination.total);
      } catch (err) {
        setError('Greška pri učitavanju broja letova');
        setFlightCount(null);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchCount, 500);
    return () => clearTimeout(debounce);
  }, [dateFrom, dateTo]);

  const handleConfirm = async () => {
    if (!dateFrom || !dateTo) {
      setError('Molimo unesite oba datuma');
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      setError('Datum od mora biti prije datuma do');
      return;
    }

    if (flightCount === 0) {
      setError('Nema letova u odabranom periodu');
      return;
    }

    setIsDeleting(true);
    setError('');
    try {
      await onConfirm(dateFrom, dateTo);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri brisanju');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Masovno brisanje letova</h2>
                <p className="text-sm text-red-100">Obriši sve letove u odabranom periodu</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Upozorenje!</p>
              <p>Ova akcija je **nepovratna**. Svi letovi u odabranom periodu će biti trajno obrisani iz baze podataka.</p>
            </div>
          </div>

          {/* Quick Selection */}
          <div>
            <Label className="text-sm font-semibold text-dark-700 mb-2 block">Brzi odabir perioda</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={setCurrentMonth}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Trenutni mjesec
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={setPreviousMonth}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Prethodni mjesec
              </Button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom" className="text-sm font-semibold text-dark-700 mb-2 block">
                Datum od
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="text-sm font-semibold text-dark-700 mb-2 block">
                Datum do
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Flight Count Display */}
          {isLoading && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-sm text-slate-600">Učitavanje broja letova...</p>
            </div>
          )}

          {!isLoading && flightCount !== null && (
            <div className={`border-2 rounded-2xl p-4 ${
              flightCount > 0 
                ? 'bg-red-50 border-red-200' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-dark-700">Broj letova za brisanje:</p>
                  <p className={`text-3xl font-bold ${
                    flightCount > 0 ? 'text-red-600' : 'text-slate-600'
                  }`}>
                    {flightCount}
                  </p>
                </div>
                {flightCount > 0 && (
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Otkaži
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!dateFrom || !dateTo || flightCount === 0 || isLoading || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? 'Brisanje...' : `Obriši ${flightCount || 0} letova`}
          </Button>
        </div>
      </div>
    </div>
  );
}
