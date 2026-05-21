'use client';

import { useState, Fragment } from 'react';
import { FileUpload } from '@/components/import/FileUpload';
import { ImportPreview } from '@/components/import/ImportPreview';
import { ImportResults } from '@/components/import/ImportResults';
import { ScheduleChangesExport } from '@/components/import/ScheduleChangesExport';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar, Upload, FileText, Plane } from 'lucide-react';

type ImportStep = 'upload' | 'preview' | 'results';

interface PreviewData {
  success: boolean;
  preview: boolean;
  data: any[];
  stats: {
    totalRules: number;
    totalFlights: number;
    toCreate: number;
    toUpdate: number;
    toCancel: number;
  };
  errors: string[];
  warnings: string[];
}

interface ImportResult {
  success: boolean;
  totalFlights: number;
  created: number;
  updated: number;
  cancelled: number;
  skipped: number;
  errors: Array<{
    flight: string;
    date: string;
    errors: string[];
  }>;
  message: string;
}

export default function ImportScheduleChangesPage() {
  const router = useRouter();
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
  } | null>(null);

  const handleTextPaste = async (text: string) => {
    // Create a virtual file from pasted text
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], 'schedule-changes-paste.txt', { type: 'text/plain' });

    // Use the same handler as file upload
    await handleFileSelect(file);
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setIsProcessing(true);

    try {
      // Upload file for preview (dry run)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dryRun', 'true');

      const response = await fetch('/api/flights/import-schedule-changes', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri učitavanju fajla');
      }

      const result: PreviewData = await response.json();

      // Show errors and warnings
      if (result.warnings.length > 0) {
        console.warn('Parse warnings:', result.warnings);
      }
      if (result.errors.length > 0) {
        console.error('Parse errors:', result.errors);
      }

      setPreviewData(result);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile || !previewData) return;

    setIsProcessing(true);
    setError(null);

    const totalFlights = previewData.stats.totalFlights;

    // Start optimistic progress simulation
    setImportProgress({ current: 0, total: totalFlights, percentage: 0 });

    // Estimate: ~50ms per flight on average
    const estimatedTimePerFlight = 50;
    const totalEstimatedTime = totalFlights * estimatedTimePerFlight;
    const updateInterval = 100; // Update every 100ms
    const incrementPerUpdate = (totalFlights / (totalEstimatedTime / updateInterval));

    const progressInterval = setInterval(() => {
      setImportProgress((prev) => {
        if (!prev) return null;
        const newCurrent = Math.min(prev.current + incrementPerUpdate, totalFlights * 0.95); // Stop at 95%
        const newPercentage = Math.round((newCurrent / totalFlights) * 100);
        return {
          current: Math.floor(newCurrent),
          total: totalFlights,
          percentage: newPercentage,
        };
      });
    }, updateInterval);

    try {
      // Upload file for actual import
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('dryRun', 'false');

      const response = await fetch('/api/flights/import-schedule-changes', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri importu');
      }

      const result: ImportResult = await response.json();

      // Complete progress to 100%
      setImportProgress({
        current: totalFlights,
        total: totalFlights,
        percentage: 100,
      });

      // Small delay to show 100% before moving to results
      setTimeout(() => {
        setImportResult(result);
        setStep('results');
        setImportProgress(null);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
      setImportProgress(null);
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
    router.push('/flights');
  };

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white shadow-soft-xl p-4 md:p-6 lg:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(96,165,250,0.15),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(129,140,248,0.12),transparent_25%)]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] lg:text-xs uppercase tracking-[0.2em] text-blue-200">
                Letovi › Import › Schedule Changes
              </p>
              <h1 className="text-2xl lg:text-3xl font-bold">Import Schedule Changes (TZL)</h1>
              <p className="text-xs lg:text-sm text-blue-100">
                Sezonski raspored letova iz email notifikacija aviokompanija
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 lg:px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] lg:text-xs inline-flex items-center gap-1.5 lg:gap-2">
                  <FileText className="w-3 h-3 lg:w-4 lg:h-4 text-blue-200" />
                  <span className="hidden sm:inline">Format: Schedule Changes TZL (.txt)</span>
                  <span className="sm:hidden">.txt format</span>
                </span>
                <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs items-center gap-2">
                  <Plane className="w-4 h-4 text-blue-200" />
                  UPSERT logika - kreira nove i ažurira postojeće
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-start lg:justify-end gap-2 lg:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs lg:text-sm"
                onClick={() => router.push('/flights/import')}
              >
                <Upload className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" />
                <span className="hidden sm:inline">Kompletan import</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs lg:text-sm"
                onClick={() => router.push('/flights')}
              >
                ← Nazad
              </Button>
            </div>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft border border-dark-100 px-4 lg:px-5 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            {[
              { key: 'upload', label: 'Upload fajla', stepNum: 1 },
              { key: 'preview', label: 'Pregled', stepNum: 2 },
              { key: 'results', label: 'Rezultati', stepNum: 3 },
            ].map((item, idx) => (
              <Fragment key={item.key}>
                <div className="flex items-center gap-1.5 lg:gap-2">
                  <div
                    className={`flex items-center justify-center w-7 h-7 lg:w-9 lg:h-9 rounded-full text-xs lg:text-sm font-semibold shadow-sm ${
                      step === item.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {item.stepNum}
                  </div>
                  <span
                    className={`text-xs lg:text-sm font-medium ${
                      step === item.key ? 'text-dark-900' : 'text-dark-500'
                    } hidden sm:inline`}
                  >
                    {item.label}
                  </span>
                </div>
                {idx < 2 && <div className="flex-1 h-px bg-dark-100 mx-2 lg:mx-4" />}
              </Fragment>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl lg:rounded-2xl px-4 lg:px-5 py-3 lg:py-4">
            <div className="flex items-start gap-2 lg:gap-3">
              <svg
                className="w-4 h-4 lg:w-5 lg:h-5 text-red-700 mt-0.5 flex-shrink-0"
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
                <p className="text-xs lg:text-sm font-semibold text-red-700 mb-1">Greška</p>
                <p className="text-xs lg:text-sm text-red-600">{error}</p>
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

        {/* Warnings (if any) */}
        {previewData && previewData.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl lg:rounded-2xl px-4 lg:px-5 py-3 lg:py-4">
            <div className="flex items-start gap-2 lg:gap-3">
              <svg
                className="w-4 h-4 lg:w-5 lg:h-5 text-amber-700 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-semibold text-amber-700 mb-1">Upozorenja</p>
                <ul className="text-xs lg:text-sm text-amber-600 space-y-1">
                  {previewData.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step content */}
        {step === 'upload' && (
          <div className="space-y-4 lg:space-y-6">
            {/* Option 1: Paste text directly */}
            <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft border border-dark-100 p-4 lg:p-6">
              <h3 className="text-sm font-semibold text-dark-900 mb-3">
                Opcija 1: Paste tekst direktno
              </h3>
              <textarea
                id="schedule-text"
                className="w-full h-64 p-3 border border-dark-200 rounded-xl font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste Schedule Changes tekst ovdje..."
              />
              <Button
                onClick={() => {
                  const textarea = document.getElementById('schedule-text') as HTMLTextAreaElement;
                  const text = textarea?.value;
                  if (text && text.trim()) {
                    handleTextPaste(text);
                  } else {
                    setError('Molimo paste-ujte Schedule Changes tekst');
                  }
                }}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Parsiraj tekst
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-shellBg text-dark-500">ili</span>
              </div>
            </div>

            {/* Option 2: Upload file */}
            <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft border border-dark-100 p-4 lg:p-6">
              <h3 className="text-sm font-semibold text-dark-900 mb-3">
                Opcija 2: Upload .txt fajla
              </h3>
              <FileUpload
                onFileSelect={handleFileSelect}
                acceptedFormats={['.txt']}
                maxSizeMB={10}
              />
            </div>

            {isProcessing && (
              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft border border-dark-100 px-4 lg:px-5 py-6 lg:py-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 lg:h-12 lg:w-12 border-b-2 border-blue-600 mb-4" />
                  <p className="text-xs lg:text-sm text-dark-500">Parsiranje Schedule Changes...</p>
                </div>
              </div>
            )}

            {/* Info section */}
            <div className="bg-blue-50 rounded-2xl lg:rounded-3xl px-4 lg:px-5 py-3 lg:py-4 border border-blue-100 shadow-sm">
              <h3 className="text-xs lg:text-sm font-semibold text-dark-900 mb-2 lg:mb-3">
                Kako funkcioniše Schedule Changes import?
              </h3>
              <ol className="text-xs lg:text-sm text-dark-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 font-semibold">1.</span>
                  <span>
                    Sačuvajte Schedule Changes email kao .txt fajl
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 font-semibold">2.</span>
                  <span>
                    Upload-ujte fajl - sistem će parsirati pravila i generisati letove
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 font-semibold">3.</span>
                  <span>
                    Pregledajte generisane letove i akcije (CREATE/UPDATE/CANCEL)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-700 font-semibold">4.</span>
                  <span>
                    Potvrdite import - postojeći letovi se ažuriraju, novi se kreiraju
                  </span>
                </li>
              </ol>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-dark-500">
                  <strong>Napomena:</strong> Ručno uneseni letovi (dataSource=MANUAL) neće biti ažurirani.
                  Oni predstavljaju vanredne letove i ne spadaju u sezonski raspored.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-shellBg text-dark-500">ili kreirajte novi</span>
              </div>
            </div>

            {/* Export Schedule Changes */}
            <ScheduleChangesExport />
          </div>
        )}

        {step === 'preview' && previewData && (
          <div className="space-y-4 lg:space-y-6 relative">
            {/* Progress Overlay */}
            {isProcessing && importProgress && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 max-w-md w-full mx-4">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                      <svg
                        className="animate-spin h-8 w-8 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-dark-900 mb-2">
                      Import u toku...
                    </h3>
                    <p className="text-sm text-dark-600 mb-4">
                      Molimo ne zatvarajte ovu stranicu
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-dark-700">
                        {importProgress.current} / {importProgress.total} letova
                      </span>
                      <span className="font-bold text-blue-600">
                        {importProgress.percentage}%
                      </span>
                    </div>
                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${importProgress.percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    <p className="text-xs text-center text-dark-500">
                      Procjena: ~{Math.ceil((importProgress.total - importProgress.current) * 0.05)}s preostalo
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-soft border border-dark-100 p-3 lg:p-4">
                <p className="text-[10px] lg:text-xs text-dark-500 uppercase tracking-wider mb-1">
                  Pravila
                </p>
                <p className="text-xl lg:text-2xl font-bold text-dark-900">
                  {previewData.stats.totalRules}
                </p>
              </div>
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-soft border border-dark-100 p-3 lg:p-4">
                <p className="text-[10px] lg:text-xs text-dark-500 uppercase tracking-wider mb-1">
                  Letova
                </p>
                <p className="text-xl lg:text-2xl font-bold text-dark-900">
                  {previewData.stats.totalFlights}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl lg:rounded-2xl shadow-soft border border-green-200 p-3 lg:p-4">
                <p className="text-[10px] lg:text-xs text-green-700 uppercase tracking-wider mb-1">
                  Novi
                </p>
                <p className="text-xl lg:text-2xl font-bold text-green-900">
                  {previewData.stats.toCreate}
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl lg:rounded-2xl shadow-soft border border-blue-200 p-3 lg:p-4">
                <p className="text-[10px] lg:text-xs text-blue-700 uppercase tracking-wider mb-1">
                  Update
                </p>
                <p className="text-xl lg:text-2xl font-bold text-blue-900">
                  {previewData.stats.toUpdate}
                </p>
              </div>
              <div className="bg-red-50 rounded-xl lg:rounded-2xl shadow-soft border border-red-200 p-3 lg:p-4">
                <p className="text-[10px] lg:text-xs text-red-700 uppercase tracking-wider mb-1">
                  Otkazano
                </p>
                <p className="text-xl lg:text-2xl font-bold text-red-900">
                  {previewData.stats.toCancel}
                </p>
              </div>
            </div>

            {/* Preview component */}
            <ImportPreview
              data={previewData.data.map((flight, index) => ({
                row: index + 1,
                data: {
                  date: flight.date,
                  airline: flight.carrier,
                  route: flight.route,
                  arrivalFlightNumber: flight.arrivalFlightNumber,
                  arrivalScheduledTime: flight.arrivalScheduledTime,
                  departureFlightNumber: flight.departureFlightNumber,
                  departureScheduledTime: flight.departureScheduledTime,
                  aircraftType: flight.aircraftType,
                  registration: 'TBA',
                  operationType: 'SCHEDULED',
                },
                errors: [],
              }))}
              stats={{
                totalRows: previewData.stats.totalFlights,
                validRows: previewData.stats.toCreate + previewData.stats.toUpdate + previewData.stats.toCancel,
                invalidRows: 0,
              }}
              onConfirm={handleConfirmImport}
              onCancel={handleReset}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {step === 'results' && importResult && (
          <ImportResults
            success={importResult.success}
            totalRows={importResult.totalFlights}
            importedRows={importResult.created + importResult.updated + importResult.cancelled}
            skippedRows={importResult.skipped}
            errors={importResult.errors.map((e) => ({
              row: 0, // We don't have row numbers for schedule changes
              errors: [`${e.flight} (${e.date}): ${e.errors.join(', ')}`],
            }))}
            message={importResult.message}
            onClose={handleClose}
            onRetry={handleReset}
          />
        )}
      </div>
    </MainLayout>
  );
}
