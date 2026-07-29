'use client';

import { useState } from 'react';
import { X, AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlightErrorType, FlightErrorPriority } from '@prisma/client';

interface FlightInfo {
  id: string;
  route: string;
  date: string | Date;
  arrivalFlightNumber: string | null;
  departureFlightNumber: string | null;
  airline?: {
    name: string;
    icaoCode: string;
  };
}

interface ErrorReportModalProps {
  isOpen: boolean;
  flight: FlightInfo | null;
  onClose: () => void;
  onSubmit: (data: { errorType: FlightErrorType; priority: FlightErrorPriority; description: string }) => Promise<void>;
}

const errorTypeOptions: { value: FlightErrorType; label: string }[] = [
  { value: 'GENERAL', label: 'Opća greška' },
  { value: 'DEPARTURE_PASSENGERS', label: 'Pogrešan broj odlaznih putnika' },
  { value: 'ARRIVAL_PASSENGERS', label: 'Pogrešan broj dolaznih putnika' },
  { value: 'AIRCRAFT_TYPE', label: 'Pogrešan tip aviona' },
  { value: 'OPERATION_TYPE', label: 'Pogrešan tip operacije' },
  { value: 'FLIGHT_TYPE', label: 'Pogrešan tip leta' },
  { value: 'NOT_VERIFIED', label: 'Let nije verifikovan' },
];

const priorityOptions: { value: FlightErrorPriority; label: string; description: string }[] = [
  { value: 'LOW', label: 'Nizak', description: 'Nije hitno, može se riješiti kada ima vremena' },
  { value: 'MEDIUM', label: 'Srednji', description: 'Standardni prioritet, riješiti u razumnom roku' },
  { value: 'HIGH', label: 'Visok', description: 'Potrebno hitno riješiti' },
  { value: 'URGENT', label: 'Hitan', description: 'Kritična greška, mora se odmah riješiti' },
];

export function ErrorReportModal({ isOpen, flight, onClose, onSubmit }: ErrorReportModalProps) {
  const [errorType, setErrorType] = useState<FlightErrorType>('GENERAL');
  const [priority, setPriority] = useState<FlightErrorPriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !flight) return null;

  const flightNumber = flight.departureFlightNumber || flight.arrivalFlightNumber || 'N/A';
  const flightDate = new Date(flight.date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (description.trim().length < 10) {
      setError('Opis mora imati najmanje 10 karaktera');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ errorType, priority, description });
      // Reset form
      setErrorType('GENERAL');
      setPriority('MEDIUM');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri slanju prijave');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg animate-in fade-in zoom-in max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Prijavi grešku
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Flight info */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-slate-500 mb-1">Let</div>
              <div className="font-semibold text-slate-900">
                {flight.route} | {flightNumber}
                {flight.airline && ` | ${flight.airline.icaoCode}`}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                {flightDate.toLocaleDateString('bs-BA')}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Error Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tip greške
              </label>
              <select
                value={errorType}
                onChange={(e) => setErrorType(e.target.value as FlightErrorType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                {errorTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prioritet
              </label>
              <div className="space-y-2">
                {priorityOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      priority === option.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={option.value}
                      checked={priority === option.value}
                      onChange={(e) => setPriority(e.target.value as FlightErrorPriority)}
                      className="mt-1 text-red-500 focus:ring-red-500"
                      disabled={isSubmitting}
                    />
                    <div>
                      <div className="font-medium text-slate-900">{option.label}</div>
                      <div className="text-sm text-slate-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Opis greške
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opišite detaljno šta je pogrešno i koja bi trebala biti ispravna vrijednost..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
              <div className="text-xs text-slate-500 mt-1">
                Minimum 10 karaktera ({description.length}/10)
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                disabled={isSubmitting}
              >
                Odustani
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                disabled={isSubmitting || description.trim().length < 10}
              >
                {isSubmitting ? (
                  'Šaljem...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Prijavi grešku
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
