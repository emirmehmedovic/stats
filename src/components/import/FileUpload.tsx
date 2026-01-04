'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

export function FileUpload({
  onFileSelect,
  acceptedFormats = ['.xlsx', '.xls', '.csv'],
  maxSizeMB = 10,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file type
    const fileName = file.name.toLowerCase();
    const isValid = acceptedFormats.some((format) => fileName.endsWith(format));

    if (!isValid) {
      setError(
        `Nepodržan format. Molimo uploadujte fajl sa ekstenzijom: ${acceptedFormats.join(', ')}`
      );
      return false;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Fajl je prevelik. Maksimalna veličina je ${maxSizeMB}MB`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-3xl p-8 text-center transition-all
          ${
            isDragging
              ? 'border-brand-primary bg-brand-primarySoft'
              : 'border-borderSoft bg-white hover:border-brand-primary hover:bg-shellBg'
          }
        `}
      >
        {/* Upload icon */}
        <div className="flex justify-center mb-4">
          <svg
            className={`w-16 h-16 ${isDragging ? 'text-brand-primary' : 'text-textMuted'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {/* Instructions */}
        <div className="mb-4">
          <p className="text-lg font-semibold text-textMain mb-2">
            {isDragging ? 'Ispustite fajl ovdje' : 'Prevucite fajl ovdje'}
          </p>
          <p className="text-sm text-textMuted mb-1">ili</p>
        </div>

        {/* Browse button */}
        <div className="mb-4">
          <label htmlFor="file-input">
            <Button
              type="button"
              className="bg-primary-50 text-primary-800 border border-primary-200 hover:bg-primary-100 cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              Izaberite fajl
            </Button>
          </label>
          <input
            id="file-input"
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        {/* Accepted formats */}
        <p className="text-xs text-textMuted">
          Podržani formati: {acceptedFormats.join(', ')} (max {maxSizeMB}MB)
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
