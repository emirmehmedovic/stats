'use client';

import { useState, Fragment } from 'react';
import { FileUpload } from '@/components/import/FileUpload';
import { ImportPreview } from '@/components/import/ImportPreview';
import { ImportResults } from '@/components/import/ImportResults';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar, Upload, FileSpreadsheet } from 'lucide-react';

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

export default function ImportPage() {
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

      const response = await fetch('/api/flights/import', {
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

      const response = await fetch('/api/flights/import', {
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
    router.push('/flights');
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-6 md:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_25%)]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Letovi › Import</p>
              <h1 className="text-3xl font-bold">Kompletan import letova</h1>
              <p className="text-sm text-slate-200">Raspored, putnici, cargo i prtljag u jednom koraku</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs inline-flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary-200" />
                  Više formata: XLSX, XLS, CSV
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs inline-flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary-200" />
                  Pregled prije importa
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-start lg:justify-end gap-3">
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => router.push('/flights/import-schedule')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Samo raspored
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

        {/* Steps indicator */}
        <div className="bg-white rounded-3xl shadow-soft border border-dark-100 px-5 py-4">
          <div className="flex items-center justify-between">
            {[
              { key: 'upload', label: 'Upload fajla', stepNum: 1 },
              { key: 'preview', label: 'Pregled', stepNum: 2 },
              { key: 'results', label: 'Rezultati', stepNum: 3 },
            ].map((item, idx) => (
              <Fragment key={item.key}>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold shadow-sm ${
                      step === item.key
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {item.stepNum}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step === item.key ? 'text-dark-900' : 'text-dark-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {idx < 2 && <div className="flex-1 h-px bg-dark-100 mx-4" />}
              </Fragment>
            ))}
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
            <div className="bg-white rounded-3xl shadow-soft border border-dark-100 p-6">
              <FileUpload onFileSelect={handleFileSelect} />
            </div>

            {isProcessing && (
              <div className="bg-white rounded-3xl shadow-soft border border-dark-100 px-5 py-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" />
                  <p className="text-sm text-dark-500">Učitavam fajl...</p>
                </div>
              </div>
            )}

            {/* Info section */}
            <div className="bg-blue-50 rounded-3xl px-5 py-4 border border-blue-100 shadow-sm">
              <h3 className="text-sm font-semibold text-dark-900 mb-3">
                Kako funkcioniše import?
              </h3>
              <ol className="text-sm text-dark-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary-700 font-semibold">1.</span>
                  <span>
                    Uploadujte Excel (.xlsx, .xls) ili CSV fajl sa podacima o letovima
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-700 font-semibold">2.</span>
                  <span>
                    Pregledajte prvih 10 redova i statistiku prije importa
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-700 font-semibold">3.</span>
                  <span>
                    Potvrdite import - validni redovi će biti importovani, nevažeći
                    preskočeni
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-700 font-semibold">4.</span>
                  <span>
                    Preuzmite izvještaj o greškama ako su neki redovi preskočeni
                  </span>
                </li>
              </ol>
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
