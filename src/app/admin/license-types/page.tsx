'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Plus, Edit2, Trash2, ArrowLeft, Search, Filter } from 'lucide-react';

interface LicenseType {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  validityPeriodMonths: number | null;
  requiresRenewal: boolean;
  isActive: boolean;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    licenses: number;
  };
}

export default function LicenseTypesPage() {
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingType, setEditingType] = useState<LicenseType | null>(null);

  useEffect(() => {
    fetchLicenseTypes();
  }, []);

  const fetchLicenseTypes = async () => {
    try {
      const res = await fetch('/api/license-types');
      if (res.ok) {
        const data = await res.json();
        setLicenseTypes(data);
      }
    } catch (error) {
      console.error('Error fetching license types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovaj tip licence?')) return;

    try {
      const res = await fetch(`/api/license-types/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchLicenseTypes();
      } else {
        const error = await res.json();
        alert(error.error || 'Greška pri brisanju');
      }
    } catch (error) {
      console.error('Error deleting license type:', error);
      alert('Greška pri brisanju');
    }
  };

  const categories = Array.from(
    new Set(licenseTypes.map(lt => lt.category).filter((cat): cat is string => Boolean(cat)))
  );

  const filteredTypes = licenseTypes.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         type.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || type.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 py-4">
          <Link
            href="/employees"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Nazad na radnike</span>
          </Link>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Page Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-slate-100 rounded-xl">
                  <Shield className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Tipovi licenci</h1>
                  <p className="text-slate-600 text-sm mt-1">
                    Upravljanje tipovima licenci koje se koriste u sistemu
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Dodaj novi tip
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Pretraži po nazivu ili kodu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Sve kategorije</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* License Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTypes.map((type) => (
            <div
              key={type.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900">{type.name}</h3>
                    {!type.isActive && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        Neaktivno
                      </span>
                    )}
                  </div>
                  {type.code && (
                    <p className="text-sm text-slate-500 font-mono">{type.code}</p>
                  )}
                </div>
              </div>

              {type.category && (
                <div className="mb-3">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    {type.category}
                  </span>
                </div>
              )}

              {type.description && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {type.description}
                </p>
              )}

              <div className="space-y-2 mb-4 text-sm">
                {type.validityPeriodMonths && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Period važenja:</span>
                    <span className="font-medium text-slate-900">
                      {type.validityPeriodMonths} mjeseci
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Zahtijeva obnovu:</span>
                  <span className="font-medium text-slate-900">
                    {type.requiresRenewal ? 'Da' : 'Ne'}
                  </span>
                </div>
                {type._count && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Broj licenci:</span>
                    <span className="font-medium text-slate-900">
                      {type._count.licenses}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setEditingType(type)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Uredi
                </button>
                <button
                  onClick={() => handleDelete(type.id)}
                  className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Obriši
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTypes.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nema pronađenih tipova licenci
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || filterCategory !== 'all'
                ? 'Pokušajte promijeniti kriterije pretrage'
                : 'Kliknite na dugme iznad da dodate prvi tip licence'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingType) && (
        <LicenseTypeModal
          licenseType={editingType}
          onClose={() => {
            setShowAddModal(false);
            setEditingType(null);
          }}
          onSave={() => {
            fetchLicenseTypes();
            setShowAddModal(false);
            setEditingType(null);
          }}
        />
      )}
    </div>
  );
}

interface LicenseTypeModalProps {
  licenseType: LicenseType | null;
  onClose: () => void;
  onSave: () => void;
}

function LicenseTypeModal({ licenseType, onClose, onSave }: LicenseTypeModalProps) {
  const [formData, setFormData] = useState({
    name: licenseType?.name || '',
    code: licenseType?.code || '',
    description: licenseType?.description || '',
    validityPeriodMonths: licenseType?.validityPeriodMonths || '',
    requiresRenewal: licenseType?.requiresRenewal ?? true,
    isActive: licenseType?.isActive ?? true,
    category: licenseType?.category || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = licenseType
        ? `/api/license-types/${licenseType.id}`
        : '/api/license-types';

      const method = licenseType ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          validityPeriodMonths: formData.validityPeriodMonths
            ? parseInt(formData.validityPeriodMonths as string)
            : null,
        }),
      });

      if (res.ok) {
        onSave();
      } else {
        const error = await res.json();
        alert(error.error || 'Greška pri čuvanju');
      }
    } catch (error) {
      console.error('Error saving license type:', error);
      alert('Greška pri čuvanju');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {licenseType ? 'Uredi tip licence' : 'Dodaj novi tip licence'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Naziv <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="npr. AVSEC Inspector"
              />
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Kod
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="npr. AVSEC"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Kategorija
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="npr. Safety, Security, Operations"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Opis
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Dodatne informacije o tipu licence"
              />
            </div>

            {/* Validity Period */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Period važenja (mjeseci)
              </label>
              <input
                type="number"
                value={formData.validityPeriodMonths}
                onChange={(e) => setFormData({ ...formData, validityPeriodMonths: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="npr. 12, 24, 36"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.requiresRenewal}
                  onChange={(e) => setFormData({ ...formData, requiresRenewal: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Zahtijeva obnovu
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Aktivan
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
