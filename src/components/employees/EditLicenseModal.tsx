'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '../ui/toast';

type License = {
  id: string;
  licenseType?: string; // DEPRECATED
  licenseTypeId: string | null;
  type?: {
    id: string;
    name: string;
    code: string | null;
    category: string | null;
  } | null;
  licenseNumber: string;
  issuedDate: string;
  expiryDate: string;
  issuer: string | null;
  status: string;
  requiredForPosition: string | null;
};

type EditLicenseModalProps = {
  license: License;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: () => void;
};

export default function EditLicenseModal({ license, isOpen, onClose, onSuccess, onDelete }: EditLicenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    licenseTypeId: license.licenseTypeId || '',
    licenseNumber: license.licenseNumber,
    issuedDate: license.issuedDate.split('T')[0],
    expiryDate: license.expiryDate.split('T')[0],
    issuer: license.issuer || '',
    status: license.status,
    requiredForPosition: license.requiredForPosition || '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        licenseTypeId: license.licenseTypeId || '',
        licenseNumber: license.licenseNumber,
        issuedDate: license.issuedDate.split('T')[0],
        expiryDate: license.expiryDate.split('T')[0],
        issuer: license.issuer || '',
        status: license.status,
        requiredForPosition: license.requiredForPosition || '',
      });
      setError('');
    }
  }, [license, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/licenses/${license.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Licenca je uspješno ažurirana!', 'success');
        onSuccess();
        handleClose();
      } else {
        setError(result.error || 'Failed to update license');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Da li ste sigurni da želite obrisati ovu licencu?')) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/licenses/${license.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Licenca je uspješno obrisana!', 'success');
        if (onDelete) {
          onDelete();
        }
        onSuccess();
        handleClose();
      } else {
        setError(result.error || 'Failed to delete license');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
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
          <h2 className="text-2xl font-bold text-slate-900">Uredi licencu</h2>
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
                <Label htmlFor="edit-licenseType">Tip licence</Label>
                <Input
                  id="edit-licenseType"
                  value={license.type?.name || license.licenseType || 'N/A'}
                  disabled
                  className="mt-1 bg-slate-50"
                  title="Tip licence ne može biti izmijenjen"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Tip licence ne može biti izmijenjen nakon kreiranja
                </p>
              </div>

              <div>
                <Label htmlFor="edit-licenseNumber">Broj licence *</Label>
                <Input
                  id="edit-licenseNumber"
                  required
                  value={formData.licenseNumber}
                  onChange={(e) => handleChange('licenseNumber', e.target.value)}
                  placeholder="LIC-2025-001"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-issuedDate">Datum izdavanja *</Label>
                <Input
                  id="edit-issuedDate"
                  type="date"
                  required
                  value={formData.issuedDate}
                  onChange={(e) => handleChange('issuedDate', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-expiryDate">Datum isteka *</Label>
                <Input
                  id="edit-expiryDate"
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => handleChange('expiryDate', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-issuer">Izdavač</Label>
                <Input
                  id="edit-issuer"
                  value={formData.issuer}
                  onChange={(e) => handleChange('issuer', e.target.value)}
                  placeholder="Ministarstvo, Institucija..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
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
                <Label htmlFor="edit-requiredForPosition">Potrebna za poziciju</Label>
                <Input
                  id="edit-requiredForPosition"
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
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  Brisanje...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Obriši licencu
                </span>
              )}
            </Button>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting || isDeleting}
              >
                Odustani
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || isDeleting}
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
                    Sačuvaj izmjene
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

