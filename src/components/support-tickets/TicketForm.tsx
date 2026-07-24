'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TicketPriority, TicketCategory, TicketLocation, TicketSystem } from '@prisma/client';
import {
  Upload, X, FileText, Image as ImageIcon, User, Calendar, Clock,
  MapPin, Monitor, Plane, AlertCircle, Tag, ChevronRight, CheckCircle2
} from 'lucide-react';

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'LOW', label: 'Nizak' },
  { value: 'MEDIUM', label: 'Srednji' },
  { value: 'HIGH', label: 'Visok' },
  { value: 'URGENT', label: 'Hitan' },
];

const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: 'HARDWARE', label: 'Hardver' },
  { value: 'SOFTWARE', label: 'Softver' },
  { value: 'NETWORK', label: 'Mreža' },
  { value: 'ACCESS', label: 'Pristup' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PRINTER', label: 'Štampač' },
  { value: 'OTHER', label: 'Ostalo' },
];

const LOCATION_OPTIONS: { value: TicketLocation; label: string; group: string }[] = [
  { value: 'CHECKIN_1', label: 'Check-in 1', group: 'Check-in šalteri' },
  { value: 'CHECKIN_2', label: 'Check-in 2', group: 'Check-in šalteri' },
  { value: 'CHECKIN_3', label: 'Check-in 3', group: 'Check-in šalteri' },
  { value: 'CHECKIN_4', label: 'Check-in 4', group: 'Check-in šalteri' },
  { value: 'CHECKIN_5', label: 'Check-in 5', group: 'Check-in šalteri' },
  { value: 'CHECKIN_6', label: 'Check-in 6', group: 'Check-in šalteri' },
  { value: 'CHECKIN_7', label: 'Check-in 7', group: 'Check-in šalteri' },
  { value: 'CHECKIN_8', label: 'Check-in 8', group: 'Check-in šalteri' },
  { value: 'BOARDING_1', label: 'Boarding 1', group: 'Boarding šalteri' },
  { value: 'BOARDING_2', label: 'Boarding 2', group: 'Boarding šalteri' },
  { value: 'BOARDING_3', label: 'Boarding 3', group: 'Boarding šalteri' },
  { value: 'BOARDING_4', label: 'Boarding 4', group: 'Boarding šalteri' },
  { value: 'OFFICE_NAPLATE', label: 'Kancelarija - Naplate', group: 'Kancelarije' },
  { value: 'OFFICE_INFO', label: 'Kancelarija - Info', group: 'Kancelarije' },
  { value: 'OTHER', label: 'Ostalo', group: 'Ostalo' },
];

const SYSTEM_OPTIONS: { value: TicketSystem; label: string }[] = [
  { value: 'GONOW', label: 'GoNow' },
  { value: 'DCS_CRANE', label: 'DCS Crane' },
  { value: 'NIKO', label: 'NIKO' },
  { value: 'PRINTER', label: 'Printer' },
  { value: 'OTHER', label: 'Ostalo' },
];

interface FlightOption {
  id: string;
  label: string;
  flightNumbers: string;
  route: string;
  airline: {
    id: string;
    name: string;
    icaoCode: string;
  };
}

interface SelectedFile {
  file: File;
  preview?: string;
}

