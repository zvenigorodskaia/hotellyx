'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  addRoom,
  formatRoomStatusLabel,
  getRooms,
  regenerateRoomToken,
  type RoomRecord,
} from '@/lib/requests';

export default function StaffRoomsPage() {
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [roomNumber, setRoomNumber] = useState('');
  const [revealedTokens, setRevealedTokens] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState('');
  const [origin, setOrigin] = useState('');

  function refreshRooms() {
    setRooms(getRooms());
  }

  useEffect(() => {
    refreshRooms();
    setOrigin(window.location.origin);
  }, []);

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) =>
      a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [rooms]);

  function getGuestUrl(token: string): string {
    if (!origin) {
      return `/r/${token}`;
    }

    return `${origin}/r/${token}`;
  }

  function maskToken(token: string): string {
    if (token.length <= 4) {
      return token;
    }

    return `${token.slice(0, 2)}${'•'.repeat(Math.max(4, token.length - 4))}${token.slice(-2)}`;
  }

  function handleAddRoom() {
    const normalized = roomNumber.trim();
    if (!normalized) {
      return;
    }

    addRoom(normalized);
    setRoomNumber('');
    refreshRooms();
  }

  async function handleCopy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? '' : current));
      }, 1300);
    } catch {
      // no-op
    }
  }

  function handleRegenerateToken(currentToken: string) {
    const ok = window.confirm('Regenerate token for this room? Existing guest link will stop working.');
    if (!ok) {
      return;
    }

    regenerateRoomToken(currentToken);
    refreshRooms();
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Rooms</h1>
          <p className="mt-2 text-sm text-slate-500">Create secure room links with QR access for guests.</p>
        </div>
        <Link
          href="/staff"
          className="inline-flex rounded-xl bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-white"
        >
          Back to dashboard
        </Link>
      </header>

      <section className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">Add room</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={roomNumber}
            onChange={(event) => setRoomNumber(event.target.value)}
            placeholder="Room number (e.g. 512)"
            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-indigo-300"
          />
          <button
            type="button"
            onClick={handleAddRoom}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:brightness-110"
          >
            Add room
          </button>
        </div>
      </section>

      {sortedRooms.length === 0 ? (
        <div className="rounded-2xl bg-white/75 p-6 text-center shadow-sm ring-1 ring-white/70 backdrop-blur-md">
          <p className="text-sm font-medium text-slate-900">No rooms yet.</p>
          <p className="mt-1 text-sm text-slate-500">Add a room number to generate a secret guest token.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedRooms.map((room) => {
            const guestUrl = getGuestUrl(room.token);
            const qrSrc =
              'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' +
              encodeURIComponent(guestUrl);
            const showToken = Boolean(revealedTokens[room.token]);

            return (
              <li
                key={room.token}
                className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Room {room.roomNumber}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatRoomStatusLabel(room.roomStatus)}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-slate-500">Token:</span>
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {showToken ? room.token : maskToken(room.token)}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedTokens((current) => ({
                            ...current,
                            [room.token]: !current[room.token],
                          }))
                        }
                        className="rounded-lg bg-white px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        {showToken ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Guest URL</p>
                    <p className="mt-1 break-all text-sm text-slate-700">{guestUrl}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(guestUrl, `link-${room.token}`)}
                        className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                      >
                        {copiedKey === `link-${room.token}` ? 'Copied' : 'Copy link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(room.token, `token-${room.token}`)}
                        className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        {copiedKey === `token-${room.token}` ? 'Copied' : 'Copy token'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRegenerateToken(room.token)}
                        className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-50"
                      >
                        Regenerate token
                      </button>
                      <a
                        href={guestUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        Open guest page
                      </a>
                    </div>
                  </div>

                  <img
                    src={qrSrc}
                    alt={`QR code for room ${room.roomNumber}`}
                    className="h-[220px] w-[220px] rounded-xl bg-white p-2 ring-1 ring-slate-200"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
