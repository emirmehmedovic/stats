'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Plus, Edit2, Trash2, ArrowLeft, Search, Users } from 'lucide-react';

interface Sector {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    employees: number;
  };
}

const PRESET_COLORS = [
  { name: 'Plava', value: '#3B82F6' },
  { name: 'Zelena', value: '#10B981' },
  { name: 'Crvena', value: '#EF4444' },
  { name: 'Žuta', value: '#F59E0B' },
  { name: 'Ljubičasta', value: '#8B5CF6' },
  { name: 'Roza', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
];

export default function SectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      const res = await fetch('/api/sectors');
      if (res.ok) {
        const data = await res.json();
        setSectors(data);
      }
    } catch (error) {
      console.error('Error fetching sectors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovaj sektor?')) return;

    try {
      const res = await fetch(`/api/sectors/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchSectors();
      } else {
        const error = await res.json();
        alert(error.error || 'Greška pri brisanju');
      }
    } catch (error) {
      console.error('Error deleting sector:', error);
      alert('Greška pri brisanju');
    }
  };

  const filteredSectors = sectors.filter(sector =>
    sector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sector.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <Building2 className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Sektori</h1>
                  <p className="text-slate-600 text-sm mt-1">
                    Upravljanje sektorima i odjelima organizacije
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Dodaj novi sektor
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
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
        </div>

        {/* Sectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSectors.map((sector) => (
            <div
              key={sector.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Color Header */}
              <div
                className="h-3"
                style={{ backgroundColor: sector.color || '#64748B' }}
              />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {sector.name}
                      </h3>
                      {!sector.isActive && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                          Neaktivno
                        </span>
                      )}
                    </div>
                    {sector.code && (
                      <p className="text-sm text-slate-500 font-mono">
                        {sector.code}
                      </p>
                    )}
                  </div>
                </div>

                {sector.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {sector.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mb-4 text-sm">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    {sector._count?.employees || 0} radnika
                  </span>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setEditingSector(sector)}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Uredi
                  </button>
                  <button
                    onClick={() => handleDelete(sector.id)}
                    className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Obriši
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSectors.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nema pronađenih sektora
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm
                ? 'Pokušajte promijeniti kriterije pretrage'
                : 'Kliknite na dugme iznad da dodate prvi sektor'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingSector) && (
        <SectorModal
          sector={editingSector}
          onClose={() => {
            setShowAddModal(false);
            setEditingSector(null);
          }}
          onSave={() => {
            fetchSectors();
            setShowAddModal(false);
            setEditingSector(null);
          }}
        />
      )}
    </div>
  );
}

interface SectorModalProps {
  sector: Sector | null;
  onClose: () => void;
  onSave: () => void;
}

function SectorModal({ sector, onClose, onSave }: SectorModalProps) {
  const [formData, setFormData] = useState({
    name: sector?.name || '',
    code: sector?.code || '',
    description: sector?.description || '',
    color: sector?.color || '#3B82F6',
    isActive: sector?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = sector ? `/api/sectors/${sector.id}` : '/api/sectors';
      const method = sector ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSave();
      } else {
        const error = await res.json();
        alert(error.error || 'Greška pri čuvanju');
      }
    } catch (error) {
      console.error('Error saving sector:', error);
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
            {sector ? 'Uredi sektor' : 'Dodaj novi sektor'}
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
                placeholder="npr. Operacije"
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
                placeholder="npr. OPS"
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
                placeholder="Dodatne informacije o sektoru"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Boja
              </label>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`h-12 rounded-xl border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-slate-900 scale-105'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-12 rounded-xl border border-slate-300 cursor-pointer"
              />
            </div>

            {/* Active Checkbox */}
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Aktivan sektor
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
