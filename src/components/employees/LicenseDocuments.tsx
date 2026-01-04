'use client';

import { useState, useRef } from 'react';
import { Upload, File, Download, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '../ui/toast';
import { formatDateDisplay } from '@/lib/dates';

type Document = {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
};

type LicenseDocumentsProps = {
  licenseId: string;
  documents: Document[];
  onDocumentsChange: () => void;
};

export function LicenseDocuments({ licenseId, documents, onDocumentsChange }: LicenseDocumentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/licenses/${licenseId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Dokument je uspješno uploadovan!', 'success');
        onDocumentsChange();
        setShowUpload(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        showToast(result.error || 'Greška pri upload-u', 'error');
      }
    } catch (err) {
      showToast('Greška pri upload-u dokumenta', 'error');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Dokument je preuzet!', 'success');
    } catch (err) {
      showToast('Greška pri preuzimanju dokumenta', 'error');
      console.error(err);
    }
  };

  const handleDelete = async (documentId: string, fileName: string) => {
    if (!confirm(`Da li ste sigurni da želite obrisati "${fileName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Dokument je uspješno obrisan!', 'success');
        onDocumentsChange();
      } else {
        showToast(result.error || 'Greška pri brisanju', 'error');
      }
    } catch (err) {
      showToast('Greška pri brisanju dokumenta', 'error');
      console.error(err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <File className="w-5 h-5 text-red-600" />;
    }
    return <File className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-900">Dokumenti ({documents.length})</h4>
        {!showUpload && (
          <Button
            onClick={() => setShowUpload(true)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Upload className="w-3 h-3 mr-1" />
            Upload
          </Button>
        )}
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="flex-1 text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={() => {
                setShowUpload(false);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {isUploading && (
            <p className="text-xs text-slate-500 mt-2">Upload u toku...</p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Dozvoljeni formati: PDF, JPG, PNG (max 10MB)
          </p>
        </div>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <p className="text-sm text-slate-500 italic">Nema uploadovanih dokumenata</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileIcon(doc.fileType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{doc.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(doc.fileSize)} • {formatDateDisplay(doc.uploadedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDownload(doc.id, doc.fileName)}
                  className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                  title="Preuzmi"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => handleDelete(doc.id, doc.fileName)}
                  className="p-1.5 hover:bg-red-100 rounded transition-colors"
                  title="Obriši"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
