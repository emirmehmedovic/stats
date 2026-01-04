'use client';

import { Button } from './button';
import { Input } from './input';
import { useState } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const [jumpToPage, setJumpToPage] = useState('');

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpToPage('');
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="bg-white rounded-3xl shadow-soft px-5 py-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left side - Items count */}
        <div className="flex items-center gap-4">
          <p className="text-sm text-textMuted">
            Prikazano <span className="font-semibold text-textMain">{startItem}</span> -{' '}
            <span className="font-semibold text-textMain">{endItem}</span> od{' '}
            <span className="font-semibold text-textMain">{totalItems}</span>
          </p>
        </div>

        {/* Center - Page numbers */}
        <div className="flex items-center gap-2">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-9 w-9 p-0"
          >
            ‹
          </Button>

          {/* Page numbers */}
          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-textMuted">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className={
                  currentPage === page
                    ? 'h-9 w-9 p-0 bg-brand-primary hover:bg-brand-primary/90 text-white'
                    : 'h-9 w-9 p-0'
                }
              >
                {page}
              </Button>
            )
          )}

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-9 w-9 p-0"
          >
            ›
          </Button>
        </div>

        {/* Right side - Items per page and Jump to page */}
        <div className="flex items-center gap-4">
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm text-textMuted whitespace-nowrap">
              Po stranici:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="h-9 rounded-xl border border-borderSoft bg-white px-3 text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Jump to page */}
          <div className="flex items-center gap-2">
            <label htmlFor="jumpToPage" className="text-sm text-textMuted whitespace-nowrap">
              Idi na:
            </label>
            <div className="flex gap-1">
              <Input
                id="jumpToPage"
                type="number"
                min={1}
                max={totalPages}
                value={jumpToPage}
                onChange={(e) => setJumpToPage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleJumpToPage();
                  }
                }}
                className="h-9 w-16 text-sm"
                placeholder={currentPage.toString()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleJumpToPage}
                className="h-9 px-3"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
