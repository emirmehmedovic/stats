'use client';

import { Lock, Info, AlertCircle } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Label } from '@/components/ui/label';
import { formatDateTimeDisplay } from '@/lib/dates';

interface DoorClosingTimeInputProps {
  scheduledTime?: string | null;
  actualTime?: string | null;
  doorClosingTime?: string | null;
  onChange: (time: string) => void;
  disabled?: boolean;
}

export function DoorClosingTimeInput({
  scheduledTime,
  actualTime,
  doorClosingTime,
  onChange,
  disabled = false,
}: DoorClosingTimeInputProps) {
  // Validacija: door closing time treba biti između scheduled i actual vremena
  const isValidTime = () => {
    if (!doorClosingTime || !scheduledTime || !actualTime) return true;

    const doorTime = new Date(doorClosingTime).getTime();
    const schedTime = new Date(scheduledTime).getTime();
    const actTime = new Date(actualTime).getTime();

    return doorTime >= schedTime && doorTime <= actTime;
  };

  const hasValidationError = doorClosingTime && !isValidTime();

  return (
    <div className="space-y-2">
      <DateTimePicker
        value={doorClosingTime || ''}
        onChange={onChange}
        disabled={disabled}
        placeholder="Izaberite vrijeme zatvaranja vrata"
        className={hasValidationError ? 'border-red-300 focus:ring-red-500' : ''}
      />

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600">
          Vrijeme kada su se vrata aviona zatvorila prije odlaska. Ovo polje je
          opciono.
        </p>
      </div>

      {/* Validation Error */}
      {hasValidationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-700">
            <p className="font-medium">Nevalidno vrijeme</p>
            <p className="mt-1">
              Vrijeme zatvaranja vrata treba biti između planiranog (
              {scheduledTime ? formatDateTimeDisplay(scheduledTime) : 'N/A'})
              i stvarnog vremena odlaska (
              {actualTime ? formatDateTimeDisplay(actualTime) : 'N/A'}).
            </p>
          </div>
        </div>
      )}

      {/* Helpful Context */}
      {scheduledTime && actualTime && !doorClosingTime && (
        <div className="text-xs text-slate-500">
          <p>
            Planirano: {formatDateTimeDisplay(scheduledTime)} → Stvarno:{' '}
            {formatDateTimeDisplay(actualTime)}
          </p>
        </div>
      )}
    </div>
  );
}
