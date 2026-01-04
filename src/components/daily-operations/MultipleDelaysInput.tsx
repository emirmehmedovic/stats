'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Lock, AlertCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface DelayInput {
  id?: string;
  delayCodeId: string;
  minutes: number;
  isPrimary: boolean;
  comment: string;
  unofficialReason: string;
}

interface DelayCode {
  id: string;
  code: string;
  description: string;
  category: string;
}

interface MultipleDelaysInputProps {
  phase: 'ARR' | 'DEP';
  airlineId?: string;
  delays: DelayInput[];
  onChange: (delays: DelayInput[]) => void;
  disabled?: boolean;
}

export function MultipleDelaysInput({
  phase,
  airlineId,
  delays,
  onChange,
  disabled = false,
}: MultipleDelaysInputProps) {
  const [delayCodes, setDelayCodes] = useState<DelayCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDelayCodes();
  }, [airlineId]);

  const fetchDelayCodes = async () => {
    setIsLoading(true);
    try {
      if (airlineId) {
        const params = new URLSearchParams({ airlineId, isActive: 'true' });
        const response = await fetch(`/api/airline-delay-codes?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          const codes = (result.data || []).map((item: any) => item.delayCode);
          setDelayCodes(codes);
        } else {
          setDelayCodes([]);
        }
      } else {
        const response = await fetch('/api/delay-codes');
        const result = await response.json();

        if (result.success) {
          setDelayCodes(result.data || []);
        } else {
          setDelayCodes([]);
        }
      }
    } catch (error) {
      console.error('Error fetching delay codes:', error);
      setDelayCodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addDelay = () => {
    const newDelay: DelayInput = {
      delayCodeId: '',
      minutes: 0,
      isPrimary: delays.length === 0, // Prvi je automatski primary
      comment: '',
      unofficialReason: '',
    };
    onChange([...delays, newDelay]);
  };

  const removeDelay = (index: number) => {
    const newDelays = delays.filter((_, i) => i !== index);
    // Ako smo obrisali primary, postavi prvi kao primary
    if (newDelays.length > 0 && !newDelays.some((d) => d.isPrimary)) {
      newDelays[0].isPrimary = true;
    }
    onChange(newDelays);
  };

  const updateDelay = (index: number, field: keyof DelayInput, value: any) => {
    const newDelays = [...delays];
    newDelays[index] = { ...newDelays[index], [field]: value };

    // Ako se postavlja isPrimary, ukloni ga sa ostalih
    if (field === 'isPrimary' && value === true) {
      newDelays.forEach((delay, i) => {
        if (i !== index) delay.isPrimary = false;
      });
    }

    onChange(newDelays);
  };

  const phaseLabel = phase === 'ARR' ? 'Dolazak' : 'Odlazak';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Kašnjenja ({phaseLabel})
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Oficijelni delay kod se prijavljuje kompaniji. Neoficijelni razlog
            je samo za internu evidenciju.
          </p>
          {!airlineId && (
            <p className="text-xs text-orange-600 mt-1">
              Odaberite aviokompaniju da vidite dostupne delay kodove.
            </p>
          )}
        </div>
        <Button
          onClick={addDelay}
          disabled={disabled || isLoading || !airlineId}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Dodaj delay
        </Button>
      </div>

      {/* Delays List */}
      {delays.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600">
            Nema unesenih kašnjenja za {phaseLabel.toLowerCase()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Kliknite "Dodaj delay" da dodate novi delay kod
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {delays.map((delay, index) => (
            <div
              key={index}
              className={`bg-white border-2 rounded-xl p-4 ${
                delay.isPrimary
                  ? 'border-orange-300 bg-orange-50/30'
                  : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Delay #{index + 1}
                  </span>
                  {delay.isPrimary && (
                    <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-current" />
                      Primary
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={delay.isPrimary}
                      onChange={(e) =>
                        updateDelay(index, 'isPrimary', e.target.checked)
                      }
                      disabled={disabled}
                      className="rounded border-slate-300"
                    />
                    Primary
                  </label>
                  <Button
                    onClick={() => removeDelay(index)}
                    disabled={disabled}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Oficijelni Delay Kod */}
                <div className="md:col-span-2">
                  <Label className="text-sm text-slate-700 flex items-center gap-1">
                    Oficijelni delay kod
                    <span className="text-xs text-slate-500">(sa kapetanom)</span>
                  </Label>
                  <select
                    value={delay.delayCodeId}
                    onChange={(e) =>
                      updateDelay(index, 'delayCodeId', e.target.value)
                    }
                    disabled={disabled || isLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Izaberite delay kod</option>
                    {delayCodes.map((code) => (
                      <option key={code.id} value={code.id}>
                        {code.code} - {code.description} ({code.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minuti */}
                <div>
                  <Label className="text-sm text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Minuti kašnjenja
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={delay.minutes || ''}
                    onChange={(e) =>
                      updateDelay(index, 'minutes', parseInt(e.target.value) || 0)
                    }
                    disabled={disabled}
                    placeholder="0"
                  />
                </div>

                {/* Komentar */}
                <div>
                  <Label className="text-sm text-slate-700">Komentar</Label>
                  <Input
                    value={delay.comment}
                    onChange={(e) =>
                      updateDelay(index, 'comment', e.target.value)
                    }
                    disabled={disabled}
                    placeholder="Dodatni komentar..."
                  />
                </div>

                {/* Neoficijelni Razlog */}
                <div className="md:col-span-2">
                  <Label className="text-sm text-slate-700 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    Neoficijelni razlog
                    <span className="text-xs text-slate-500">
                      (interno - kapetan ne zna)
                    </span>
                  </Label>
                  <Input
                    value={delay.unofficialReason}
                    onChange={(e) =>
                      updateDelay(index, 'unofficialReason', e.target.value)
                    }
                    disabled={disabled}
                    placeholder="Stvarni uzrok kašnjenja za internu evidenciju..."
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Ovo polje je opciono i služi za interno bilježenje stvarnog
                    razloga kašnjenja
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      {delays.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-slate-600">
          <p>
            <strong>Napomena:</strong> Možete dodati više delay kodova za isti
            let. Primary delay kod se koristi kao glavni razlog kašnjenja u
            izvještajima.
          </p>
        </div>
      )}
    </div>
  );
}
