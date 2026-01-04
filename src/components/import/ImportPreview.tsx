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
      <div className="px-5 py-4 border-t border-borderSoft flex items-center justify-between">
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
            className="bg-brand-primary hover:bg-brand-primary/90 text-white"
            onClick={onConfirm}
            disabled={isProcessing || stats.validRows === 0}
          >
            {isProcessing ? 'Importujem...' : `Importuj ${stats.validRows} redova`}
          </Button>
        </div>
      </div>
    </div>
  );
}
