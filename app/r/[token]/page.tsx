'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import {
  REQUESTS_STORAGE_KEY,
  ROOMS_STORAGE_KEY,
  createRequest,
  formatRelativeTime,
  formatRequestType,
  formatStatusLabel,
  getRoomByToken,
  getRoomRequests,
  getStatusBadgeClassName,
  type GuestRequest,
  type RequestPriority,
} from '@/lib/requests';

type QuickRequestItem = {
  type: string;
  title: string;
  caption: string;
  priority: RequestPriority;
  icon: ReactNode;
};

type ServiceItem = {
  name: string;
  caption: string;
};

type PendingRequest = {
  type: string;
  title: string;
  priority: RequestPriority;
};

type ScheduleOption = 'now' | '1h' | '2h';
type GuestRoomStatus = 'do_not_disturb' | 'please_clean' | 'maintenance_needed' | null;

const QUICK_REQUESTS: QuickRequestItem[] = [
  {
    type: 'towels',
    title: 'Towels',
    caption: 'Fresh towels delivered to your room',
    priority: 'normal',
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-8 w-8 transition-transform duration-200 group-hover:scale-105"
      >
        <path
          d="M4 6.5h12a2 2 0 0 1 2 2V12H6a2 2 0 0 1-2-2V6.5ZM6 12h12a2 2 0 0 1 2 2v3.5H8a2 2 0 0 1-2-2V12ZM4 17.5h12a2 2 0 0 1 2 2V21H6a2 2 0 0 1-2-2v-1.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    type: 'cleaning',
    title: 'Cleaning',
    caption: 'Request housekeeping for your room',
    priority: 'normal',
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-8 w-8 transition-transform duration-200 group-hover:scale-105"
      >
        <path
          d="M6 20h4M8 20l7-12M13.5 5.5l4.5 4.5M17 3v2M17 10v2M14 7h2M20 7h2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    type: 'water',
    title: 'Water',
    caption: 'Ask for bottled water refill',
    priority: 'low',
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-8 w-8 transition-transform duration-200 group-hover:scale-105"
      >
        <path
          d="M12 3.5c3.4 3.9 5.8 6.8 5.8 10a5.8 5.8 0 1 1-11.6 0c0-3.2 2.4-6.1 5.8-10ZM9.5 14.3a2.5 2.5 0 0 0 2.5 2.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    type: 'issue',
    title: 'Report an issue',
    caption: 'Tell us what needs attention',
    priority: 'high',
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-8 w-8 transition-transform duration-200 group-hover:scale-105"
      >
        <path
          d="M12 9.2v5.2M12 17.6h.01M10.3 4.8 4 16.3a2 2 0 0 0 1.8 2.9h12.4a2 2 0 0 0 1.8-2.9L13.7 4.8a2 2 0 0 0-3.4 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const HOTEL_SERVICES: ServiceItem[] = [
  { name: 'Late checkout', caption: 'Extend your checkout timing' },
  { name: 'Breakfast', caption: 'Add breakfast to your stay' },
  { name: 'Spa', caption: 'Book a wellness appointment' },
  { name: 'Taxi', caption: 'Arrange transport pickup' },
];

const FAQ_ITEMS = [
  {
    question: 'How quickly are requests handled?',
    answer: 'Most requests are acknowledged within minutes and completed based on availability.',
  },
  {
    question: 'Can I submit multiple requests?',
    answer: 'Yes. You can submit as many requests as you need from this page.',
  },
  {
    question: 'Can I schedule a request?',
    answer: 'Yes. Use the schedule options in the request panel before sending.',
  },
  {
    question: 'Do I need to call reception after submitting?',
    answer: 'No. Your request is sent directly to the staff dashboard.',
  },
];

function getScheduledFor(option: ScheduleOption): string | undefined {
  if (option === 'now') {
    return undefined;
  }

  const hoursToAdd = option === '1h' ? 1 : 2;
  const date = new Date();
  date.setHours(date.getHours() + hoursToAdd);
  return date.toISOString();
}

function normalizeGuestRoomStatus(status: string | undefined): GuestRoomStatus {
  if (!status) {
    return null;
  }

  if (status === 'dnd' || status === 'do_not_disturb') {
    return 'do_not_disturb';
  }

  if (status === 'please_clean') {
    return 'please_clean';
  }

  if (status === 'maintenance_needed') {
    return 'maintenance_needed';
  }

  return null;
}

function getRoomStatusBadge(status: GuestRoomStatus): { label: string; className: string } {
  if (status === 'do_not_disturb') {
    return {
      label: 'Do not disturb',
      className: 'bg-violet-50 text-violet-700 ring-violet-200',
    };
  }

  if (status === 'please_clean') {
    return {
      label: 'Please clean',
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    };
  }

  if (status === 'maintenance_needed') {
    return {
      label: 'Maintenance needed',
      className: 'bg-amber-50 text-amber-700 ring-amber-200',
    };
  }

  return {
    label: 'No status',
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
}

export default function ReservationTokenPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';

  const [requests, setRequests] = useState<GuestRequest[]>([]);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<GuestRoomStatus>(null);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [note, setNote] = useState('');
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>('now');
  const [showSentToast, setShowSentToast] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    function refreshRoomData() {
      setRequests(getRoomRequests(token));
      const room = getRoomByToken(token);
      setRoomNumber(room?.roomNumber ?? null);
      setRoomStatus(normalizeGuestRoomStatus(room?.roomStatus));
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === ROOMS_STORAGE_KEY || event.key === REQUESTS_STORAGE_KEY) {
        refreshRoomData();
      }
    }

    if (!token) {
      return;
    }

    refreshRoomData();
    window.addEventListener('focus', refreshRoomData);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', refreshRoomData);
      window.removeEventListener('storage', handleStorage);
    };
  }, [token]);

  useEffect(() => {
    if (!showSentToast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowSentToast(false);
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [showSentToast]);

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [requests]);
  const roomStatusBadge = useMemo(() => getRoomStatusBadge(roomStatus), [roomStatus]);

  function openRequestPanel(type: string, title: string, priority: RequestPriority) {
    setPendingRequest({ type, title, priority });
    setNote('');
    setScheduleOption('now');
  }

  function closeRequestPanel() {
    setPendingRequest(null);
    setNote('');
    setScheduleOption('now');
  }

  function handleSendRequest() {
    if (!pendingRequest || !token) {
      return;
    }

    createRequest(token, pendingRequest.type, {
      note,
      scheduledFor: getScheduledFor(scheduleOption),
      priority: pendingRequest.priority,
      roomNumber: roomNumber ?? undefined,
    });

    setRequests(getRoomRequests(token));
    closeRequestPanel();
    setShowSentToast(true);
  }

  const isValidRoomLink = Boolean(roomNumber);

  return (
    <section className="space-y-8">
      {showSentToast && (
        <div className="animate-toast fixed right-4 top-4 z-50 w-[min(92vw,20rem)] rounded-2xl bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-2xl ring-1 ring-slate-200 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                <path
                  d="m5 12 4.2 4.2L19 6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <p className="font-medium text-slate-900">Request sent</p>
              <p className="text-xs text-slate-500">The staff team has been notified.</p>
            </div>
          </div>
        </div>
      )}

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            {isValidRoomLink ? `Hi, Room ${roomNumber}` : 'Invalid room link'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">Request services without calling reception</p>
          {isValidRoomLink && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/r/${token}/services`}
                className="inline-flex rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
              >
                Services
              </Link>
              <Link
                href={`/r/${token}/room-status`}
                className="inline-flex rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Room status
              </Link>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${roomStatusBadge.className}`}
          >
            {roomStatusBadge.label}
          </span>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Connected
          </div>
        </div>
      </header>

      {!isValidRoomLink && (
        <section className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
          <p className="text-sm text-slate-600">
            Invalid room link. Please scan the QR code again or contact reception.
          </p>
        </section>
      )}

      {isValidRoomLink && <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">Quick requests</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {QUICK_REQUESTS.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() =>
                router.push(`/r/${token}/request?type=${encodeURIComponent(item.title)}`)
              }
              className="group rounded-2xl bg-white/70 p-4 text-left shadow-sm ring-1 ring-white/60 backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-xl hover:ring-indigo-200"
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition duration-200 group-hover:bg-indigo-100">
                {item.icon}
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">{item.caption}</p>
            </button>
          ))}
        </div>
      </section>}

      {isValidRoomLink && <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">Hotel services</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {HOTEL_SERVICES.map((service) => (
            <button
              key={service.name}
              type="button"
              onClick={() =>
                openRequestPanel(`Service: ${service.name}`, `Service: ${service.name}`, 'normal')
              }
              className="rounded-2xl bg-white/70 p-4 text-left shadow-sm ring-1 ring-white/60 backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-indigo-200"
            >
              <p className="text-sm font-semibold text-slate-900">{service.name}</p>
              <p className="mt-1 text-xs text-slate-500">{service.caption}</p>
            </button>
          ))}
        </div>
      </section>}

      {pendingRequest && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm"
          onClick={closeRequestPanel}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900">{pendingRequest.title}</h3>
            <p className="mt-1 text-sm text-slate-500">Add details and choose schedule (optional).</p>

            <label htmlFor="request-note" className="mt-4 block text-xs font-medium text-slate-600">
              Note
            </label>
            <textarea
              id="request-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Any specific detail for the team"
              className="mt-2 w-full rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-indigo-300"
            />

            <p className="mt-4 text-xs font-medium text-slate-600">Schedule</p>
            <div className="mt-2 inline-flex rounded-xl bg-slate-100 p-1">
              {(['now', '1h', '2h'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScheduleOption(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    scheduleOption === option
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option === 'now' ? 'Now' : option}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeRequestPanel}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendRequest}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:brightness-110"
              >
                Send request
              </button>
            </div>
          </div>
        </div>
      )}

      {isValidRoomLink && <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">Your requests</h2>

        {sortedRequests.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-500 ring-1 ring-white/60 backdrop-blur-md">
            No requests yet for this room.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {sortedRequests.map((request) => (
              <li
                key={request.id}
                className="rounded-2xl bg-white/75 px-4 py-3 shadow-sm ring-1 ring-white/60 backdrop-blur-md"
              >
                <Link href={`/r/${token}/requests/${request.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{formatRequestType(request.type)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{formatRelativeTime(request.createdAt)}</p>
                      {request.scheduledFor && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          Scheduled {formatRelativeTime(request.scheduledFor)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${getStatusBadgeClassName(request.status)}`}
                    >
                      {formatStatusLabel(request.status)}
                    </span>
                  </div>
                  {request.note && <p className="mt-2 text-xs text-slate-500">Note: {request.note}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">FAQ</h2>
        <div className="mt-3 space-y-2">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;

            return (
              <div key={item.question} className="rounded-xl bg-white/70 ring-1 ring-white/60 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-slate-900">{item.question}</span>
                  <span className="text-slate-500">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <p className="px-4 pb-3 text-sm text-slate-600">{item.answer}</p>}
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
