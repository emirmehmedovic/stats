'use client';

import { Users, User, Baby, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface PassengerBreakdown {
  male: number;
  female: number;
  children: number;
}

interface PassengerBreakdownInputProps {
  totalPassengers: number;
  male: number;
  female: number;
  children: number;
  onChange: (breakdown: PassengerBreakdown) => void;
  disabled?: boolean;
  label?: string;
}

export function PassengerBreakdownInput({
  totalPassengers,
  male,
  female,
  children,
  onChange,
  disabled = false,
  label = 'Breakdown putnika',
}: PassengerBreakdownInputProps) {
  const sum = male + female + children;
  const isValid = sum === totalPassengers;
  const hasBreakdown = male > 0 || female > 0 || children > 0;

  const handleChange = (field: keyof PassengerBreakdown, value: string) => {
    const numValue = parseInt(value) || 0;
    onChange({
      male: field === 'male' ? numValue : male,
      female: field === 'female' ? numValue : female,
      children: field === 'children' ? numValue : children,
    });
  };

  // Ako nema ukupnog broja putnika, ne prikazuj breakdown
  if (!totalPassengers || totalPassengers === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-slate-700">
          <Users className="w-4 h-4 inline mr-1.5" />
          {label}
        </Label>
        {hasBreakdown && (
          <div className="flex items-center gap-2">
            {isValid ? (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Validno
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md">
                <AlertCircle className="w-3.5 h-3.5" />
                Nevalidno
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-slate-600">
        <p>
          <strong>Ukupno putnika: {totalPassengers}</strong> (djeca spadaju u
          putnike)
        </p>
        {hasBreakdown && (
          <p className="mt-1">
            Trenutni zbir: {male} + {female} + {children} ={' '}
            <strong className={isValid ? 'text-green-600' : 'text-red-600'}>
              {sum}
            </strong>
          </p>
        )}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-3 gap-3">
        {/* Male */}
        <div>
          <Label
            htmlFor="male"
            className="text-xs text-slate-600 flex items-center gap-1"
          >
            <User className="w-3.5 h-3.5" />
            Muškarci
          </Label>
          <Input
            id="male"
            type="number"
            min="0"
            max={totalPassengers}
            value={male || ''}
            onChange={(e) => handleChange('male', e.target.value)}
            disabled={disabled}
            placeholder="0"
            className={
              hasBreakdown && !isValid
                ? 'border-red-300 focus:ring-red-500'
                : ''
            }
          />
        </div>

        {/* Female */}
        <div>
          <Label
            htmlFor="female"
            className="text-xs text-slate-600 flex items-center gap-1"
          >
            <User className="w-3.5 h-3.5" />
            Žene
          </Label>
          <Input
            id="female"
            type="number"
            min="0"
            max={totalPassengers}
            value={female || ''}
            onChange={(e) => handleChange('female', e.target.value)}
            disabled={disabled}
            placeholder="0"
            className={
              hasBreakdown && !isValid
                ? 'border-red-300 focus:ring-red-500'
                : ''
            }
          />
        </div>

        {/* Children */}
        <div>
          <Label
            htmlFor="children"
            className="text-xs text-slate-600 flex items-center gap-1"
          >
            <Baby className="w-3.5 h-3.5" />
            Djeca
          </Label>
          <Input
            id="children"
            type="number"
            min="0"
            max={totalPassengers}
            value={children || ''}
            onChange={(e) => handleChange('children', e.target.value)}
            disabled={disabled}
            placeholder="0"
            className={
              hasBreakdown && !isValid
                ? 'border-red-300 focus:ring-red-500'
                : ''
            }
          />
        </div>
      </div>

      {/* Validation Error */}
      {hasBreakdown && !isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            Zbir putnika ({sum}) ne odgovara ukupnom broju ({totalPassengers}).
            Molimo ispravite unos.
          </p>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-slate-500 italic">
        * Breakdown je opcionalan, ali ako unesete vrijednosti, zbir mora biti
        tačan
      </p>
    </div>
  );
}
