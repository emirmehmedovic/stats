'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Download, Trash2, X, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { showToast } from '../ui/toast';

type Document = {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  category: string | null;
  uploadedAt: string;
};

interface DocumentsSectionProps {
  employeeId: string;
}

const DOCUMENT_CATEGORIES = [
  'Ugovor',
  'Certifikat',
  'Lični dokumenti',
  'Medicinski izvještaji',
  'Trening',
  'Ostalo',
];

export function DocumentsSection({ employeeId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [employeeId]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/employees/${employeeId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovaj dokument?')) return;

    try {
      const res = await fetch(`/api/employees/${employeeId}/documents/${docId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Dokument je uspješno obrisan', 'success');
        fetchDocuments();
      } else {
        showToast('Greška pri brisanju dokumenta', 'error');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      showToast('Greška pri brisanju dokumenta', 'error');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bs-BA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    const category = doc.category || 'Ostalo';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Dokumenti ({documents.length})
        </h3>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload dokument
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nema dokumenata</h3>
          <p className="text-slate-600 mb-4">
            Upload-ujte dokumente kao što su ugovori, certifikati ili lični dokumenti.
          </p>
          <Button
            onClick={() => setShowUploadModal(true)}
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload prvi dokument
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocuments).map(([category, docs]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">{category}</h4>
              <div className="grid grid-cols-1 gap-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-slate-900 truncate">{doc.title}</h5>
                          {doc.description && (
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {doc.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>{doc.fileName}</span>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>{formatDate(doc.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <a
                          href={doc.filePath}
                          download
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-slate-600" />
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Obriši"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <UploadDocumentModal
          employeeId={employeeId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
}

interface UploadDocumentModalProps {
  employeeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadDocumentModal({ employeeId, onClose, onSuccess }: UploadDocumentModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('Fajl ne može biti veći od 10MB', 'error');
        return;
      }
      setSelectedFile(file);
      if (!formData.title) {
        setFormData((prev) => ({ ...prev, title: file.name }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      showToast('Molimo izaberite fajl', 'error');
      return;
    }

    setUploading(true);

    try {
      const data = new FormData();
      data.append('file', selectedFile);
      data.append('title', formData.title);
      if (formData.description) data.append('description', formData.description);
      if (formData.category) data.append('category', formData.category);

      const res = await fetch(`/api/employees/${employeeId}/documents`, {
        method: 'POST',
        body: data,
      });

      if (res.ok) {
        showToast('Dokument je uspješno upload-ovan', 'success');
        onSuccess();
      } else {
        const error = await res.json();
        showToast(error.error || 'Greška pri upload-u', 'error');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      showToast('Greška pri upload-u dokumenta', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Upload dokument</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="file">Fajl *</Label>
            <input
              ref={fileInputRef}
              id="file"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              {selectedFile ? (
                <div>
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Kliknite za izbor fajla</p>
                  <p className="text-xs text-slate-500 mt-1">Maksimalno 10MB</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="title">Naziv *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1"
              placeholder="npr. Ugovor o radu"
            />
          </div>

          <div>
            <Label htmlFor="category">Kategorija</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Izaberite kategoriju</option>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="description">Opis</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Dodatne informacije o dokumentu"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={uploading}
            >
              Otkaži
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={uploading || !selectedFile}
            >
              {uploading ? 'Upload-ujem...' : 'Upload'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
