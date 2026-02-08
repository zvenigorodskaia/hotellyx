'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  formatRelativeTime,
  formatRequestType,
  formatStatusLabel,
  getRequestById,
  getRoomByToken,
  getStatusBadgeClassName,
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
  const token = params?.token ?? '';
  const requestId = params?.requestId ?? '';

  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [request, setRequest] = useState<GuestRequest | null>(null);

  useEffect(() => {
    setRoomNumber(getRoomByToken(token)?.roomNumber ?? null);
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

  if (!request || request.roomToken !== token) {
    return (
      <section className="space-y-4">
        <Link
          href={`/r/${token}`}
          className="inline-flex rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          Back
        </Link>
        <div className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
          <p className="text-sm text-slate-600">Request not found.</p>
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
        <h1 className="text-2xl font-semibold text-slate-900">Request #{shortId}</h1>
      </header>

      <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
        <p className="text-xs uppercase tracking-wide text-slate-400">Type</p>
        <p className="mt-1 text-sm font-medium text-slate-900">{formatRequestType(request.type)}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${getStatusBadgeClassName(request.status)}`}
          >
            {formatStatusLabel(request.status)}
          </span>
          {request.scheduledFor && (
            <span className="text-xs text-slate-600">ETA {formatRelativeTime(request.scheduledFor)}</span>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">Timeline</h2>
        <ul className="mt-3 space-y-2">
          {timeline.map((item) => (
            <li key={item.key} className="flex items-start justify-between gap-2 text-sm">
              <span className="font-medium text-slate-800">{item.label}</span>
              <span className="text-slate-500">{item.at ? formatDateTime(item.at) : '—'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-2">
        {request.status === 'new' && (
          <button
            type="button"
            onClick={handleCancelRequest}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50"
          >
            Cancel request
          </button>
        )}

        {request.status === 'done' && (
          <button
            type="button"
            onClick={handleRateExperience}
            className="rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
          >
            Rate experience
          </button>
        )}
      </section>
    </section>
  );
}
