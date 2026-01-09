'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Izaberite...',
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((option) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const labelMatch = option.label.toLowerCase().includes(query);
    const valueMatch = option.value.toLowerCase().includes(query);
    const subtitleMatch = option.subtitle && option.subtitle.toLowerCase().includes(query);
    
    // Also check if any word in subtitle starts with the query
    const subtitleWords = option.subtitle ? option.subtitle.toLowerCase().split(/\s+/) : [];
    const wordStartMatch = subtitleWords.some(word => word.startsWith(query));
    
    return labelMatch || valueMatch || subtitleMatch || wordStartMatch;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-dark-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm text-left flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-dark-900' : 'text-dark-400'}>
          {selectedOption ? (
            <span>
              <span className="font-semibold">{selectedOption.value}</span>
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-dark-200 rounded-xl shadow-soft-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b border-dark-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pretraži..."
                className="w-full pl-9 pr-3 py-2 border border-dark-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 text-sm"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-dark-500">
                Nema rezultata
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors ${
                    option.value === value ? 'bg-primary-100 text-primary-900' : 'text-dark-900'
                  }`}
                >
                  <div className="font-semibold">{option.value}</div>
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
