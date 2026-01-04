'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '../ui/toast';

type AircraftType = {
  id: string;
  model: string;
  seats: number;
  mtow: number;
};

type AircraftTypeModalProps = {
  aircraftType: AircraftType | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AircraftTypeModal({ aircraftType, isOpen, onClose, onSuccess }: AircraftTypeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    model: '',
    seats: '',
    mtow: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (aircraftType) {
        setFormData({
          model: aircraftType.model,
          seats: aircraftType.seats.toString(),
          mtow: aircraftType.mtow.toString(),
        });
      } else {
        setFormData({
          model: '',
          seats: '',
          mtow: '',
        });
      }
      setError('');
    }
  }, [aircraftType, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        model: formData.model,
        seats: parseInt(formData.seats),
        mtow: parseInt(formData.mtow),
      };

      const url = aircraftType ? `/api/aircraft-types/${aircraftType.id}` : '/api/aircraft-types';
      const method = aircraftType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(
          aircraftType ? 'Tip aviona je uspješno ažuriran!' : 'Tip aviona je uspješno kreiran!',
          'success'
        );
        onSuccess();
      } else {
        setError(result.error || (aircraftType ? 'Failed to update aircraft type' : 'Failed to create aircraft type'));
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
            {aircraftType ? 'Uredi tip aviona' : 'Dodaj novi tip aviona'}
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
            <div className="md:col-span-2">
              <Label htmlFor="model">Model aviona *</Label>
              <Input
                id="model"
                required
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="A320, A321, B737..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="seats">Broj sjedišta *</Label>
              <Input
                id="seats"
                type="number"
                required
                min="1"
                value={formData.seats}
                onChange={(e) => handleChange('seats', e.target.value)}
                placeholder="186"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Broj sjedišta u avionu</p>
            </div>

            <div>
              <Label htmlFor="mtow">MTOW (kg) *</Label>
              <Input
                id="mtow"
                type="number"
                required
                min="1"
                value={formData.mtow}
                onChange={(e) => handleChange('mtow', e.target.value)}
                placeholder="71500"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Maximum Take-Off Weight u kilogramima</p>
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
                  {aircraftType ? 'Sačuvaj izmjene' : 'Dodaj tip aviona'}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

