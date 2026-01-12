'use client';

import { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type PreviewItem = {
  key: string;
  label: string;
  sourceOperation: { code: string; name: string };
  targetOperation: { code: string; name: string };
  targetFlightType: { code: string; name: string };
  totalFlights: number;
  willUpdate: number;
};

type ResultsItem = {
  key: string;
  label: string;
  sourceOperationCode: string;
  targetOperationCode: string;
  targetFlightTypeCode: string;
  totalFlights: number;
  updatedFlights: number;
};

type SkippedMapping = {
  key: string;
  label: string;
  reason: string;
};

export function FlightTypeMigrationModal({ isOpen, onClose }: Props) {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [migrationResults, setMigrationResults] = useState<ResultsItem[] | null>(null);
  const [missingInfo, setMissingInfo] = useState<{ operationTypes?: string[]; flightTypes?: string[] } | null>(null);
  const [skippedMappings, setSkippedMappings] = useState<SkippedMapping[]>([]);

  const handlePreview = async () => {
    setIsLoadingPreview(true);
    setMissingInfo(null);
    setMigrationResults(null);
    setSkippedMappings([]);

    try {
      const response = await fetch('/api/admin/migrate-flight-types');
      const result = await response.json();

      if (result.success) {
        setPreview(result.preview || []);
        setSkippedMappings(result.skippedMappings || []);
      } else {
        setMissingInfo(result.missing || null);
        showToast(result.error || 'Greška pri pregledu migracije', 'error');
      }
    } catch (error) {
      showToast('Greška pri pregledu migracije', 'error');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleMigrate = async () => {
    if (!confirm('Da li ste sigurni da želite migrirati tipove leta?')) {
      return;
    }

    setIsMigrating(true);
    try {
      const response = await fetch('/api/admin/migrate-flight-types', {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        setMigrationResults(result.results || []);
        setSkippedMappings(result.skippedMappings || []);
        showToast('Migracija tipova leta završena!', 'success');
      } else {
        setMissingInfo(result.missing || null);
        showToast(result.error || 'Greška pri migraciji', 'error');
      }
    } catch (error) {
      showToast('Greška pri migraciji tipova leta', 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Migracija tipova leta</h2>
              <p className="text-sm text-slate-200">Usklađivanje tipova operacije i tipova leta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Šta radi ova migracija?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Zadržava postojeći SCHEDULED tip operacije</li>
              <li>• Dodaje INTERNATIONAL SCHEDULED kao tip leta za redovne letove</li>
              <li>• Premješta CHARTER/MEDEVAC/GENERAL_AVIATION u INTERNATIONAL NON-SCHEDULED</li>
              <li>• Premješta MILITARY u ALL OTHER MOVEMENT</li>
              <li>• Premješta DIVERTED u INTERNATIONAL NON-SCHEDULED</li>
              <li>• Postavlja odgovarajući tip leta za svaku grupu</li>
            </ul>
          </div>

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
              className="bg-emerald-600 hover:bg-emerald-700"
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

          {missingInfo && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-amber-900">Nedostaju konfiguracije</h4>
              </div>
              {missingInfo.operationTypes?.length ? (
                <p className="text-sm text-amber-800">
                  Tipovi operacije: {missingInfo.operationTypes.join(', ')}
                </p>
              ) : null}
              {missingInfo.flightTypes?.length ? (
                <p className="text-sm text-amber-800">
                  Tipovi leta: {missingInfo.flightTypes.join(', ')}
                </p>
              ) : null}
            </div>
          )}

          {skippedMappings.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-slate-500" />
                <h4 className="font-semibold text-slate-700">Preskočene mapiranja</h4>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                {skippedMappings.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-3 bg-white rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="font-semibold text-slate-800">{item.label}</p>
                      <p>{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.length > 0 && !migrationResults && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Pregled za migraciju</h3>
              {preview.map((item) => (
                <div key={item.key} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{item.label}</h4>
                      <p className="text-xs text-slate-600">
                        {item.sourceOperation.code} → {item.targetOperation.code} / {item.targetFlightType.code}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Ukupno: {item.totalFlights}</p>
                      <p className="text-sm font-semibold text-emerald-600">
                        Za ažuriranje: {item.willUpdate}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs text-slate-600 mt-3">
                    <div className="bg-white rounded-lg p-2 border border-slate-200">
                      <p className="font-semibold text-slate-700">Izvor</p>
                      <p>{item.sourceOperation.name}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-slate-200">
                      <p className="font-semibold text-slate-700">Nova operacija</p>
                      <p>{item.targetOperation.name}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-slate-200">
                      <p className="font-semibold text-slate-700">Tip leta</p>
                      <p>{item.targetFlightType.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {migrationResults && (
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900">Migracija završena</h3>
                </div>
                <p className="text-sm text-emerald-800">
                  Ukupno ažurirano: {migrationResults.reduce((sum, item) => sum + item.updatedFlights, 0)}
                </p>
              </div>
              {migrationResults.map((item) => (
                <div key={item.key} className="bg-white rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{item.label}</h4>
                      <p className="text-xs text-slate-600">
                        {item.sourceOperationCode} → {item.targetOperationCode} / {item.targetFlightTypeCode}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p>Ukupno: {item.totalFlights}</p>
                      <p className="font-semibold text-emerald-600">Ažurirano: {item.updatedFlights}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <Button onClick={onClose} variant="outline" className="w-full">
            Zatvori
          </Button>
        </div>
      </div>
    </div>
  );
}
