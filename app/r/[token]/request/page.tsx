'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createRequest, getRoomByToken } from '@/lib/requests';

function toDateAndTime(iso: string): { date: string; time: string } {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: '', time: '' };
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

function toIso(date: string, time: string): string | undefined {
  if (!date || !time) {
    return undefined;
  }

  const parsed = new Date(`${date}T${time}`);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

export default function GuestRequestFormPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();

  const token = params?.token ?? '';
  const type = searchParams.get('type') ?? 'General request';
  const slot = searchParams.get('slot') ?? '';

  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [when, setWhen] = useState<'asap' | 'schedule'>('asap');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [showSentToast, setShowSentToast] = useState(false);

  useEffect(() => {
    const room = getRoomByToken(token);
    setRoomNumber(room?.roomNumber ?? null);

    if (slot) {
      const parsed = toDateAndTime(slot);
      if (parsed.date && parsed.time) {
        setWhen('schedule');
        setDate(parsed.date);
        setTime(parsed.time);
      }
    }
  }, [token, slot]);

  useEffect(() => {
    if (!showSentToast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.push(`/r/${token}`);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [showSentToast, router, token]);

  const canSubmit = useMemo(() => {
    if (!roomNumber) {
      return false;
    }

    if (when === 'asap') {
      return true;
    }

    return Boolean(toIso(date, time));
  }, [roomNumber, when, date, time]);

  function handleSubmit() {
    if (!roomNumber) {
      return;
    }

    const scheduledFor = when === 'schedule' ? toIso(date, time) : undefined;

    createRequest(token, type, {
      note,
      scheduledFor,
      roomNumber,
    });

    setShowSentToast(true);
  }

  return (
    <section className="space-y-6 pb-24">
      {showSentToast && (
        <div className="animate-toast fixed right-4 top-4 z-50 w-[min(92vw,20rem)] rounded-2xl bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-2xl ring-1 ring-slate-200 backdrop-blur">
          <p className="font-medium text-slate-900">Request sent</p>
        </div>
      )}

      <header className="flex items-center gap-3">
        <Link
          href={`/r/${token}`}
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          Back
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Request: {type}</h1>
      </header>

      {!roomNumber ? (
        <section className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
          <p className="text-sm text-slate-600">Invalid room link.</p>
        </section>
      ) : (
        <section className="space-y-5 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Room</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{roomNumber}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">When?</p>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="when"
                  checked={when === 'asap'}
                  onChange={() => setWhen('asap')}
                />
                ASAP
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="when"
                  checked={when === 'schedule'}
                  onChange={() => setWhen('schedule')}
                />
                Schedule
              </label>
            </div>

            {when === 'schedule' && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-indigo-300"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="request-note" className="text-xs uppercase tracking-wide text-slate-400">
              Notes (optional)
            </label>
            <textarea
              id="request-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder="Add any details"
              className="mt-2 w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit request
            </button>
            <button
              type="button"
              onClick={() => router.push(`/r/${token}`)}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
