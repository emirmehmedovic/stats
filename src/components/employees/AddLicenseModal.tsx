'use client';

import { useState, FormEvent } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '../ui/toast';

type AddLicenseModalProps = {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AddLicenseModal({ employeeId, isOpen, onClose, onSuccess }: AddLicenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    licenseType: '',
    licenseNumber: '',
    issuedDate: '',
    expiryDate: '',
    issuer: '',
    status: 'ACTIVE',
    requiredForPosition: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/employees/${employeeId}/licenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Licenca je uspješno kreirana!', 'success');
        onSuccess();
        handleClose();
      } else {
        setError(result.error || 'Failed to create license');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      licenseType: '',
      licenseNumber: '',
      issuedDate: '',
      expiryDate: '',
      issuer: '',
      status: 'ACTIVE',
      requiredForPosition: '',
    });
    setError('');
    onClose();
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
          <h2 className="text-2xl font-bold text-slate-900">Dodaj novu licencu</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Osnovne informacije</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseType">Tip licence *</Label>
                <Input
                  id="licenseType"
                  required
                  value={formData.licenseType}
                  onChange={(e) => handleChange('licenseType', e.target.value)}
                  placeholder="AVSEC, Fire Fighter, Security..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="licenseNumber">Broj licence *</Label>
                <Input
                  id="licenseNumber"
                  required
                  value={formData.licenseNumber}
                  onChange={(e) => handleChange('licenseNumber', e.target.value)}
                  placeholder="LIC-2025-001"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="issuedDate">Datum izdavanja *</Label>
                <Input
                  id="issuedDate"
                  type="date"
                  required
                  value={formData.issuedDate}
                  onChange={(e) => handleChange('issuedDate', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="expiryDate">Datum isteka *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => handleChange('expiryDate', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="issuer">Izdavač</Label>
                <Input
                  id="issuer"
                  value={formData.issuer}
                  onChange={(e) => handleChange('issuer', e.target.value)}
                  placeholder="Ministarstvo, Institucija..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Aktivna</option>
                  <option value="EXPIRED">Istekla</option>
                  <option value="SUSPENDED">Suspendovana</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="requiredForPosition">Potrebna za poziciju</Label>
                <Input
                  id="requiredForPosition"
                  value={formData.requiredForPosition}
                  onChange={(e) => handleChange('requiredForPosition', e.target.value)}
                  placeholder="Security Officer, Fire Fighter..."
                  className="mt-1"
                />
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
          <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
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
                  Sačuvaj licencu
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Odustani
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

