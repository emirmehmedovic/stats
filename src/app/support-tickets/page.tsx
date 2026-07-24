'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TicketsTable } from '@/components/support-tickets/TicketsTable';
import { TicketFilters, TicketFiltersState } from '@/components/support-tickets/TicketFilters';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { MainLayout } from '@/components/layout/MainLayout';
import { Headphones, Plus, BarChart3, Ticket, FileDown } from 'lucide-react';

interface TicketUser {
  id: string;
  name: string | null;
  email: string;
}

import { TicketStatus, TicketPriority, TicketCategory } from '@prisma/client';

interface TicketComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string | null;
  };
}

interface TicketWithRelations {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  submittedBy: TicketUser;
  assignedTo: TicketUser | null;
  createdAt: string;
  updatedAt: string;
  comments?: TicketComment[];
  _count: {
    comments: number;
    attachments: number;
  };
}

interface TicketsResponse {
  success: boolean;
  data: TicketWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function SupportTicketsPage() {
  const router = useRouter();
  const [data, setData] = useState<TicketsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filters, setFilters] = useState<TicketFiltersState>({
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    // Check if user is admin
    const role = localStorage.getItem('userRole');
    setIsAdmin(role === 'ADMIN');
  }, []);

  const buildFilterParams = () => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);
    if (filters.system) params.append('system', filters.system);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.reporterName) params.append('reporterName', filters.reporterName);
    return params;
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = buildFilterParams();
      const response = await fetch(`/api/support-tickets?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Greška pri učitavanju tiketa');
      }

      const result: TicketsResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const params = buildFilterParams();
      // Remove pagination for export
      params.delete('page');
      params.delete('limit');

      const response = await fetch(`/api/support-tickets/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Greška pri generiranju PDF-a');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      a.download = `it-tiketi-${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri eksportu');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  // Count tickets by status
  const openCount = data?.data.filter((t) => t.status === 'OPEN').length || 0;
  const inProgressCount = data?.data.filter((t) => t.status === 'IN_PROGRESS').length || 0;

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-4 md:p-6 lg:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(139,92,246,0.12),transparent_25%),radial-gradient(circle_at_85%_0%,rgba(168,85,247,0.12),transparent_25%)]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 lg:px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] lg:text-xs uppercase tracking-[0.2em] text-slate-200">
                <Headphones className="w-3 h-3" />
                IT Podrška
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold">IT Support Tiketi</h1>
              <p className="text-xs lg:text-sm text-slate-200">
                {isAdmin ? 'Pregled i upravljanje svim tiketima' : 'Vaši zahtjevi za IT podršku'}
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl bg-white/10 text-[10px] lg:text-xs text-slate-200 border border-white/10">
                  <Ticket className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-purple-200" />
                  <span>Ukupno: {data?.pagination.total || 0}</span>
                </div>
                {isAdmin && (
                  <>
                    <div className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl bg-blue-500/20 text-[10px] lg:text-xs text-blue-200 border border-blue-400/20">
                      <span>Otvoreni: {openCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl bg-amber-500/20 text-[10px] lg:text-xs text-amber-200 border border-amber-400/20">
                      <span>U obradi: {inProgressCount}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-start lg:justify-end gap-2 lg:gap-3">
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex items-center gap-1.5 lg:gap-2 text-xs lg:text-sm"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  <FileDown className="w-4 h-4" />
                  {isExporting ? 'Generiranje...' : 'Eksport PDF'}
                </Button>
              )}
              <Button
                size="sm"
                className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-1.5 lg:gap-2 shadow-lg text-xs lg:text-sm"
                onClick={() => router.push('/support-tickets/new')}
              >
                <Plus className="w-4 h-4" />
                Novi tiket
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: 'Ukupno tiketa',
              value: data?.pagination.total || 0,
              accent: 'from-purple-50 via-white to-purple-100',
              text: 'text-purple-700',
            },
            {
              label: 'Otvoreni',
              value: openCount,
              accent: 'from-blue-50 via-white to-blue-100',
              text: 'text-blue-700',
            },
            {
              label: 'U obradi',
              value: inProgressCount,
              accent: 'from-amber-50 via-white to-amber-100',
              text: 'text-amber-700',
            },
            {
              label: 'Stranica',
              value: `${data?.pagination.page || 1} / ${data?.pagination.totalPages || 1}`,
              accent: 'from-slate-50 via-white to-slate-100',
              text: 'text-slate-700',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-xl lg:rounded-2xl border border-dark-100 bg-white shadow-soft p-4 lg:p-5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-80`}></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] lg:text-xs text-dark-500 font-semibold uppercase tracking-wide mb-1">
                    {card.label}
                  </p>
                  <p className={`text-xl lg:text-2xl font-bold ${card.text}`}>{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-soft">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchTickets()}>
              Pokušaj ponovo
            </Button>
          </div>
        )}

        {/* Filters + Table */}
        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft border border-dark-100 overflow-hidden">
          <div className="p-4 lg:p-5 border-b border-dark-100 bg-slate-50/70">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-[10px] lg:text-xs uppercase tracking-[0.15em] text-dark-500 font-semibold">
                  Filteri i pregled
                </p>
                <p className="text-xs lg:text-sm text-dark-600">Pretraži po statusu, prioritetu ili kategoriji</p>
              </div>
            </div>
          </div>
          <div className="p-4 lg:p-5 space-y-4 lg:space-y-6">
            <TicketFilters filters={filters} onFiltersChange={setFilters} />
            <div className="rounded-2xl border border-dark-100 overflow-hidden shadow-sm">
              <TicketsTable data={data?.data || []} isLoading={isLoading} isAdmin={isAdmin} />
            </div>
            {data && data.data.length > 0 && (
              <div className="pt-2">
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  totalItems={data.pagination.total}
                  itemsPerPage={filters.limit || 20}
                  onPageChange={(page) => setFilters({ ...filters, page })}
                  onItemsPerPageChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
