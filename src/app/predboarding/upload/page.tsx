'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, FileText, AlertCircle, CheckCircle2, Plane, ArrowLeft, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatDateStringWithDay, formatTimeDisplay } from '@/lib/dates';

interface Flight {
  id: string;
  date: string;
  departureFlightNumber: string | null;
  route: string;
  departureScheduledTime: string | null;
  airline: {
    id: string;
    name: string;
    icaoCode: string;
    logoUrl: string | null;
  };
  aircraftType: {
    id: string;
    model: string;
  } | null;
}

function UploadManifestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flightId = searchParams?.get('flightId');

  const [flight, setFlight] = useState<Flight | null>(null);
  const [isLoadingFlight, setIsLoadingFlight] = useState(true);
  const [flightError, setFlightError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (!flightId) {
      setFlightError('FlightId nije specificiran');
      setIsLoadingFlight(false);
      return;
    }

    fetchFlight();
  }, [flightId]);

  const fetchFlight = async () => {
    if (!flightId) return;

    setIsLoadingFlight(true);
    setFlightError(null);

    try {
      const response = await fetch(`/api/flights/${flightId}`);

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Let ne postoji');
      }

      const result = await response.json();
      setFlight(result.data);
    } catch (err) {
      setFlightError(err instanceof Error ? err.message : 'Greška pri učitavanju leta');
    } finally {
      setIsLoadingFlight(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    setUploadSuccess(false);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.txt')) {
      setUploadError('Samo .txt fajlovi su dozvoljeni');
      setSelectedFile(null);
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Fajl mora biti manji od 5MB');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !flightId) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('flightId', flightId);

      const response = await fetch('/api/predboarding/upload-manifest', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Greška pri uploadu manifesta');
      }

      setUploadSuccess(true);

      // Redirect to boarding interface after 1 second
      setTimeout(() => {
        router.push(`/predboarding/${result.data.id}`);
      }, 1000);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Greška pri uploadu');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoadingFlight) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
              <p className="text-dark-500">Učitavam let...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (flightError || !flight) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700">{flightError || 'Let nije pronađen'}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/predboarding')}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
          >
            Nazad na pregled
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/predboarding')}
            className="p-3 rounded-xl bg-dark-100 text-dark-600 hover:bg-dark-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-dark-900">Upload manifesta</h1>
            <p className="text-dark-500 mt-1">Uploadujte manifest putnika za boarding</p>
          </div>
        </div>

        {/* Flight Info Card */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-6 text-white shadow-soft-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-8 -mb-8"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                {flight.airline.logoUrl ? (
                  <img
                    src={flight.airline.logoUrl}
                    alt={flight.airline.name}
                    className="w-16 h-16 rounded-xl object-contain bg-white p-2"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white/10 text-white font-bold flex items-center justify-center text-lg backdrop-blur-md">
                    {flight.airline.icaoCode}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{flight.airline.name}</h2>
                  <p className="text-dark-300">{flight.airline.icaoCode}</p>
                </div>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <Plane className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {flight.departureFlightNumber && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-xs uppercase tracking-wide text-dark-200 font-semibold mb-1">Broj leta</p>
                  <p className="text-lg font-bold text-white">{flight.departureFlightNumber}</p>
                </div>
              )}
              <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${!flight.departureFlightNumber ? 'md:col-span-2' : ''}`}>
                <p className="text-xs uppercase tracking-wide text-dark-200 font-semibold mb-1">Ruta</p>
                <p className="text-lg font-bold text-primary-200">{flight.route}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs uppercase tracking-wide text-dark-200 font-semibold mb-1">Polazak</p>
                <p className="text-lg font-bold text-blue-200">
                  {flight.departureScheduledTime ? formatTimeDisplay(flight.departureScheduledTime) : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs uppercase tracking-wide text-dark-200 font-semibold mb-1">Avion</p>
                <p className="text-sm font-bold text-indigo-200">{flight.aircraftType?.model || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-dark-300">
                {formatDateStringWithDay(flight.date)}
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-3xl p-8 shadow-soft">
          <h3 className="text-xl font-bold text-dark-900 mb-6">Izaberite manifest fajl</h3>

          {/* File Input */}
          <div className="mb-6">
            <label
              htmlFor="manifest-file"
              className="block w-full p-8 border-2 border-dashed border-dark-200 rounded-2xl hover:border-primary-400 hover:bg-primary-50/50 transition-all cursor-pointer group"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {selectedFile ? (
                    <FileText className="w-8 h-8" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>
                {selectedFile ? (
                  <div>
                    <p className="text-lg font-semibold text-dark-900 mb-1">{selectedFile.name}</p>
                    <p className="text-sm text-dark-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-dark-900 mb-1">
                      Kliknite da izaberete fajl
                    </p>
                    <p className="text-sm text-dark-500">
                      Samo .txt fajlovi, maksimalno 5MB
                    </p>
                  </div>
                )}
              </div>
            </label>
            <input
              id="manifest-file"
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">
                  Manifest uspješno uploadovan! Preusmjeravanje...
                </p>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || uploadSuccess}
            className="w-full py-4 px-6 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:bg-dark-200 disabled:text-dark-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploadujem i parsiram manifest...
              </>
            ) : uploadSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Uspješno uploadovano
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload manifest
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Informacije o manifest fajlu:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Format: .txt fajl sa liste putnika</li>
              <li>• Maksimalna veličina: 5MB</li>
              <li>• Fajl će biti automatski parsiran nakon uploada</li>
              <li>• Nakon parsiranja, bićete preusmjereni na boarding interfejs</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function UploadManifestPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
              <p className="text-dark-500">Učitavam...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    }>
      <UploadManifestContent />
    </Suspense>
  );
}
