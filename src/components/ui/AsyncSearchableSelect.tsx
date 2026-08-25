'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, X, Loader2 } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  subtitle?: string;
}

interface AsyncSearchableSelectProps {
  value: string;
  onChange: (value: string, option?: Option) => void;
  fetchOptions: (search: string) => Promise<Option[]>;
  fetchInitialOption?: (value: string) => Promise<Option | null>;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  typeToSearchText?: string;
  minSearchLength?: number;
  debounceMs?: number;
  className?: string;
}

export function AsyncSearchableSelect({
  value,
  onChange,
  fetchOptions,
  fetchInitialOption,
  placeholder = 'Izaberite...',
  searchPlaceholder = 'Pretraži...',
  noResultsText = 'Nema rezultata',
  typeToSearchText = 'Kucajte za pretragu...',
  minSearchLength = 1,
  debounceMs = 300,
  className = '',
}: AsyncSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial selected option if value is set
  useEffect(() => {
    if (value && fetchInitialOption && !selectedOption) {
      fetchInitialOption(value).then((option) => {
        if (option) {
          setSelectedOption(option);
        }
      });
    } else if (!value) {
      setSelectedOption(null);
    }
  }, [value, fetchInitialOption]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setOptions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (query.length < minSearchLength) {
        setOptions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      debounceRef.current = setTimeout(async () => {
        try {
          const results = await fetchOptions(query);
          setOptions(results);
        } catch (error) {
          console.error('Error fetching options:', error);
          setOptions([]);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [fetchOptions, minSearchLength, debounceMs]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    onChange(option.value, option);
    setIsOpen(false);
    setSearchQuery('');
    setOptions([]);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    onChange('', undefined);
    setSearchQuery('');
    setOptions([]);
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
      setOptions([]);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full px-3 py-2 border border-dark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm text-left flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-dark-900' : 'text-dark-400'}>
          {selectedOption ? (
            <span>
              <span className="font-semibold">{selectedOption.label}</span>
              {selectedOption.subtitle && (
                <span className="text-dark-500 ml-2">- {selectedOption.subtitle}</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <X
              className="w-4 h-4 text-dark-400 hover:text-dark-600"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={`w-4 h-4 text-dark-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-dark-200 rounded-xl shadow-soft-lg max-h-72 overflow-hidden">
          <div className="p-2 border-b border-dark-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-dark-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
              )}
            </div>
          </div>

          <div className="overflow-y-auto max-h-52">
            {searchQuery.length < minSearchLength ? (
              <div className="px-3 py-4 text-center text-sm text-dark-500">
                {typeToSearchText}
              </div>
            ) : isLoading ? (
              <div className="px-3 py-4 text-center text-sm text-dark-500">
                <Loader2 className="w-5 h-5 mx-auto animate-spin text-primary-500" />
              </div>
            ) : options.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-dark-500">
                {noResultsText}
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors ${
                    option.value === value ? 'bg-primary-100 text-primary-900' : 'text-dark-900'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  {option.subtitle && (
                    <div className="text-xs text-dark-500 mt-0.5">{option.subtitle}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
