'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisputeFormProps {
  onSubmit: (reason: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ErrorDisputeForm({ onSubmit, onCancel, isSubmitting = false }: ErrorDisputeFormProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 10) {
      setError('Razlog mora imati najmanje 10 karaktera');
      return;
    }

    await onSubmit(reason);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-purple-50 border border-purple-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-purple-900">Ospori grešku</h3>
          <p className="text-sm text-purple-700">Smatrate da prijavljena greška nije ispravna?</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-purple-800 mb-2">
          Razlog osporavanja *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Objasnite zašto smatrate da prijavljena greška nije ispravna..."
          rows={4}
          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white resize-none"
          disabled={isSubmitting}
        />
        <div className="text-xs text-purple-600 mt-1">
          Minimum 10 karaktera ({reason.length}/10)
        </div>
      </div>

      <div className="bg-purple-100 rounded-lg p-3 mb-4">
        <p className="text-sm text-purple-800">
          <strong>Napomena:</strong> Osporavanje greške će obavijestiti prijavitelja i administratore.
          Administrator će pregledati slučaj i donijeti konačnu odluku.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={isSubmitting}
        >
          Odustani
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
          disabled={isSubmitting || reason.trim().length < 10}
        >
          {isSubmitting ? 'Šaljem...' : 'Ospori grešku'}
        </Button>
      </div>
    </form>
  );
}
