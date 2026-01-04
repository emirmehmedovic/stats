'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '../ui/toast';

type Airline = {
  id: string;
  name: string;
  icaoCode: string;
  iataCode: string | null;
  country: string | null;
  address: string | null;
  logoUrl: string | null;
};

type AirlineModalProps = {
  airline: Airline | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AirlineModal({ airline, isOpen, onClose, onSuccess }: AirlineModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    icaoCode: '',
    iataCode: '',
    country: '',
    address: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (airline) {
        setFormData({
          name: airline.name,
          icaoCode: airline.icaoCode,
          iataCode: airline.iataCode || '',
          country: airline.country || '',
          address: airline.address || '',
        });
        setLogoPreview(airline.logoUrl || null);
      } else {
        setFormData({
          name: '',
          icaoCode: '',
          iataCode: '',
          country: '',
          address: '',
        });
        setLogoPreview(null);
      }
      setLogoFile(null);
      setError('');
    }
  }, [airline, isOpen]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validacija tipa fajla
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setError('Nepodržan tip fajla. Dozvoljeni su samo slike (JPEG, PNG, WebP, SVG)');
        return;
      }

      // Validacija veličine (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Slika je prevelika. Maksimalna veličina je 5MB');
        return;
      }

      setLogoFile(file);
      setError('');
      
      // Kreiranje preview-a
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: formData.name,
        icaoCode: formData.icaoCode.toUpperCase(),
        country: formData.country || null,
        address: formData.address || null,
      };

      // Only include IATA code if it's provided and has exactly 2 characters
      if (formData.iataCode && formData.iataCode.trim().length === 2) {
        payload.iataCode = formData.iataCode.toUpperCase();
      } else {
        payload.iataCode = null;
      }

      const url = airline ? `/api/airlines/${airline.id}` : '/api/airlines';
      const method = airline ? 'PUT' : 'POST';

      // Prvo kreiramo/ažuriramo aviokompaniju
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || (airline ? 'Failed to update airline' : 'Failed to create airline'));
        if (result.details) {
          console.error('Validation errors:', result.details);
        }
        setIsSubmitting(false);
        return;
      }

      // Ako imamo logo fajl, uploadujemo ga
      const airlineId = airline ? airline.id : result.data.id;
      
      if (logoFile) {
        setIsUploadingLogo(true);
        const formDataForLogo = new FormData();
        formDataForLogo.append('file', logoFile);

        const logoResponse = await fetch(`/api/airlines/${airlineId}/logo`, {
          method: 'POST',
          body: formDataForLogo,
        });

        if (!logoResponse.ok) {
          const logoError = await logoResponse.json();
          setError(logoError.error || 'Greška pri uploadovanju logoa');
          setIsSubmitting(false);
          setIsUploadingLogo(false);
          return;
        }
        setIsUploadingLogo(false);
      }

      showToast(
        airline ? 'Aviokompanija je uspješno ažurirana!' : 'Aviokompanija je uspješno kreirana!',
        'success'
      );
      onSuccess();
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setIsUploadingLogo(false);
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
            {airline ? 'Uredi aviokompaniju' : 'Dodaj novu aviokompaniju'}
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
              <Label htmlFor="name">Naziv aviokompanije *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Wizz Air"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="icaoCode">ICAO kod *</Label>
              <Input
                id="icaoCode"
                required
                maxLength={3}
                value={formData.icaoCode}
                onChange={(e) => handleChange('icaoCode', e.target.value.toUpperCase())}
                placeholder="WZZ"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">3 karaktera (npr. WZZ, WMT)</p>
            </div>

            <div>
              <Label htmlFor="iataCode">IATA kod</Label>
              <Input
                id="iataCode"
                maxLength={2}
                value={formData.iataCode}
                onChange={(e) => handleChange('iataCode', e.target.value.toUpperCase())}
                placeholder="W6"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">2 karaktera (npr. W6, PC)</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="country">Zemlja</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Malta, Hungary..."
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Adresa</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Main Street, City..."
                className="mt-1"
              />
            </div>

            {/* Logo Upload */}
            <div className="md:col-span-2">
              <Label htmlFor="logo">Logo aviokompanije</Label>
              <div className="mt-1 space-y-3">
                {logoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-20 w-auto object-contain border border-slate-200 rounded-lg p-2 bg-white"
                    />
                  </div>
                )}
                <Input
                  id="logo"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp,image/svg+xml"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-slate-500">
                  Dozvoljeni formati: JPEG, PNG, WebP, SVG. Maksimalna veličina: 5MB
                </p>
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
              disabled={isSubmitting || isUploadingLogo}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {(isSubmitting || isUploadingLogo) ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isUploadingLogo ? 'Uploadujem logo...' : 'Spremam...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {airline ? 'Sačuvaj izmjene' : 'Dodaj aviokompaniju'}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

