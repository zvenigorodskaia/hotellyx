'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import { Textarea } from '@/components/ui/Field';
import { createRequest, getRoomByToken, normalizeRoomToken } from '@/lib/requests';

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

  const token = normalizeRoomToken(params?.token ?? '');
  const type = searchParams.get('type') ?? 'General request';
  const slot = searchParams.get('slot') ?? '';

  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [resolvedRoomToken, setResolvedRoomToken] = useState('');
  const [when, setWhen] = useState<'asap' | 'schedule'>('asap');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [showSentToast, setShowSentToast] = useState(false);

  useEffect(() => {
    const room = getRoomByToken(token);
    setRoomNumber((room?.roomNumber ?? token) || null);
    setResolvedRoomToken(room?.token ?? token);

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
    if (!roomNumber || !resolvedRoomToken) {
      return;
    }

    const scheduledFor = when === 'schedule' ? toIso(date, time) : undefined;

    createRequest(resolvedRoomToken, type, {
      note,
      scheduledFor,
      roomNumber,
    });

    setShowSentToast(true);
  }

  return (
    <section className="space-y-6 pb-24">
      {showSentToast && (
        <div className="animate-toast fixed right-4 top-4 z-50 w-[min(92vw,20rem)] form-container text-sm text-muted shadow-warm">
          <p className="font-medium text-text">Request sent</p>
        </div>
      )}

      <header className="flex items-center gap-3">
        <BackButton />
        <h1 className="type-page-title">Request: {type}</h1>
      </header>

      {!roomNumber ? (
        <section className="form-container shadow-warm">
          <p className="text-sm text-muted">Invalid room link.</p>
        </section>
      ) : (
        <section className="form-container space-y-5 shadow-warm">
          <div>
            <p className="type-kicker">Room</p>
            <p className="mt-1 text-sm font-medium text-text">{roomNumber}</p>
          </div>

          <div>
            <p className="type-kicker">When?</p>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="radio"
                  name="when"
                  checked={when === 'asap'}
                  onChange={() => setWhen('asap')}
                />
                ASAP
              </label>
              <label className="flex items-center gap-2 text-sm text-muted">
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
                  className="input-base"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="input-base"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="request-note" className="type-kicker">
              Notes (optional)
            </label>
            <Textarea
              id="request-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder="Add any details"
              className="mt-2 w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-primary"
            >
              Submit request
            </button>
            <button
              type="button"
              onClick={() => router.push(`/r/${token}`)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
