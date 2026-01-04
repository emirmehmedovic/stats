import { useEffect, useMemo, useState } from 'react';
import { X, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DelayCode = {
  id: string;
  code: string;
  description: string;
};

type Airline = {
  id: string;
  name: string;
  icaoCode: string;
};

type AirlineDelayCode = {
  id: string;
  airline: Airline;
  delayCode: DelayCode;
  isActive: boolean;
};

type DelayCodeAirlinesModalProps = {
  delayCode: DelayCode | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function DelayCodeAirlinesModal({
  delayCode,
  isOpen,
  onClose,
  onSuccess,
}: DelayCodeAirlinesModalProps) {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [links, setLinks] = useState<AirlineDelayCode[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !delayCode) return;
    setSearch('');
    setError('');
    fetchData(delayCode.id);
  }, [isOpen, delayCode]);

  const fetchAirlines = async () => {
    const all: Airline[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        page: String(page),
        limit: '100',
      });
      const res = await fetch(`/api/airlines?${params.toString()}`);
      if (!res.ok) break;
      const data = await res.json();
      all.push(...(data.data || []));
      hasMore = !!data.pagination?.hasMore;
      page += 1;
    }
    return all;
  };

  const fetchLinks = async (delayCodeId: string) => {
    const params = new URLSearchParams({ delayCodeId });
    const res = await fetch(`/api/airline-delay-codes?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []) as AirlineDelayCode[];
  };

  const fetchData = async (delayCodeId: string) => {
    setIsLoading(true);
    try {
      const [allAirlines, delayLinks] = await Promise.all([
        fetchAirlines(),
        fetchLinks(delayCodeId),
      ]);
      setAirlines(allAirlines);
      setLinks(delayLinks);
      setSelected(
        new Set(
          delayLinks.filter((l) => l.isActive).map((l) => l.airline.id)
        )
      );
    } catch (err) {
      console.error(err);
      setError('Greška pri učitavanju aviokompanija');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAirlines = useMemo(() => {
    if (!search) return airlines;
    const term = search.toLowerCase();
    return airlines.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.icaoCode.toLowerCase().includes(term)
    );
  }, [airlines, search]);

  const toggleAirline = (airlineId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(airlineId)) {
        next.delete(airlineId);
      } else {
        next.add(airlineId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!delayCode) return;
    setIsSaving(true);
    setError('');

    try {
      const existing = new Map(
        links.map((l) => [l.airline.id, l])
      );

      const toCreate = Array.from(selected).filter((id) => !existing.has(id));
      const toDelete = Array.from(existing.keys()).filter((id) => !selected.has(id));

      await Promise.all([
        ...toCreate.map((airlineId) =>
          fetch('/api/airline-delay-codes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              airlineId,
              delayCodeId: delayCode.id,
              isActive: true,
            }),
          })
        ),
        ...toDelete.map((airlineId) =>
          fetch(`/api/airline-delay-codes/${existing.get(airlineId)!.id}`, {
            method: 'DELETE',
          })
        ),
      ]);

      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Greška pri snimanju veza');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !delayCode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Poveži aviokompanije
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {delayCode.code} – {delayCode.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Pretraga aviokompanije (naziv ili ICAO)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-500">Učitavam...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAirlines.map((airline) => (
                <label
                  key={airline.id}
                  className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 text-sm cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(airline.id)}
                    onChange={() => toggleAirline(airline.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="font-medium text-slate-800">
                    {airline.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({airline.icaoCode})
                  </span>
                </label>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 p-6 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Odustani
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Sačuvaj veze
          </Button>
        </div>
      </div>
    </div>
  );
}
