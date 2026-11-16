import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MapPin } from 'lucide-react';
import {
  AddressSuggestion,
  searchMockAddresses,
} from '../config/billingConfig';

interface AddressAutocompleteInputProps {
  id: string;
  value: string;
  country: string;
  hasError: boolean;
  isValid: boolean;
  ariaDescribedBy?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onBlur: () => void;
  onSelectSuggestion: (suggestion: AddressSuggestion) => void;
}

export function AddressAutocompleteInput({
  id,
  value,
  country,
  hasError,
  isValid,
  ariaDescribedBy,
  inputRef,
  onChange,
  onBlur,
  onSelectSuggestion,
}: AddressAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const suppressNextFetchRef = useRef<boolean>(false);

  useEffect(() => {
    const onOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutsideClick);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (suppressNextFetchRef.current) {
      suppressNextFetchRef.current = false;
      return;
    }

    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const results = searchMockAddresses(trimmed, country);
      setSuggestions(results);
      setHighlightedIndex(0);
      setOpen(results.length > 0);
      setLoading(false);
    }, 300);
  }, [value, country]);

  const handlePick = (suggestion: AddressSuggestion) => {
    suppressNextFetchRef.current = true;
    setOpen(false);
    setSuggestions([]);
    onSelectSuggestion(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = suggestions[highlightedIndex];
      if (chosen) {
        handlePick(chosen);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="street-address"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-invalid={hasError}
          aria-describedby={ariaDescribedBy}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder="Start typing street or area (3+ chars), e.g. Kilimani"
          className={`kh-input pr-10! ${
            hasError
              ? 'border-error! focus:shadow-[0_0_0_3px_var(--kh-error-tint)]!'
              : isValid
              ? 'border-success/60!'
              : ''
          }`}
        />

        {isValid && !hasError && (
          <CheckCircle2
            aria-hidden="true"
            className="w-4 h-4 text-success absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
        )}
      </div>

      {loading && (
        <p className="text-[11px] text-muted mt-1">
          Searching address suggestions…
        </p>
      )}

      {open && suggestions.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          aria-label="Address suggestions"
          className="absolute left-0 right-0 mt-1.5 bg-surface border border-border-subtle rounded-[14px] shadow-raised p-1.5 z-50 max-h-60 overflow-y-auto space-y-1"
        >
          {suggestions.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handlePick(item);
                  }}
                  onClick={() => handlePick(item)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full min-h-[44px] flex items-start gap-2.5 px-3 py-2.5 rounded-[10px] text-left transition-colors cursor-pointer ${
                    isHighlighted
                      ? 'bg-primary-tint text-primary'
                      : 'text-ink hover:bg-canvas'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-ink overflow-anywhere">
                      {item.street}
                    </div>
                    <div className="text-xs text-secondary">
                      {item.city}, {item.postalCode} · {item.country}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
