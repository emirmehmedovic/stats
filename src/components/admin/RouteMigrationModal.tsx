'use client';

import { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type PreviewData = {
  airline: {
    name: string;
    icaoCode: string;
  };
  routes: Array<{
    original: string;
    normalized: string;
    willMigrate: boolean;
    destination: string;
    country: string;
  }>;
  totalRoutes: number;
  mappableRoutes: number;
};

export function RouteMigrationModal({ isOpen, onClose }: Props) {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [preview, setPreview] = useState<PreviewData[]>([]);
  const [migrationResults, setMigrationResults] = useState<any>(null);

  const handlePreview = async () => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch('/api/admin/migrate-routes');
      const result = await response.json();
      
      if (result.success) {
        setPreview(result.preview);
      } else {
        showToast(result.error || 'Greška pri pregledu', 'error');
      }
    } catch (error) {
      showToast('Greška pri pregledu migracije', 'error');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleMigrate = async () => {
    if (!confirm('Da li ste sigurni da želite pokrenuti migraciju ruta? Ovo će kreirati rute za sve Wizz Air aviokompanije.')) {
      return;
    }

    setIsMigrating(true);
    try {
      const response = await fetch('/api/admin/migrate-routes', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        setMigrationResults(result.results);
        showToast('Migracija uspješno završena!', 'success');
      } else {
        showToast(result.error || 'Greška pri migraciji', 'error');
      }
    } catch (error) {
      showToast('Greška pri migraciji ruta', 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Migracija ruta</h2>
              <p className="text-sm text-purple-100">Povezivanje postojećih ruta sa aviokompanijama</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Šta radi ova migracija?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Pronalazi sve Wizz Air aviokompanije (W4, W6)</li>
              <li>• Analizira postojeće rute iz letova</li>
              <li>• Kreira AirlineRoute zapise za poznate rute (MLH, FMM, BSL, DTM, MMX)</li>
              <li>• Normalizuje formate (TZL-MLH-TZL → TZL-MLH)</li>
              <li>• Preskače već postojeće rute</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <Button
              onClick={handlePreview}
              disabled={isLoadingPreview || isMigrating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoadingPreview ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Učitavam...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Pregled migracije
                </>
              )}
            </Button>
            <Button
              onClick={handleMigrate}
              disabled={isMigrating || isLoadingPreview || preview.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migriram...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Pokreni migraciju
                </>
              )}
            </Button>
          </div>

          {/* Preview Results */}
          {preview.length > 0 && !migrationResults && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Pregled ruta za migraciju:</h3>
              {preview.map((item, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{item.airline.name}</h4>
                      <p className="text-sm text-slate-600">ICAO: {item.airline.icaoCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Ukupno ruta: {item.totalRoutes}</p>
                      <p className="text-sm font-semibold text-green-600">
                        Za migraciju: {item.mappableRoutes}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {item.routes.filter(r => r.willMigrate).map((route, ridx) => (
                      <div key={ridx} className="flex items-center justify-between text-sm py-1 px-2 bg-white rounded">
                        <span className="font-mono text-slate-700">{route.original}</span>
                        <span className="text-slate-500">→</span>
                        <span className="font-mono text-blue-600">{route.normalized}</span>
                        <span className="text-slate-600">
                          {route.destination}, {route.country}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Migration Results */}
          {migrationResults && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-green-900 text-lg">Migracija završena!</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">{migrationResults.processed}</p>
                  <p className="text-sm text-slate-600">Obrađeno</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{migrationResults.created}</p>
                  <p className="text-sm text-slate-600">Kreirano</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{migrationResults.skipped}</p>
                  <p className="text-sm text-slate-600">Preskočeno</p>
                </div>
              </div>
              {migrationResults.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <p className="font-semibold text-red-900 mb-2">Greške:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {migrationResults.errors.map((error: string, idx: number) => (
                      <p key={idx} className="text-sm text-red-700">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <Button onClick={onClose} variant="outline" className="w-full">
            Zatvori
          </Button>
        </div>
      </div>
    </div>
  );
}
