'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import {
  formatRoomStatusLabel,
  formatRelativeTime,
  formatRequestType,
  formatStatusLabel,
  getRoomStatusStyle,
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
          <h1 className="type-page-title">Room {roomNumber ?? token}</h1>
          <p className="mt-1 text-xs text-muted">Token: {token}</p>
          <p className="mt-1">
            <span
              className={`inline-flex px-2 py-0.5 text-xs font-medium ring-1 ${getRoomStatusStyle(getRoomStatus(token)).badge}`}
            >
              {formatRoomStatusLabel(getRoomStatus(token))}
            </span>
          </p>
          <p className="mt-2 text-sm text-muted">{newCount} new requests</p>
        </div>
        <BackButton />
      </header>

      {!hasRequests ? (
        <div className="form-container p-6 text-center shadow-warm">
          <p className="text-sm font-medium text-text">No requests for this room yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => {
            const nextStatus = getNextStatus(request.status);
            const isDone = request.status === 'done';

            return (
              <li
                key={request.id}
                className="rounded-none border border-border bg-surface p-4 shadow-warm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <p className="type-card-title">{formatRequestType(request.type)}</p>
                    <p className="text-xs text-muted">Created {formatRelativeTime(request.createdAt)}</p>
                    {request.note && <p className="text-xs text-muted">Guest note: {request.note}</p>}
                    {request.scheduledFor && (
                      <p className="text-xs text-muted">
                        Scheduled for {formatRelativeTime(request.scheduledFor)}
                      </p>
                    )}
                    <p className="text-xs text-muted">Priority: {formatPriority(request.priority)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-none px-2.5 py-1 text-xs font-medium ring-1 ${getStatusBadgeClassName(request.status)}`}
                    >
                      {formatStatusLabel(request.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(request)}
                      disabled={isDone}
                      className="btn-secondary px-2.5 py-1.5 text-xs"
                    >
                      {isDone ? 'Done' : `Next: ${formatStatusLabel(nextStatus)}`}
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <label htmlFor={`staff-note-${request.id}`} className="text-xs font-medium text-muted">
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
                    className="input-base mt-1 py-2"
                    placeholder="Internal note for staff"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveStaffNote(request.id)}
                    className="btn-primary mt-2 px-3 py-1.5 text-xs"
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
