'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/import/FileUpload';
import { ImportPreview } from '@/components/import/ImportPreview';
import { ImportResults } from '@/components/import/ImportResults';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar, FileText, Clock, Upload, MapPin } from 'lucide-react';

type ImportStep = 'upload' | 'preview' | 'results';

interface PreviewData {
  success: boolean;
  preview: boolean;
  data: any[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
  errors: any[];
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: Array<{
    row: number;
    errors: string[];
  }>;
  message: string;
}

export default function ImportSchedulePage() {
  const router = useRouter();
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setIsProcessing(true);

    try {
      // Upload file for preview (dry run)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dryRun', 'true');

      const response = await fetch('/api/flights/import-schedule', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri učitavanju fajla');
      }

      const result: PreviewData = await response.json();
      setPreviewData(result);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Upload file for actual import
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('dryRun', 'false');

      const response = await fetch('/api/flights/import-schedule', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri importu');
      }

      const result: ImportResult = await response.json();
      setImportResult(result);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setPreviewData(null);
    setImportResult(null);
    setError(null);
  };

  const handleClose = () => {
    router.push('/daily-operations');
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-6 md:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_25%)]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Letovi › Import rasporeda</p>
              <h1 className="text-3xl font-bold">Import rasporeda</h1>
              <p className="text-sm text-slate-200">Datum, kompanija, ruta i planirano vrijeme dolaska/odlaska</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs inline-flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary-200" />
                  XLSX / CSV
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-200" />
                  Brzi unos osnovnih podataka
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-start lg:justify-end gap-3">
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => router.push('/flights/import')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Kompletan import
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => router.push('/flights')}
              >
                ← Nazad
              </Button>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl px-5 py-4 border border-primary-100">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-dark-900 mb-1">
                Šta je "Import rasporeda"?
              </h3>
              <p className="text-sm text-dark-700">
                Import rasporeda uvozi samo osnovne informacije: <strong>datum, aviokompaniju, rutu i planirano vrijeme</strong>.
                Ostali podaci (stvarno vrijeme, putnici, cargo) ostaju prazni i mogu se popuniti kasnije preko
                stranice <strong>Dnevne operacije</strong>.
              </p>
              <p className="text-sm text-primary-700 mt-2">
                💡 Ako imaš kompletne podatke (sa putnicima, cargom, itd.), koristi{' '}
                <button
                  onClick={() => router.push('/flights/import')}
                  className="underline font-semibold hover:text-primary-800"
                >
                  Kompletan import
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="bg-white rounded-2xl shadow-sm border border-dark-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'upload'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-50 text-dark-500'
                }`}
              >
                1
              </div>
              <span
                className={`text-sm font-medium ${
                  step === 'upload' ? 'text-dark-900' : 'text-dark-500'
                }`}
              >
                Upload fajla
              </span>
            </div>

            <div className="flex-1 h-px bg-dark-100 mx-4" />

            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'preview'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-50 text-dark-500'
                }`}
              >
                2
              </div>
              <span
                className={`text-sm font-medium ${
                  step === 'preview' ? 'text-dark-900' : 'text-dark-500'
                }`}
              >
                Pregled
              </span>
            </div>

            <div className="flex-1 h-px bg-dark-100 mx-4" />

            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'results'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-50 text-dark-500'
                }`}
              >
                3
              </div>
              <span
                className={`text-sm font-medium ${
                  step === 'results' ? 'text-dark-900' : 'text-dark-500'
                }`}
              >
                Rezultati
              </span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-700 mt-0.5 flex-shrink-0"
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
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700 mb-1">Greška</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="text-xs"
              >
                Zatvori
              </Button>
            </div>
          </div>
        )}

        {/* Step content */}
        {step === 'upload' && (
          <div className="space-y-6">
            <FileUpload onFileSelect={handleFileSelect} />

            {isProcessing && (
              <div className="bg-white rounded-2xl shadow-sm border border-dark-100 px-5 py-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" />
                  <p className="text-sm text-dark-500">Učitavam fajl...</p>
                </div>
              </div>
            )}

            {/* Info section */}
            <div className="space-y-4">
              {/* CSV Format */}
              <div className="bg-blue-50 rounded-2xl px-5 py-4 border border-blue-100">
                <h3 className="text-sm font-semibold text-dark-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  CSV Format (Red letenja)
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-dark-700">
                    Za CSV fajl tipa "red letenja", potrebne su sljedeće kolone:
                  </p>
                  <div className="bg-white rounded-lg p-3 font-mono text-xs text-dark-700 overflow-x-auto">
                    Datum,Tip leta,IATA,Destinacija,Vrijeme,Avio kompanija,IATA kod aviokompanije
                  </div>
                  <p className="text-xs text-dark-600">
                    <strong>Primjer:</strong><br/>
                    2025-11-01,Arrival,MLH,Basel,11:40,Wizz Air,W6<br/>
                    2025-11-01,Departure,MLH,Basel,12:15,Wizz Air,W6
                  </p>
                  <p className="text-xs text-primary-700">
                    💡 Parser će automatski grupisati Arrival i Departure redove istog dana/kompanije/destinacije u jedan let.
                  </p>
                </div>
              </div>

              {/* Excel Format */}
              <div className="bg-green-50 rounded-2xl px-5 py-4 border border-green-100">
                <h3 className="text-sm font-semibold text-dark-900 mb-3">
                  Excel Format (Alternativa)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                      Obavezne kolone:
                    </h4>
                    <ul className="text-sm text-dark-600 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        <span><strong>Datum</strong> - Datum leta</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        <span><strong>Kompanija</strong> - Naziv aviokomanije</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        <span><strong>Ruta</strong> - Odredište (npr. FMM-Memmingen)</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-2">
                      Opcione kolone:
                    </h4>
                    <ul className="text-sm text-dark-600 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-dark-400">•</span>
                        <span>ICAO kod, Tip a/c, Reg</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-dark-400">•</span>
                        <span>Tip OPER (SCHEDULED/CHARTER/MEDEVAC)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-dark-400">•</span>
                        <span>br leta u dol, pl vrijeme dol</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-dark-400">•</span>
                        <span>br leta u odl, pl vrijeme odl</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && previewData && (
          <ImportPreview
            data={previewData.data}
            stats={previewData.stats}
            onConfirm={handleConfirmImport}
            onCancel={handleReset}
            isProcessing={isProcessing}
          />
        )}

        {step === 'results' && importResult && (
          <ImportResults
            success={importResult.success}
            totalRows={importResult.totalRows}
            importedRows={importResult.importedRows}
            skippedRows={importResult.skippedRows}
            errors={importResult.errors}
            message={importResult.message}
            onClose={handleClose}
            onRetry={handleReset}
          />
        )}
      </div>
    </MainLayout>
  );
}
