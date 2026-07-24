'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { TicketCategoryBadge } from './TicketCategoryBadge';
import { CommentsSection } from './CommentsSection';
import { TicketStatus, TicketPriority, TicketCategory, TicketLocation, TicketSystem } from '@prisma/client';
import {
  ArrowLeft, User, Calendar, Paperclip, FileText, Image as ImageIcon,
  Trash2, MapPin, Monitor, Plane, Clock, AlertCircle
} from 'lucide-react';

const LOCATION_LABELS: Record<TicketLocation, string> = {
  CHECKIN_1: 'Check-in 1',
  CHECKIN_2: 'Check-in 2',
  CHECKIN_3: 'Check-in 3',
  CHECKIN_4: 'Check-in 4',
  CHECKIN_5: 'Check-in 5',
  CHECKIN_6: 'Check-in 6',
  CHECKIN_7: 'Check-in 7',
  CHECKIN_8: 'Check-in 8',
  BOARDING_1: 'Boarding 1',
  BOARDING_2: 'Boarding 2',
  BOARDING_3: 'Boarding 3',
  BOARDING_4: 'Boarding 4',
  OFFICE_NAPLATE: 'Kancelarija Naplate',
  OFFICE_INFO: 'Kancelarija Info',
  OTHER: 'Ostalo',
};

const SYSTEM_LABELS: Record<TicketSystem, string> = {
  GONOW: 'GoNow',
  DCS_CRANE: 'DCS Crane',
  NIKO: 'NIKO',
  PRINTER: 'Printer',
  OTHER: 'Ostalo',
};

interface TicketUser {
  id: string;
  name: string | null;
  email: string;
  role?: string;
}

interface TicketAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface TicketComment {
  id: string;
  content: string;
  isInternal: boolean;
  author: TicketUser;
  attachments: TicketAttachment[];
  createdAt: string;
}

interface FlightInfo {
  id: string;
  route: string;
  arrivalFlightNumber: string | null;
  departureFlightNumber: string | null;
  airline?: {
    name: string;
    icaoCode: string;
  };
}

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  location?: TicketLocation | null;
  system?: TicketSystem | null;
  reporterName?: string | null;
  incidentDate?: string | null;
  flight?: FlightInfo | null;
  submittedBy: TicketUser;
  assignedTo: TicketUser | null;
  comments: TicketComment[];
  attachments: TicketAttachment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
}

interface TicketDetailViewProps {
  ticket: TicketDetail;
  isAdmin: boolean;
  admins?: AdminUser[];
  onUpdate?: () => void;
}

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'OPEN', label: 'Otvoren' },
  { value: 'IN_PROGRESS', label: 'U obradi' },
  { value: 'RESOLVED', label: 'Riješen' },
  { value: 'CLOSED', label: 'Zatvoren' },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'LOW', label: 'Nizak' },
  { value: 'MEDIUM', label: 'Srednji' },
  { value: 'HIGH', label: 'Visok' },
  { value: 'URGENT', label: 'Hitan' },
];

