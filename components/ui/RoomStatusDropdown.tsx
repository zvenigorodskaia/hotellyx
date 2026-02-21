'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  formatRoomStatusLabel,
  type RoomStatus,
} from '@/lib/requests';

type RoomStatusDropdownProps = {
  value: RoomStatus;
  onChange: (next: RoomStatus) => void;
  options: Array<{ value: RoomStatus; label: string }>;
};

export default function RoomStatusDropdown({
  value,
  onChange,
  options,
}: RoomStatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const currentTheme = getRoomStatusInlineStyle(value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full items-center justify-between border px-3 text-sm font-medium outline-none transition-colors hover:border-brand shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
        style={currentTheme}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{formatRoomStatusLabel(value)}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-[70] mt-2 border border-border bg-surface p-1 shadow-soft">
          <ul role="listbox" className="space-y-1">
            {options.map((option) => {
              const optionTheme = getRoomStatusInlineStyle(option.value);
              const selected = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between border px-3 py-2 text-left text-sm transition-colors hover:border-brand"
                    style={optionTheme}
                    role="option"
                    aria-selected={selected}
                  >
                    <span>{option.label}</span>
                    {selected ? <Check aria-hidden="true" className="h-4 w-4" /> : null}
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

function getRoomStatusInlineStyle(status: RoomStatus): {
  backgroundColor: string;
  color: string;
  borderColor: string;
} {
  if (status === 'dnd') {
    return {
      backgroundColor: 'rgb(255 219 219 / 34%)',
      color: '#7A1F1F',
      borderColor: '#F7CCCC',
    };
  }

  if (status === 'please_clean') {
    return {
      backgroundColor: 'rgb(214 232 255 / 73%)',
      color: '#1D4ED8',
      borderColor: '#D4E2FF',
    };
  }

  if (status === 'maintenance_needed') {
    return {
      backgroundColor: 'rgb(255 244 227 / 54%)',
      color: '#9A3412',
      borderColor: '#FFE1C2',
    };
  }

  return {
    backgroundColor: '#ffffff57',
    color: '#1a1a1a',
    borderColor: 'rgba(255,255,255,0.55)',
  };
}
