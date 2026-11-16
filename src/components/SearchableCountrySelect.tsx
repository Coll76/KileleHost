import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { COUNTRY_TAX_RULES, SUPPORTED_COUNTRIES } from '../config/pricingConfig';

interface SearchableCountrySelectProps {
  id: string;
  value: string;
  onChange: (country: string) => void;
  ariaDescribedBy?: string;
}

export function SearchableCountrySelect({
  id,
  value,
  onChange,
  ariaDescribedBy,
}: SearchableCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const filtered = SUPPORTED_COUNTRIES.filter((country) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const rule = COUNTRY_TAX_RULES[country];
    return (
      country.toLowerCase().includes(q) ||
      rule.code.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (!open) return;
    const onOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      setHighlightedIndex(0);
      window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 20);
    } else {
      setSearch('');
    }
  }, [open]);

  const handleSelect = (country: string) => {
    onChange(country);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = filtered[highlightedIndex];
      if (chosen) {
        handleSelect(chosen);
      }
    }
  };

  const activeRule = COUNTRY_TAX_RULES[value] ?? COUNTRY_TAX_RULES.Kenya;

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={ariaDescribedBy}
        onClick={() => setOpen((prev) => !prev)}
        className="kh-input flex items-center justify-between gap-2 text-left cursor-pointer"
      >
        <span className="font-medium text-ink min-w-0 truncate">
          {value}{' '}
          <span className="text-xs text-muted font-normal">
            ({activeRule.code} · {(activeRule.rate * 100).toFixed(activeRule.rate === 0.075 ? 1 : 0)}% tax)
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 bg-surface border border-border-subtle rounded-[14px] shadow-raised z-50 overflow-hidden">
          <div className="p-2 border-b border-divider">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Search country…"
                aria-label="Filter countries"
                className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-[10px] border border-border-input bg-canvas text-[16px] text-ink focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <ul
            role="listbox"
            aria-label="Billing countries"
            className="max-h-56 overflow-y-auto p-1.5 space-y-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-muted">
                No matching country found.
              </li>
            ) : (
              filtered.map((country, idx) => {
                const rule = COUNTRY_TAX_RULES[country];
                const isSelected = value === country;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li key={country}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelect(country)}
                      className={`w-full min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] text-sm text-left transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-primary-tint text-primary font-semibold'
                          : isSelected
                          ? 'bg-canvas text-ink font-semibold'
                          : 'text-ink hover:bg-canvas'
                      }`}
                    >
                      <span className="min-w-0 truncate">{country}</span>
                      <span className="flex items-center gap-2 text-xs text-muted shrink-0">
                        <span className="whitespace-nowrap">
                          {(rule.rate * 100).toFixed(
                            rule.rate === 0.075 ? 1 : 0
                          )}
                          %
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
