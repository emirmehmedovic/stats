'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { TicketDetailView } from '@/components/support-tickets/TicketDetailView';
import { MainLayout } from '@/components/layout/MainLayout';
import { Headphones } from 'lucide-react';

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

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  status: any;
  priority: any;
  category: any;
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

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      const response = await fetch(`/api/support-tickets/${ticketId}`);

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Greška pri učitavanju tiketa');
      }

      const result = await response.json();
      setTicket(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  const fetchAdmins = useCallback(async () => {
    try {
      const response = await fetch('/api/support-tickets/admins');
      if (response.ok) {
        const result = await response.json();
        setAdmins(result.data || []);
      }
    } catch (err) {
      // Ignore error - admins list is optional for non-admins
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const admin = role === 'ADMIN';
    setIsAdmin(admin);

    fetchTicket();
    if (admin) {
      fetchAdmins();
    }
  }, [fetchTicket, fetchAdmins]);

  const handleUpdate = () => {
    fetchTicket();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-4 lg:p-8">
          <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
            <p className="text-textMuted">Učitavanje...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-4 lg:p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!ticket) {
    return (
      <MainLayout>
        <div className="p-4 lg:p-8">
          <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
            <p className="text-textMuted">Tiket nije pronađen</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-4 md:p-6 lg:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(139,92,246,0.12),transparent_25%),radial-gradient(circle_at_85%_0%,rgba(168,85,247,0.12),transparent_25%)]"></div>
          <div className="relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 lg:px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] lg:text-xs uppercase tracking-[0.2em] text-slate-200">
                <Headphones className="w-3 h-3" />
                IT Podrška
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold">Detalji tiketa</h1>
              <p className="text-xs lg:text-sm text-slate-200">
                Pregled i komunikacija vezana za vaš zahtjev
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Detail */}
        <TicketDetailView
          ticket={ticket}
          isAdmin={isAdmin}
          admins={admins}
          onUpdate={handleUpdate}
        />
      </div>
    </MainLayout>
  );
}
