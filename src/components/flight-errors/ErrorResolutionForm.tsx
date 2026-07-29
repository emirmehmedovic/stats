'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorResolutionFormProps {
  onSubmit: (notes: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ErrorResolutionForm({ onSubmit, onCancel, isSubmitting = false }: ErrorResolutionFormProps) {
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(notes);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-green-50 border border-green-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-green-900">Označi kao riješeno</h3>
          <p className="text-sm text-green-700">Potvrdite da ste ispravili grešku na letu</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-green-800 mb-2">
          Napomena (opcionalno)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opišite šta ste ispravili..."
          rows={3}
          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white resize-none"
          disabled={isSubmitting}
        />
      </div>

      <div className="bg-green-100 rounded-lg p-3 mb-4">
        <p className="text-sm text-green-800">
          <strong>Napomena:</strong> Nakon što označite grešku kao riješenu, prijavitelj će dobiti obavijest.
          Sistem će zabilježiti promjene koje ste napravili na letu.
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
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Šaljem...' : 'Označi kao riješeno'}
        </Button>
      </div>
    </form>
  );
}
