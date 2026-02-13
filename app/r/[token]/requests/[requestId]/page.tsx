'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import {
  formatRelativeTime,
  formatRequestType,
  formatStatusLabel,
  getRequestById,
  getRoomByToken,
  getStatusBadgeClassName,
  normalizeRoomToken,
  updateRequestStatus,
  type GuestRequest,
} from '@/lib/requests';

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function GuestRequestDetailsPage() {
  const params = useParams<{ token: string; requestId: string }>();
  const token = normalizeRoomToken(params?.token ?? '');
  const requestId = params?.requestId ?? '';

  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [request, setRequest] = useState<GuestRequest | null>(null);

  useEffect(() => {
    const room = getRoomByToken(token);
    setRoomNumber((room?.roomNumber ?? token) || null);
    setRequest(getRequestById(requestId) ?? null);
  }, [token, requestId]);

  const shortId = useMemo(() => requestId.slice(0, 8), [requestId]);

  const timeline = useMemo(() => {
    if (!request) {
      return [];
    }

    const acceptedReached =
      request.status === 'accepted' || request.status === 'in_progress' || request.status === 'done';
    const inProgressReached = request.status === 'in_progress' || request.status === 'done';
    const doneReached = request.status === 'done';

    return [
      {
        key: 'submitted',
        label: 'Submitted',
        at: request.createdAt,
      },
      {
        key: 'accepted',
        label: 'Accepted',
        at: request.acceptedAt,
        reached: acceptedReached || Boolean(request.acceptedAt),
      },
      {
        key: 'in_progress',
        label: 'In progress',
        at: request.inProgressAt,
        reached: inProgressReached || Boolean(request.inProgressAt),
      },
      {
        key: 'done',
        label: 'Done',
        at: request.doneAt,
        reached: doneReached || Boolean(request.doneAt),
      },
    ].filter((item) => item.key === 'submitted' || (item as { reached?: boolean }).reached);
  }, [request]);

  function handleCancelRequest() {
    if (!request || request.status !== 'new') {
      return;
    }

    const updated = updateRequestStatus(request.id, 'cancelled');
    setRequest(updated.find((item) => item.id === request.id) ?? null);
  }

  function handleRateExperience() {
    window.alert('Rating flow will be added soon.');
  }

  if (!roomNumber) {
    return (
      <section className="space-y-4">
        <BackButton />
        <div className="form-container shadow-warm">
          <p className="text-sm text-muted">Invalid room link.</p>
        </div>
      </section>
    );
  }

  if (!request || (request.roomToken !== token && request.roomNumber !== roomNumber)) {
    return (
      <section className="space-y-4">
        <BackButton />
        <div className="form-container shadow-warm">
          <p className="text-sm text-muted">Request not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-semibold text-text">Request #{shortId}</h1>
      </header>

      <section className="form-container shadow-warm">
        <p className="text-xs uppercase tracking-wide text-muted">Type</p>
        <p className="mt-1 text-sm font-medium text-text">{formatRequestType(request.type)}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-none px-2.5 py-1 text-xs font-medium ring-1 ${getStatusBadgeClassName(request.status)}`}
          >
            {formatStatusLabel(request.status)}
          </span>
          {request.scheduledFor && (
            <span className="text-xs text-muted">ETA {formatRelativeTime(request.scheduledFor)}</span>
          )}
        </div>
      </section>

      <section className="form-container shadow-warm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Timeline</h2>
        <ul className="mt-3 space-y-2">
          {timeline.map((item) => (
            <li key={item.key} className="flex items-start justify-between gap-2 text-sm">
              <span className="font-medium text-text">{item.label}</span>
              <span className="text-muted">{item.at ? formatDateTime(item.at) : '—'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-2">
        {request.status === 'new' && (
          <button
            type="button"
            onClick={handleCancelRequest}
            className="btn-secondary px-4 py-2.5 text-sm"
          >
            Cancel request
          </button>
        )}

        {request.status === 'done' && (
          <button
            type="button"
            onClick={handleRateExperience}
            className="btn-primary px-4 py-2.5 text-sm"
          >
            Rate experience
          </button>
        )}
      </section>
    </section>
  );
}
