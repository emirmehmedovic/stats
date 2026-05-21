'use client';

import { Button } from '@/components/ui/button';
import { formatDateDisplay } from '@/lib/dates';

interface ImportPreviewData {
  row: number;
  data: {
    date: Date | null;
    airline: string | null;
    route: string | null;
    aircraftType: string | null;
    registration: string | null;
    operationType: string | null;
    arrivalFlightNumber: string | null;
    departureFlightNumber: string | null;
    [key: string]: any;
  };
  errors: string[];
}

interface ImportPreviewProps {
  data: ImportPreviewData[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function ImportPreview({
  data,
  stats,
  onConfirm,
  onCancel,
  isProcessing = false,
}: ImportPreviewProps) {
  return (
    <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-borderSoft">
        <h3 className="text-lg font-semibold text-textMain mb-2">Pregled podataka</h3>
        <p className="text-sm text-textMuted">
          Prikazano prvih 10 redova. Pregledajte podatke prije importa.
        </p>
      </div>

      {/* Stats */}
      <div className="px-5 py-4 bg-shellBg border-b border-borderSoft">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-textMuted mb-1">Ukupno redova</p>
            <p className="text-2xl font-semibold text-textMain">{stats.totalRows}</p>
          </div>
          <div>
            <p className="text-xs text-textMuted mb-1">Validni redovi</p>
            <p className="text-2xl font-semibold text-success">{stats.validRows}</p>
          </div>
          <div>
            <p className="text-xs text-textMuted mb-1">Nevažeći redovi</p>
            <p className="text-2xl font-semibold text-danger">{stats.invalidRows}</p>
          </div>
        </div>
      </div>

      {/* Preview table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-shellBg">
            <tr className="border-b border-borderSoft">
              <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">
                Red
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">
                Datum
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">
                Aviokompanija
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">
                Ruta
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">
                Tip aviona
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">
                Registracija
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-textMuted">
                  Nema podataka za prikaz
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.row}
                  className={`border-b border-borderSoft ${
                    row.errors.length > 0 ? 'bg-red-50' : 'hover:bg-shellBg'
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-textMain">{row.row}</td>
                  <td className="px-4 py-3 text-sm">
                    {row.data.date
                      ? formatDateDisplay(row.data.date)
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.data.airline || '-'}</td>
                  <td className="px-4 py-3 text-sm">{row.data.route || '-'}</td>
                  <td className="px-4 py-3 text-sm">{row.data.aircraftType || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {row.data.registration || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {row.errors.length > 0 ? (
                      <div className="group relative">
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 cursor-help">
                          {row.errors.length} greška
                        </span>
                        <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 w-64 bg-white rounded-xl shadow-soft border border-borderSoft p-3">
                          <p className="text-xs font-semibold text-textMain mb-2">
                            Greške:
                          </p>
                          <ul className="text-xs text-red-700 space-y-1">
                            {row.errors.map((error, idx) => (
                              <li key={idx}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Validan
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-borderSoft">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-textMuted">
            {stats.invalidRows > 0 && (
              <span className="text-danger">
                Upozorenje: {stats.invalidRows} red(ova) će biti preskočeno zbog grešaka
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
              Otkaži
            </Button>
            <Button
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg disabled:opacity-50"
              onClick={onConfirm}
              disabled={isProcessing || stats.validRows === 0}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importujem...
                </span>
              ) : (
                `Importuj ${stats.validRows} redova`
              )}
            </Button>
          </div>
        </div>

        {/* Warning message during import */}
        {isProcessing && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Import u toku
                </p>
                <p className="text-sm text-amber-700">
                  Molimo ne zatvarajte ovu stranicu dok se import ne završi. Proces može potrajati nekoliko minuta zavisno od broja letova.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
