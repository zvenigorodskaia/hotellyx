'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  formatRoomStatusLabel,
  formatRelativeTime,
  formatRequestType,
  formatStatusLabel,
  getRoomByToken,
  getRoomStatus,
  getNextStatus,
  getRoomRequests,
  getStatusBadgeClassName,
  updateRequestStaffNote,
  updateRequestStatus,
  type GuestRequest,
} from '@/lib/requests';

function formatPriority(priority: GuestRequest['priority']): string {
  if (!priority) {
    return 'normal';
  }

  return priority;
}

export default function StaffRoomDetailsPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';

  const [requests, setRequests] = useState<GuestRequest[]>([]);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [staffNotes, setStaffNotes] = useState<Record<string, string>>({});

  function refreshRoom() {
    const roomRequests = getRoomRequests(token).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    setRequests(roomRequests);
    setRoomNumber(getRoomByToken(token)?.roomNumber ?? roomRequests[0]?.roomNumber ?? null);
    setStaffNotes(
      roomRequests.reduce<Record<string, string>>((acc, request) => {
        acc[request.id] = request.staffNote ?? '';
        return acc;
      }, {})
    );
  }

  useEffect(() => {
    refreshRoom();
  }, [token]);

  const hasRequests = requests.length > 0;

  const newCount = useMemo(() => {
    return requests.filter((request) => request.status === 'new').length;
  }, [requests]);

  function handleAdvanceStatus(request: GuestRequest) {
    const updated = updateRequestStatus(request.id, getNextStatus(request.status));
    setRequests(updated.filter((item) => item.roomToken === token).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  }

  function handleSaveStaffNote(requestId: string) {
    const updated = updateRequestStaffNote(requestId, staffNotes[requestId] ?? '');
    setRequests(updated.filter((item) => item.roomToken === token).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  }

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Room {roomNumber ?? token}</h1>
          <p className="mt-1 text-xs text-slate-500">Token: {token}</p>
          <p className="mt-1 text-sm text-slate-500">{formatRoomStatusLabel(getRoomStatus(token))}</p>
          <p className="mt-2 text-sm text-slate-500">{newCount} new requests</p>
        </div>
        <Link
          href="/staff/rooms"
          className="inline-flex rounded-xl bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-white"
        >
          Back to rooms
        </Link>
      </header>

      {!hasRequests ? (
        <div className="rounded-2xl bg-white/75 p-6 text-center shadow-sm ring-1 ring-white/70 backdrop-blur-md">
          <p className="text-sm font-medium text-slate-900">No requests for this room yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => {
            const nextStatus = getNextStatus(request.status);
            const isDone = request.status === 'done';

            return (
              <li
                key={request.id}
                className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-slate-900">{formatRequestType(request.type)}</p>
                    <p className="text-xs text-slate-500">Created {formatRelativeTime(request.createdAt)}</p>
                    {request.note && <p className="text-xs text-slate-600">Guest note: {request.note}</p>}
                    {request.scheduledFor && (
                      <p className="text-xs text-slate-600">
                        Scheduled for {formatRelativeTime(request.scheduledFor)}
                      </p>
                    )}
                    <p className="text-xs text-slate-600">Priority: {formatPriority(request.priority)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${getStatusBadgeClassName(request.status)}`}
                    >
                      {formatStatusLabel(request.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(request)}
                      disabled={isDone}
                      className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDone ? 'Done' : `Next: ${formatStatusLabel(nextStatus)}`}
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <label htmlFor={`staff-note-${request.id}`} className="text-xs font-medium text-slate-600">
                    Staff note
                  </label>
                  <textarea
                    id={`staff-note-${request.id}`}
                    value={staffNotes[request.id] ?? ''}
                    onChange={(event) =>
                      setStaffNotes((current) => ({
                        ...current,
                        [request.id]: event.target.value,
                      }))
                    }
                    rows={2}
                    className="mt-1 w-full rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-indigo-300"
                    placeholder="Internal note for staff"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveStaffNote(request.id)}
                    className="mt-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                  >
                    Save note
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
