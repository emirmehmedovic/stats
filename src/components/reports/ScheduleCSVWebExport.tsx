'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, X } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface ScheduleCSVWebExportProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleCSVWebExport({
  isOpen,
  onClose,
}: ScheduleCSVWebExportProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

  const months = [
    { value: 1, label: 'Januar' },
    { value: 2, label: 'Februar' },
    { value: 3, label: 'Mart' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Maj' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'August' },
    { value: 9, label: 'Septembar' },
    { value: 10, label: 'Oktobar' },
    { value: 11, label: 'Novembar' },
    { value: 12, label: 'Decembar' },
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => currentDate.getFullYear() - 2 + i
  );

  const handleExport = async () => {
    try {
      setIsGenerating(true);

      const url = `/api/flights/export-schedule-web?year=${selectedYear}&month=${selectedMonth}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri generiranju CSV-a');
      }

      // Download the CSV
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const monthName = months.find(m => m.value === selectedMonth)?.label.toLowerCase();
      link.download = `red-letenja-${monthName}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showToast('CSV Web uspješno generiran', 'success');
      onClose();
    } catch (error) {
      console.error('CSV Web export error:', error);
      const message =
        error instanceof Error ? error.message : 'Greška pri generiranju CSV-a';
      showToast(message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-borderSoft bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-textMain">
                Export CSV Web
              </h3>
              <p className="text-sm text-textMuted mt-1">
                Preuzmi raspored za web stranicu
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/80 transition-colors"
              disabled={isGenerating}
            >
              <X className="w-5 h-5 text-textMuted" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Month selector */}
          <div>
            <label className="block text-sm font-semibold text-textMain mb-2">
              Mjesec
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-borderSoft bg-white text-textMain focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              disabled={isGenerating}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year selector */}
          <div>
            <label className="block text-sm font-semibold text-textMain mb-2">
              Godina
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-borderSoft bg-white text-textMain focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              disabled={isGenerating}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Info */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 mb-1">
                  Format CSV Web
                </p>
                <p className="text-xs text-green-800 leading-relaxed">
                  CSV će sadržavati sve letove za izabrani mjesec u formatu za web stranicu.
                  Kolone: Datum, Tip leta, IATA, Destinacija, Vrijeme, Avio kompanija, IATA kod aviokompanije.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-borderSoft bg-shellBg">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1"
            >
              Otkaži
            </Button>
            <Button
              onClick={handleExport}
              disabled={isGenerating}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Generiranje...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileDown className="w-4 h-4" />
                  Preuzmi CSV Web
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
