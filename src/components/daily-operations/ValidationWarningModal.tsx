'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ValidationWarningModalProps {
  isOpen: boolean;
  warnings: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ValidationWarningModal({
  isOpen,
  warnings,
  onConfirm,
  onCancel,
}: ValidationWarningModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg animate-in fade-in zoom-in">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Upozorenje o validaciji
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-slate-700 mb-4">
              Sistem je detektovao sljedeća upozorenja:
            </p>

            <ul className="space-y-2 mb-6">
              {warnings.map((warning, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg p-3"
                >
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{warning}</span>
                </li>
              ))}
            </ul>

            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-600">
                <strong>Napomena:</strong> Ova upozorenja ne blokiraju čuvanje
                podataka, ali preporučujemo da provjerite unešene vrijednosti.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1"
              >
                Ne, ispravi
              </Button>
              <Button
                onClick={onConfirm}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                Da, siguran sam
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
