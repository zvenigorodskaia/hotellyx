'use client';

import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import {
  addRoom,
  formatRoomStatusLabel,
  getRoomStatusStyle,
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
          <h1 className="type-page-title">Rooms</h1>
          <p className="mt-2 type-subtitle">Create secure room links with QR access for guests.</p>
        </div>
        <BackButton />
      </header>

      <section className="form-container shadow-warm">
        <h2 className="type-kicker">Add room</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={roomNumber}
            onChange={(event) => setRoomNumber(event.target.value)}
            placeholder="Room number (e.g. 512)"
            className="input-base"
          />
          <button
            type="button"
            onClick={handleAddRoom}
            className="btn-primary"
          >
            Add room
          </button>
        </div>
      </section>

      {sortedRooms.length === 0 ? (
        <div className="form-container p-6 text-center shadow-warm">
          <p className="text-sm font-medium text-text">No rooms yet.</p>
          <p className="mt-1 text-sm text-muted">Add a room number to generate a secret guest token.</p>
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
                className="rounded-none border border-border bg-surface p-4 shadow-warm"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="type-card-title">Room {room.roomNumber}</p>
                    <p className="mt-1">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium ring-1 ${getRoomStatusStyle(room.roomStatus).badge}`}
                      >
                        {formatRoomStatusLabel(room.roomStatus)}
                      </span>
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted">Token:</span>
                      <code className="rounded-none bg-surface-2 px-2 py-1 text-xs text-muted">
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
                        className="btn-secondary px-2 py-1 text-xs"
                      >
                        {showToken ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    <p className="mt-3 type-kicker">Guest URL</p>
                    <p className="mt-1 break-all text-sm text-muted">{guestUrl}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(guestUrl, `link-${room.token}`)}
                        className="btn-primary px-3 py-1.5 text-sm"
                      >
                        {copiedKey === `link-${room.token}` ? 'Copied' : 'Copy link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(room.token, `token-${room.token}`)}
                        className="btn-secondary px-3 py-1.5 text-sm"
                      >
                        {copiedKey === `token-${room.token}` ? 'Copied' : 'Copy token'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRegenerateToken(room.token)}
                        className="btn-secondary px-3 py-1.5 text-sm"
                      >
                        Regenerate token
                      </button>
                      <a
                        href={guestUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary px-3 py-1.5 text-sm"
                      >
                        Open guest page
                      </a>
                    </div>
                  </div>

                  <img
                    src={qrSrc}
                    alt={`QR code for room ${room.roomNumber}`}
                    className="h-[220px] w-[220px] rounded-none border border-border bg-surface p-2"
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
