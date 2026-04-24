'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Plus, Save, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';

type AccessControlPlace = {
  id: string;
  externalPlaceId: number;
  placeName: string;
};

type PlaceConfiguration = {
  id: string;
  externalPlaceId: number;
  type: 'ENTRY_EXIT' | 'INTERNAL';
  name: string;
  description: string | null;
  isActive: boolean;
};

const typeOptions = [
  { value: 'ENTRY_EXIT', label: 'Ulaz/Izlaz' },
  { value: 'INTERNAL', label: 'Interna lokacija' },
];

export default function AccessControlPlacesPage() {
  const [places, setPlaces] = useState<AccessControlPlace[]>([]);
  const [configs, setConfigs] = useState<PlaceConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [type, setType] = useState<'ENTRY_EXIT' | 'INTERNAL'>('ENTRY_EXIT');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [placesRes, configsRes] = await Promise.all([
        fetch('/api/access-control/places'),
        fetch('/api/place-configurations'),
      ]);

      const placesData = await placesRes.json();
      const configsData = await configsRes.json();

      if (placesData.success) setPlaces(placesData.data);
      if (configsData.success) setConfigs(configsData.data);
    } catch (error) {
      console.error('Failed to load place configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const placeOptions = useMemo(
    () =>
      places.map((place) => ({
        value: place.externalPlaceId.toString(),
        label: `${place.placeName}`,
        subtitle: `ID: ${place.externalPlaceId}`,
      })),
    [places]
  );

  const configPlaceMap = useMemo(() => {
    const map = new Map<number, AccessControlPlace>();
    places.forEach((place) => map.set(place.externalPlaceId, place));
    return map;
  }, [places]);

  const resetForm = () => {
    setSelectedPlaceId('');
    setType('ENTRY_EXIT');
    setName('');
    setDescription('');
    setIsActive(true);
    setEditingId(null);
  };

  const handlePlaceSelect = (value: string) => {
    setSelectedPlaceId(value);
    const place = places.find((p) => p.externalPlaceId.toString() === value);
    if (place && !editingId) {
      setName(place.placeName);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlaceId || !name) {
      alert('Odaberite lokaciju i unesite naziv.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        externalPlaceId: Number(selectedPlaceId),
        type,
        name,
        description,
        isActive,
      };

      const response = await fetch(
        editingId ? `/api/place-configurations/${editingId}` : '/api/place-configurations',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Greška pri snimanju');
        return;
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Failed to save place configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (config: PlaceConfiguration) => {
    setEditingId(config.id);
    setSelectedPlaceId(config.externalPlaceId.toString());
    setType(config.type);
    setName(config.name);
    setDescription(config.description || '');
    setIsActive(config.isActive);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovu konfiguraciju?')) return;
    try {
      const response = await fetch(`/api/place-configurations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Greška pri brisanju');
        return;
      }
      await fetchData();
    } catch (error) {
      console.error('Failed to delete configuration:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="px-4 lg:px-6 py-4">
          <Link
            href="/access-control"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4 text-sm lg:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Nazad na Access Control</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Mapiranje lokacija</h1>
              <p className="text-sm lg:text-base text-slate-600">Konfiguriši koje lokacije su ulaz/izlaz.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-4 lg:py-6 space-y-4 lg:space-y-6">
        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-4 lg:mb-6">
            <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
            <h2 className="text-base lg:text-lg font-semibold text-slate-900">
              {editingId ? 'Uredi konfiguraciju' : 'Dodaj novu konfiguraciju'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Lokacija</label>
              <SearchableSelect
                options={placeOptions}
                value={selectedPlaceId}
                onChange={handlePlaceSelect}
                placeholder="Odaberite lokaciju..."
                searchPlaceholder="Pretraži lokacije..."
                disabled={saving}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Tip</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'ENTRY_EXIT' | 'INTERNAL')}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Naziv</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Naziv lokacije"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Opis</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Opcionalno"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="place-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 border-slate-300 rounded"
              />
              <label htmlFor="place-active" className="text-sm text-slate-700">
                Aktivno
              </label>
            </div>
          </div>

          <div className="mt-4 lg:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:gap-3">
            <Button onClick={handleSubmit} disabled={saving} className="text-sm lg:text-base">
              {editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editingId ? 'Sačuvaj' : 'Dodaj'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm} className="text-sm lg:text-base">
                Otkaži
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base lg:text-lg font-semibold text-slate-900">Konfiguracije</h2>
            <span className="text-xs lg:text-sm text-slate-500">Ukupno: {configs.length}</span>
          </div>

          {configs.length === 0 ? (
            <div className="p-8 lg:p-12 text-center text-sm lg:text-base text-slate-500">Nema konfiguracija.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left">Lokacija</th>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left">Tip</th>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left">Status</th>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left">Akcije</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {configs.map((config) => {
                    const place = configPlaceMap.get(config.externalPlaceId);
                    return (
                      <tr key={config.id} className="hover:bg-slate-50">
                        <td className="px-3 lg:px-6 py-3 lg:py-4">
                          <div className="text-sm lg:text-base font-medium text-slate-900">
                            {config.name}
                          </div>
                          <div className="text-xs lg:text-sm text-slate-500">
                            {place?.placeName || 'Nepoznata lokacija'} • ID: {config.externalPlaceId}
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-slate-700">
                          {config.type === 'ENTRY_EXIT' ? 'Ulaz/Izlaz' : 'Interna'}
                        </td>
                        <td className="px-3 lg:px-6 py-3 lg:py-4">
                          <span className={`px-2 py-0.5 lg:py-1 rounded-full text-xs font-semibold ${
                            config.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {config.isActive ? 'Aktivno' : 'Neaktivno'}
                          </span>
                        </td>
                        <td className="px-3 lg:px-6 py-3 lg:py-4">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 lg:gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(config)} className="text-xs lg:text-sm">
                              <Edit2 className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                              Uredi
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(config.id)} className="text-xs lg:text-sm">
                              <Trash2 className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                              Obriši
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
