'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '../ui/toast';

type DelayCode = {
  id: string;
  code: string;
  description: string;
  category: string;
};

type DelayCodeModalProps = {
  delayCode: DelayCode | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const COMMON_CATEGORIES = [
  'Carrier',
  'ATC',
  'Weather',
  'Reactionary',
  'Security',
  'Ground Handling',
  'Aircraft',
  'Other',
];

export function DelayCodeModal({ delayCode, isOpen, onClose, onSuccess }: DelayCodeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    category: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (delayCode) {
        setFormData({
          code: delayCode.code,
          description: delayCode.description,
          category: delayCode.category,
        });
      } else {
        setFormData({
          code: '',
          description: '',
          category: '',
        });
      }
      setError('');
    }
  }, [delayCode, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        category: formData.category,
      };

      const url = delayCode ? `/api/delay-codes/${delayCode.id}` : '/api/delay-codes';
      const method = delayCode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(
          delayCode ? 'Delay kod je uspješno ažuriran!' : 'Delay kod je uspješno kreiran!',
          'success'
        );
        onSuccess();
      } else {
        setError(result.error || (delayCode ? 'Failed to update delay code' : 'Failed to create delay code'));
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {delayCode ? 'Uredi delay kod' : 'Dodaj novi delay kod'}
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
                placeholder="A1, B2, WX..."
                className="mt-1"
                disabled={!!delayCode} // Kod se ne može mijenjati nakon kreiranja
              />
              <p className="text-xs text-slate-500 mt-1">Jedinstveni kod (npr. A1, B2, WX)</p>
            </div>

            <div>
              <Label htmlFor="category">Kategorija *</Label>
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Izaberite kategoriju</option>
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Kategorija delay koda</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Opis *</Label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Detaljan opis šta ovaj delay kod znači..."
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                rows={4}
              />
              <p className="text-xs text-slate-500 mt-1">Detaljan opis šta delay kod znači</p>
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
                  {delayCode ? 'Sačuvaj izmjene' : 'Dodaj delay kod'}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