export function TicketDetailView({ ticket, isAdmin, admins = [], onUpdate }: TicketDetailViewProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('bs-BA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('bs-BA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const response = await fetch(`/api/support-tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Greška pri ažuriranju');
      }
      onUpdate?.();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Greška pri ažuriranju');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const response = await fetch(`/api/support-tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Greška pri ažuriranju');
      }
      onUpdate?.();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Greška pri ažuriranju');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssigneeChange = async (assignedToId: string | null) => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const response = await fetch(`/api/support-tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Greška pri ažuriranju');
      }
      onUpdate?.();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Greška pri ažuriranju');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Da li ste sigurni da želite obrisati ovaj tiket?')) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/support-tickets/${ticket.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Greška pri brisanju');
      }
      router.push('/support-tickets');
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Greška pri brisanju');
      setIsUpdating(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    return FileText;
  };

  const selectClass = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/support-tickets')}
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Nazad na listu
        </Button>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isUpdating}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Obriši
          </Button>
        )}
      </div>

      {updateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{updateError}</p>
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Ticket details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and description */}
          <div className="border border-slate-200 rounded-xl bg-white p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <TicketStatusBadge status={ticket.status} size="md" />
              <TicketPriorityBadge priority={ticket.priority} size="md" />
              <TicketCategoryBadge category={ticket.category} size="md" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-4">{ticket.title}</h1>
            <div className="prose prose-sm prose-slate max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* Incident Details */}
          {(ticket.location || ticket.system || ticket.incidentDate || ticket.flight) && (
            <div className="border border-slate-200 rounded-xl bg-white p-6">
              <h2 className="text-sm font-medium text-slate-900 mb-4">Detalji incidenta</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ticket.location && (
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs">Lokacija</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{LOCATION_LABELS[ticket.location]}</p>
                  </div>
                )}
                {ticket.system && (
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Monitor className="w-3.5 h-3.5" />
                      <span className="text-xs">Sistem</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{SYSTEM_LABELS[ticket.system]}</p>
                  </div>
                )}
                {ticket.incidentDate && (
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">Datum/vrijeme incidenta</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{formatDate(ticket.incidentDate)}</p>
                  </div>
                )}
                {ticket.flight && (
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Plane className="w-3.5 h-3.5" />
                      <span className="text-xs">Povezani let</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {ticket.flight.airline?.icaoCode} {ticket.flight.arrivalFlightNumber || ticket.flight.departureFlightNumber}
                    </p>
                    <p className="text-xs text-slate-500">{ticket.flight.route}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <div className="border border-slate-200 rounded-xl bg-white p-6">
              <h2 className="text-sm font-medium text-slate-900 mb-4 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-500" />
                Prilozi ({ticket.attachments.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ticket.attachments.map((attachment) => {
                  const FileIcon = getFileIcon(attachment.fileType);
                  const isImage = attachment.fileType.startsWith('image/');
                  return (
                    <a
                      key={attachment.id}
                      href={attachment.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors"
                    >
                      {isImage ? (
                        <img
                          src={attachment.filePath}
                          alt={attachment.fileName}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center">
                          <FileIcon className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(attachment.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments */}
          <CommentsSection
            ticketId={ticket.id}
            comments={ticket.comments}
            isAdmin={isAdmin}
            ticketStatus={ticket.status}
            onCommentAdded={onUpdate}
          />
        </div>

        {/* Right column - Meta info and actions */}
        <div className="space-y-6">
          {/* Ticket info */}
          <div className="border border-slate-200 rounded-xl bg-white p-6">
            <h2 className="text-sm font-medium text-slate-900 mb-4">Informacije</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Prijavio</p>
                  <p className="text-sm font-medium text-slate-900">
                    {ticket.reporterName || ticket.submittedBy.name || ticket.submittedBy.email}
                  </p>
                  {ticket.submittedBy.name && (
                    <p className="text-xs text-slate-500">{ticket.submittedBy.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Kreiran</p>
                  <p className="text-sm text-slate-700">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>
              {ticket.resolvedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Riješen</p>
                    <p className="text-sm text-slate-700">{formatDate(ticket.resolvedAt)}</p>
                  </div>
                </div>
              )}
              {ticket.closedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Zatvoren</p>
                    <p className="text-sm text-slate-700">{formatDate(ticket.closedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="border border-slate-200 rounded-xl bg-white p-6">
              <h2 className="text-sm font-medium text-slate-900 mb-4">Upravljanje</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Status</label>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    disabled={isUpdating}
                    className={selectClass}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Prioritet</label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                    disabled={isUpdating}
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
                  <label className="block text-xs text-slate-500 mb-1.5">Dodijeljen</label>
                  <select
                    value={ticket.assignedTo?.id || ''}
                    onChange={(e) => handleAssigneeChange(e.target.value || null)}
                    disabled={isUpdating}
                    className={selectClass}
                  >
                    <option value="">Nedodijeljen</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name || admin.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
