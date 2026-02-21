'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type DropdownOption = {
  value: string;
  label: string;
};

type DropdownProps = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function Dropdown({
  value,
  options,
  onChange,
  placeholder = 'Select',
  className = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.value === value);
  const selectedLabel = selected?.label ?? placeholder;

  function handleOptionSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  useEffect(() => {
    setOpen(false);
  }, [value]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between border border-[#d9d9d9] bg-white px-3 text-sm text-text outline-none transition-colors hover:border-brand focus-visible:border-brand"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selectedLabel}</span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 border border-[#d9d9d9] bg-white p-1 shadow-soft">
          <ul role="listbox" className="space-y-1">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleOptionSelect(option.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleOptionSelect(option.value);
                      }
                    }}
                    className={`flex w-full items-center justify-between border px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? 'border-[rgba(103,20,14,0.25)] bg-[rgba(103,20,14,0.06)] text-[rgb(103,20,14)]'
                        : 'border-[#e6e6e6] bg-white text-text hover:border-brand hover:bg-[rgba(103,20,14,0.03)]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected ? <Check aria-hidden="true" className="h-4 w-4" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
