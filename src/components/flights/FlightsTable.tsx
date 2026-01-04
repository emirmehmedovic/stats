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
import { FlightWithRelations } from '@/types/flight';
import { Button } from '@/components/ui/button';
import { formatDateDisplay } from '@/lib/dates';

interface FlightsTableProps {
  data: FlightWithRelations[];
  isLoading?: boolean;
}

export function FlightsTable({ data, isLoading }: FlightsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<FlightWithRelations>[] = [
    {
      accessorKey: 'date',
      header: 'Datum',
      cell: ({ row }) => {
        const date = row.getValue('date') as Date;
        return <span className="text-sm">{formatDateDisplay(date)}</span>;
      },
    },
    {
      accessorKey: 'airline.name',
      header: 'Aviokompanija',
      cell: ({ row }) => {
        const airline = row.original.airline;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-textMain">{airline.name}</span>
            <span className="text-xs text-textMuted">{airline.icaoCode}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'route',
      header: 'Ruta',
      cell: ({ row }) => {
        return <span className="text-sm font-medium">{row.getValue('route')}</span>;
      },
    },
    {
      accessorKey: 'aircraftType.model',
      header: 'Tip aviona',
      cell: ({ row }) => {
        const aircraftType = row.original.aircraftType;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{aircraftType.model}</span>
            <span className="text-xs text-textMuted">{aircraftType.seats} sjedišta</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'registration',
      header: 'Registracija',
      cell: ({ row }) => {
        return <span className="text-sm font-mono">{row.getValue('registration')}</span>;
      },
    },
    {
      accessorKey: 'operationType',
      header: 'Tip operacije',
      cell: ({ row }) => {
        const operationType = row.getValue('operationType') as { code: string; name: string } | null;
        if (!operationType) {
          return <span className="text-xs text-textMuted">-</span>;
        }
        
        const typeColors: Record<string, string> = {
          SCHEDULED: 'bg-blue-50 text-blue-700 border border-blue-200',
          CHARTER: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
          MEDEVAC: 'bg-rose-50 text-rose-700 border border-rose-200',
          CARGO: 'bg-slate-50 text-slate-700 border border-slate-200',
          DIVERTED: 'bg-amber-50 text-amber-700 border border-amber-200',
          GENERAL_AVIATION: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
          MILITARY: 'bg-neutral-100 text-neutral-800 border border-neutral-300',
        };
        
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium shadow-sm ${
              typeColors[operationType.code] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {operationType.name}
          </span>
        );
      },
    },
    {
      accessorKey: 'arrivalFlightNumber',
      header: 'Dolazak',
      cell: ({ row }) => {
        const flightNumber = row.getValue('arrivalFlightNumber') as string | null;
        const passengers = row.original.arrivalPassengers;
        if (!flightNumber) return <span className="text-xs text-textMuted">-</span>;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{flightNumber}</span>
            {passengers !== null && (
              <span className="text-xs text-textMuted">{passengers} putnika</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'departureFlightNumber',
      header: 'Odlazak',
      cell: ({ row }) => {
        const flightNumber = row.getValue('departureFlightNumber') as string | null;
        const passengers = row.original.departurePassengers;
        if (!flightNumber) return <span className="text-xs text-textMuted">-</span>;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{flightNumber}</span>
            {passengers !== null && (
              <span className="text-xs text-textMuted">{passengers} putnika</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Akcije',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => router.push(`/flights/${row.original.id}`)}
            >
              Pregled
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => router.push(`/flights/${row.original.id}/edit`)}
            >
              Izmijeni
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 px-3 text-xs bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200"
              onClick={async () => {
                if (!confirm('Da li ste sigurni da želite obrisati ovaj let?')) return;
                try {
                  const response = await fetch(`/api/flights/${row.original.id}`, {
                    method: 'DELETE',
                  });
                  if (response.ok) {
                    window.location.reload();
                  } else {
                    const error = await response.json();
                    alert(error.error || 'Greška pri brisanju');
                  }
                } catch (err) {
                  alert('Greška pri brisanju');
                }
              }}
            >
              Obriši
            </Button>
          </div>
        );
      },
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
      <div className="bg-white rounded-3xl shadow-soft px-5 py-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-textMuted">Učitavanje...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-borderSoft">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none flex items-center gap-2'
                            : ''
                        }
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
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-textMuted">
                  Nema letova za prikaz
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-borderSoft hover:bg-shellBg transition-colors"
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
