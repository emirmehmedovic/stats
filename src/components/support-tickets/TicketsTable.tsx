'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { TicketCategoryBadge } from './TicketCategoryBadge';
import { TicketStatus, TicketPriority, TicketCategory, TicketLocation, TicketSystem } from '@prisma/client';
import { MessageSquare, Paperclip, ChevronRight, MapPin, Monitor } from 'lucide-react';

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
  OFFICE_NAPLATE: 'Kanc. Naplate',
  OFFICE_INFO: 'Kanc. Info',
  OTHER: 'Ostalo',
};

const SYSTEM_LABELS: Record<TicketSystem, string> = {
  GONOW: 'GoNow',
  DCS_CRANE: 'DCS Crane',
  NIKO: 'NIKO',
  PRINTER: 'Printer',
  OTHER: 'Ostalo',
};

interface TicketComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string | null;
  };
}

interface TicketUser {
  id: string;
  name: string | null;
  email: string;
}

interface TicketWithRelations {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  location?: TicketLocation | null;
  system?: TicketSystem | null;
  reporterName?: string | null;
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

interface TicketsTableProps {
  data: TicketWithRelations[];
  isLoading?: boolean;
  isAdmin?: boolean;
}

export function TicketsTable({ data, isLoading, isAdmin }: TicketsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('bs-BA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const columns: ColumnDef<TicketWithRelations>[] = [
    {
      accessorKey: 'title',
      header: 'Tiket',
      cell: ({ row }) => {
        const title = row.getValue('title') as string;
        const reporter = row.original.reporterName || row.original.submittedBy.name || row.original.submittedBy.email;
        return (
          <div className="min-w-[200px]">
            <p className="text-sm font-medium text-slate-900 line-clamp-1">{title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{reporter}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {row.original._count.comments > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <MessageSquare className="w-3 h-3" />
                  {row.original._count.comments}
                </span>
              )}
              {row.original._count.attachments > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Paperclip className="w-3 h-3" />
                  {row.original._count.attachments}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'location',
      header: 'Lokacija',
      cell: ({ row }) => {
        const location = row.original.location;
        if (!location) return <span className="text-xs text-slate-400">-</span>;
        return (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-600">{LOCATION_LABELS[location]}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'system',
      header: 'Sistem',
      cell: ({ row }) => {
        const system = row.original.system;
        if (!system) return <span className="text-xs text-slate-400">-</span>;
        return (
          <div className="flex items-center gap-1.5">
            <Monitor className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-600">{SYSTEM_LABELS[system]}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <TicketStatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'priority',
      header: 'Prioritet',
      cell: ({ row }) => <TicketPriorityBadge priority={row.getValue('priority')} />,
    },
    {
      accessorKey: 'category',
      header: 'Kategorija',
      cell: ({ row }) => <TicketCategoryBadge category={row.getValue('category')} />,
    },
    {
      id: 'comments',
      header: 'Zadnji komentar',
      cell: ({ row }) => {
        const comments = row.original.comments || [];
        const totalComments = row.original._count.comments;

        if (totalComments === 0) {
          return <span className="text-xs text-slate-400">Nema komentara</span>;
        }

        const lastComment = comments[0];

        if (!lastComment) {
          return (
            <span className="text-xs text-slate-500">{totalComments} komentar(a)</span>
          );
        }

        return (
          <div className="max-w-[180px]">
            <p className="text-xs text-slate-500 mb-0.5">{lastComment.author.name || 'Nepoznato'}:</p>
            <p className="text-xs text-slate-700 line-clamp-2">
              {lastComment.content.length > 50
                ? lastComment.content.slice(0, 50) + '...'
                : lastComment.content}
            </p>
          </div>
        );
      },
    },
    ...(isAdmin
      ? [
          {
            accessorKey: 'assignedTo',
            header: 'Dodijeljen',
            cell: ({ row }: any) => {
              const assignedTo = row.original.assignedTo;
              if (!assignedTo) {
                return <span className="text-xs text-slate-400">-</span>;
              }
              return (
                <span className="text-xs text-slate-700">{assignedTo.name || assignedTo.email}</span>
              );
            },
          } as ColumnDef<TicketWithRelations>,
        ]
      : []),
    {
      accessorKey: 'createdAt',
      header: 'Datum',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">{formatDate(row.getValue('createdAt'))}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/support-tickets/${row.original.id}`);
          }}
        >
          Pregled
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <div className="border border-slate-200 rounded-xl bg-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-slate-500">Učitavanje...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center gap-1' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' ↑',
                          desc: ' ↓',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-500">
                  Nema tiketa za prikaz
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/support-tickets/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
