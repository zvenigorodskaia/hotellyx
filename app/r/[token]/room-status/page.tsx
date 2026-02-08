'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  formatRoomStatusLabel,
  getRoomByToken,
  getRoomStatus,
  setRoomStatus,
  type RoomStatus,
} from '@/lib/requests';

const ROOM_STATUS_OPTIONS: Array<{ status: RoomStatus; title: string; caption: string }> = [
  {
    status: 'dnd',
    title: 'Do not disturb',
    caption: 'No housekeeping or interruptions right now',
  },
  {
    status: 'please_clean',
    title: 'Please clean',
    caption: 'Room is ready for housekeeping service',
  },
  {
    status: 'maintenance_needed',
    title: 'Maintenance needed',
    caption: 'Something requires technical attention',
  },
];

export default function GuestRoomStatusPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';

  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<RoomStatus>('dnd');

  useEffect(() => {
    const room = getRoomByToken(token);
    setRoomNumber(room?.roomNumber ?? null);
    setActiveStatus(getRoomStatus(token));
  }, [token]);

  function handleSetStatus(nextStatus: RoomStatus) {
    setActiveStatus(nextStatus);
    setRoomStatus(token, nextStatus);
  }

  if (!roomNumber) {
    return (
      <section className="space-y-4">
        <Link
          href={`/r/${token}`}
          className="inline-flex rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          Back
        </Link>
        <div className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
          <p className="text-sm text-slate-600">Invalid room link.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-3">
        <Link
          href={`/r/${token}`}
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          Back
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Room status</h1>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {ROOM_STATUS_OPTIONS.map((option) => {
          const isActive = activeStatus === option.status;

          return (
            <button
              key={option.status}
              type="button"
              onClick={() => handleSetStatus(option.status)}
              className={`rounded-2xl px-4 py-3 text-left shadow-sm ring-1 transition ${
                isActive
                  ? 'bg-indigo-50 ring-indigo-200'
                  : 'bg-white/80 ring-white/70 hover:bg-white'
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">{option.title}</p>
              <p className="mt-1 text-xs text-slate-500">{option.caption}</p>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-slate-500">
        Current status: <span className="font-medium text-slate-700">{formatRoomStatusLabel(activeStatus)}</span>. Staff sees updates immediately.
      </p>
    </section>
  );
}