export function TicketForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [loadingFlights, setLoadingFlights] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TicketPriority,
    category: 'OTHER' as TicketCategory,
    reporterName: '',
    incidentDate: '',
    incidentTime: '',
    location: '' as TicketLocation | '',
    system: '' as TicketSystem | '',
    flightId: '',
  });

  useEffect(() => {
    if (!formData.incidentDate) {
      setFlights([]);
      return;
    }

    const fetchFlights = async () => {
      setLoadingFlights(true);
      try {
        const response = await fetch(`/api/support-tickets/flights-by-date?date=${formData.incidentDate}`);
        if (response.ok) {
          const result = await response.json();
          setFlights(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching flights:', err);
      } finally {
        setLoadingFlights(false);
      }
    };

    fetchFlights();
  }, [formData.incidentDate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: SelectedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Nedozvoljen tip fajla. Dozvoljeni: JPEG, PNG, GIF, WebP, PDF');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Fajl je prevelik. Maksimalna veličina je 10MB');
        continue;
      }

      const selectedFile: SelectedFile = { file };
      if (file.type.startsWith('image/')) {
        selectedFile.preview = URL.createObjectURL(file);
      }
      newFiles.push(selectedFile);
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let incidentDateTime = null;
      if (formData.incidentDate) {
        const dateStr = formData.incidentDate;
        const timeStr = formData.incidentTime || '00:00';
        incidentDateTime = new Date(`${dateStr}T${timeStr}`);
      }

      const ticketData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        reporterName: formData.reporterName || null,
        incidentDate: incidentDateTime,
        location: formData.location || null,
        system: formData.system || null,
        flightId: formData.flightId || null,
      };

      const response = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Greška pri kreiranju tiketa');
      }

      const ticketId = result.data.id;

      for (const selectedFile of selectedFiles) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', selectedFile.file);

        await fetch(`/api/support-tickets/${ticketId}/attachments`, {
          method: 'POST',
          body: formDataUpload,
        });
      }

      router.push(`/support-tickets/${ticketId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri kreiranju tiketa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    return FileText;
  };

  const locationGroups = LOCATION_OPTIONS.reduce((acc, loc) => {
    if (!acc[loc.group]) acc[loc.group] = [];
    acc[loc.group].push(loc);
    return acc;
  }, {} as Record<string, typeof LOCATION_OPTIONS>);

  const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow";
  const selectClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-shadow";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Section: Reporter */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <User className="w-4 h-4 text-slate-500" />
          <h3 className="font-medium text-slate-900 text-sm">Prijavitelj</h3>
        </div>
        <div>
          <label htmlFor="reporterName" className={labelClass}>
            Ime i prezime
          </label>
          <input
            id="reporterName"
            type="text"
            maxLength={100}
            placeholder="Vaše ime i prezime"
            value={formData.reporterName}
            onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      {/* Section: Incident Details */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Calendar className="w-4 h-4 text-slate-500" />
          <h3 className="font-medium text-slate-900 text-sm">Detalji incidenta</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="incidentDate" className={labelClass}>
              Datum
            </label>
            <input
              id="incidentDate"
              type="date"
              value={formData.incidentDate}
              onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value, flightId: '' })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="incidentTime" className={labelClass}>
              Vrijeme
            </label>
            <input
              id="incidentTime"
              type="time"
              value={formData.incidentTime}
              onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="location" className={labelClass}>
              Lokacija
            </label>
            <select
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value as TicketLocation })}
              className={selectClass}
            >
              <option value="">Odaberite lokaciju</option>
              {Object.entries(locationGroups).map(([group, locations]) => (
                <optgroup key={group} label={group}>
                  {locations.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="system" className={labelClass}>
              Sistem
            </label>
            <select
              id="system"
              value={formData.system}
              onChange={(e) => setFormData({ ...formData, system: e.target.value as TicketSystem })}
              className={selectClass}
            >
              <option value="">Odaberite sistem</option>
              {SYSTEM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.incidentDate && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <label htmlFor="flightId" className={labelClass}>
              Povezani let (opciono)
            </label>
            <select
              id="flightId"
              value={formData.flightId}
              onChange={(e) => setFormData({ ...formData, flightId: e.target.value })}
              disabled={loadingFlights}
              className={`${selectClass} disabled:bg-slate-50 disabled:text-slate-400`}
            >
              <option value="">
                {loadingFlights ? 'Učitavanje letova...' : flights.length === 0 ? 'Nema letova za odabrani datum' : 'Odaberite let'}
              </option>
              {flights.map((flight) => (
                <option key={flight.id} value={flight.id}>
                  {flight.label}
                </option>
              ))}
            </select>
            {flights.length > 0 && (
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {flights.length} letova pronađeno
              </p>
            )}
          </div>
        )}
      </div>

      {/* Section: Problem Description */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <AlertCircle className="w-4 h-4 text-slate-500" />
          <h3 className="font-medium text-slate-900 text-sm">Opis problema</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className={labelClass}>
              Naslov <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              maxLength={200}
              placeholder="Ukratko opišite problem"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Detaljan opis <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              required
              maxLength={5000}
              rows={5}
              placeholder="Opišite problem detaljno..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none transition-shadow"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">
              {formData.description.length}/5000
            </p>
          </div>
        </div>
      </div>

      {/* Section: Classification */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Tag className="w-4 h-4 text-slate-500" />
          <h3 className="font-medium text-slate-900 text-sm">Klasifikacija</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="priority" className={labelClass}>
              Prioritet
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
              className={selectClass}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className={labelClass}>
              Kategorija
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
              className={selectClass}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section: Attachments */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Upload className="w-4 h-4 text-slate-500" />
          <h3 className="font-medium text-slate-900 text-sm">Prilozi (opciono)</h3>
        </div>

        <div
          className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-slate-300 transition-colors cursor-pointer bg-slate-50/50"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-600 mb-1">
            Kliknite za dodavanje fajlova
          </p>
          <p className="text-xs text-slate-400">
            JPEG, PNG, GIF, WebP, PDF (max 10MB)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {selectedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {selectedFiles.map((selectedFile, index) => {
              const FileIcon = getFileIcon(selectedFile.file.type);
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  {selectedFile.preview ? (
                    <img
                      src={selectedFile.preview}
                      alt={selectedFile.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center">
                      <FileIcon className="w-5 h-5 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {selectedFile.file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(selectedFile.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="h-10 px-5"
        >
          Odustani
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 px-6 bg-slate-900 hover:bg-slate-800"
        >
          {isSubmitting ? 'Kreiranje...' : 'Kreiraj tiket'}
        </Button>
      </div>
    </form>
  );
}
