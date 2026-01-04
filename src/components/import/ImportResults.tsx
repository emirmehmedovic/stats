'use client';

import { Button } from '@/components/ui/button';

interface ImportError {
  row: number;
  errors: string[];
}

interface ImportResultsProps {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: ImportError[];
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function ImportResults({
  success,
  totalRows,
  importedRows,
  skippedRows,
  errors,
  message,
  onClose,
  onRetry,
}: ImportResultsProps) {
  const handleDownloadErrorReport = () => {
    if (errors.length === 0) return;

    // Create CSV content
    const csvContent = [
      ['Red', 'Greške'].join(','),
      ...errors.map((error) => [error.row, error.errors.join('; ')].join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `import-errors-${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
      {/* Header */}
      <div
        className={`px-5 py-4 border-b border-borderSoft ${
          success ? 'bg-green-50' : 'bg-red-50'
        }`}
      >
        <div className="flex items-center gap-3">
          {success ? (
            <svg
              className="w-8 h-8 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-8 h-8 text-danger"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <div>
            <h3 className="text-lg font-semibold text-textMain">
              {success ? 'Import uspješan!' : 'Import završen sa greškama'}
            </h3>
            <p className="text-sm text-textMuted">{message}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-4 border-b border-borderSoft">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-textMuted mb-1">Ukupno redova</p>
            <p className="text-2xl font-semibold text-textMain">{totalRows}</p>
          </div>
          <div>
            <p className="text-xs text-textMuted mb-1">Importovano</p>
            <p className="text-2xl font-semibold text-success">{importedRows}</p>
          </div>
          <div>
            <p className="text-xs text-textMuted mb-1">Preskočeno</p>
            <p className="text-2xl font-semibold text-danger">{skippedRows}</p>
          </div>
        </div>
      </div>

      {/* Errors list */}
      {errors.length > 0 && (
        <div className="px-5 py-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-textMain">
              Greške ({errors.length})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadErrorReport}
              className="text-xs"
            >
              Preuzmi izvještaj
            </Button>
          </div>

          <div className="space-y-2">
            {errors.map((error) => (
              <div
                key={error.row}
                className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3"
              >
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-xs font-semibold text-red-700">
                    {error.row}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-700 mb-1">
                      Red {error.row}:
                    </p>
                    <ul className="text-xs text-red-600 space-y-1">
                      {error.errors.map((err, idx) => (
                        <li key={idx}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4 border-t border-borderSoft flex items-center justify-between">
        <div>
          {errors.length > 0 && onRetry && (
            <Button variant="outline" onClick={onRetry} className="text-sm">
              Pokušaj ponovo
            </Button>
          )}
        </div>
        <Button
          className="bg-brand-primary hover:bg-brand-primary/90 text-white"
          onClick={onClose}
        >
          Zatvori
        </Button>
      </div>
    </div>
  );
}
