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
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export function FlightsTable({ data, isLoading, selectedIds, onSelectionChange }: FlightsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const isSelectionMode = selectedIds !== undefined && onSelectionChange !== undefined;
  const allSelected = isSelectionMode && data.length > 0 && data.every(flight => selectedIds.has(flight.id));
  const someSelected = isSelectionMode && data.some(flight => selectedIds.has(flight.id));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      // Deselect all on current page
      const newSelected = new Set(selectedIds);
      data.forEach(flight => newSelected.delete(flight.id));
      onSelectionChange(newSelected);
    } else {
      // Select all on current page
      const newSelected = new Set(selectedIds);
      data.forEach(flight => newSelected.add(flight.id));
      onSelectionChange(newSelected);
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange || !selectedIds) return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  const columns: ColumnDef<FlightWithRelations>[] = [
    ...(isSelectionMode ? [{
      id: 'select',
      header: () => (
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected && !allSelected;
          }}
          onChange={handleSelectAll}
          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
      ),
      cell: ({ row }: { row: { original: FlightWithRelations } }) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.original.id)}
          onChange={() => handleSelectRow(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
      ),
      enableSorting: false,
    } as ColumnDef<FlightWithRelations>] : []),
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
        const status = row.original.arrivalStatus;
        const isCancelled = status === 'CANCELLED';

        if (!flightNumber) return <span className="text-xs text-textMuted">-</span>;

        return (
          <div className={`flex flex-col ${isCancelled ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-medium ${isCancelled ? 'line-through text-red-600' : ''}`}>
                {flightNumber}
              </span>
              {isCancelled && (
                <span className="inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">
                  CNL
                </span>
              )}
            </div>
            {!isCancelled && passengers !== null && (
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
        const status = row.original.departureStatus;
        const isCancelled = status === 'CANCELLED';

        if (!flightNumber) return <span className="text-xs text-textMuted">-</span>;

        return (
          <div className={`flex flex-col ${isCancelled ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-medium ${isCancelled ? 'line-through text-red-600' : ''}`}>
                {flightNumber}
              </span>
              {isCancelled && (
                <span className="inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">
                  CNL
                </span>
              )}
            </div>
            {!isCancelled && passengers !== null && (
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
          <div className="flex items-center gap-1.5 lg:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 lg:h-8 px-2 lg:px-3 text-[10px] lg:text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => router.push(`/flights/${row.original.id}`)}
            >
              <span className="hidden sm:inline">Pregled</span>
              <span className="sm:hidden">👁</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 lg:h-8 px-2 lg:px-3 text-[10px] lg:text-xs border-slate-200 text-slate-700 hover:bg-slate-50 hidden md:inline-flex"
              onClick={() => router.push(`/flights/${row.original.id}/edit`)}
            >
              Izmijeni
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 lg:h-8 px-2 lg:px-3 text-[10px] lg:text-xs bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200 hidden md:inline-flex"
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
      <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft px-4 lg:px-5 py-3 lg:py-4">
        <div className="flex items-center justify-center h-48 lg:h-64">
          <div className="text-sm text-textMuted">Učitavanje...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-borderSoft">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 lg:px-4 py-2 lg:py-3 text-left text-[10px] lg:text-xs font-semibold text-textMuted uppercase tracking-wider"
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
                <td colSpan={columns.length} className="px-3 lg:px-4 py-6 lg:py-8 text-center text-sm text-textMuted">
                  Nema letova za prikaz
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const bothCancelled = row.original.arrivalStatus === 'CANCELLED' && row.original.departureStatus === 'CANCELLED';
                const anyCancelled = row.original.arrivalStatus === 'CANCELLED' || row.original.departureStatus === 'CANCELLED';

                return (
                  <tr
                    key={row.id}
                    className={`border-b border-borderSoft transition-colors ${
                      bothCancelled
                        ? 'bg-red-50/50 hover:bg-red-100/50'
                        : anyCancelled
                        ? 'bg-amber-50/30 hover:bg-amber-100/30'
                        : 'hover:bg-shellBg'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 lg:px-4 py-2.5 lg:py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
