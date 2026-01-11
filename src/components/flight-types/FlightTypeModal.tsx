'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '../ui/toast';

type FlightType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

type FlightTypeModalProps = {
  flightType: FlightType | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function FlightTypeModal({ flightType, isOpen, onClose, onSuccess }: FlightTypeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (flightType) {
        setFormData({
          code: flightType.code,
          name: flightType.name,
          description: flightType.description || '',
          isActive: flightType.isActive,
        });
      } else {
        setFormData({
          code: '',
          name: '',
          description: '',
          isActive: true,
        });
      }
      setError('');
    }
  }, [flightType, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        isActive: formData.isActive,
      };

      const url = flightType ? `/api/flight-types/${flightType.id}` : '/api/flight-types';
      const method = flightType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(
          flightType ? 'Tip leta je uspješno ažuriran!' : 'Tip leta je uspješno kreiran!',
          'success'
        );
        onSuccess();
      } else {
        setError(result.error || (flightType ? 'Failed to update flight type' : 'Failed to create flight type'));
        if (result.details) {
          console.error('Validation errors:', result.details);
        }
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {flightType ? 'Uredi tip leta' : 'Dodaj novi tip leta'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Kod *</Label>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="MEDEVAC, VIP, CARGO..."
                className="mt-1"
                disabled={!!flightType}
              />
              <p className="text-xs text-slate-500 mt-1">Jedinstveni kod (npr. MEDEVAC, VIP)</p>
            </div>

            <div>
              <Label htmlFor="name">Naziv *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Medicinski, VIP, Cargo..."
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Prikazni naziv</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Opis</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Opis tipa leta..."
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Aktivan (prikazuje se u dropdown-ovima)
                </Label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Odustani
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Spremam...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {flightType ? 'Sačuvaj izmjene' : 'Dodaj tip leta'}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
