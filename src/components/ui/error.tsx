import { AlertCircle } from 'lucide-react';
import { Button } from './button';

type ErrorDisplayProps = {
  error: string;
  onRetry?: () => void;
  onBack?: () => void;
  backLabel?: string;
};

export function ErrorDisplay({ error, onRetry, onBack, backLabel = 'Nazad' }: ErrorDisplayProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 mb-1">Greška</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <div className="flex gap-3">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Pokušaj ponovo
              </Button>
            )}
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                {backLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

