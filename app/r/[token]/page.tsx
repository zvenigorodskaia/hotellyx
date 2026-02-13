'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Field';
import {
  REQUESTS_STORAGE_KEY,
  ROOMS_STORAGE_KEY,
  createRequest,
  formatRelativeTime,
  formatRequestType,
  formatStatusLabel,
  getRequestStatusTheme,
  getRoomStatusTheme,
  getRoomByToken,
  getRoomRequests,
  isValidRoomToken,
  normalizeRoomToken,
  setRoomStatus,
  type GuestRequest,
  type RequestPriority,
  type RoomStatus,
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

const ROOM_STATUS_OPTIONS: Array<{ value: RoomStatus; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'dnd', label: 'Do not disturb' },
  { value: 'please_clean', label: 'Please clean' },
  { value: 'maintenance_needed', label: 'Maintenance needed' },
];

const QUICK_REQUESTS: QuickRequestItem[] = [
  {
    type: 'towels',
    title: 'Towels',
    caption: 'Fresh towels delivered to your room',
    priority: 'normal',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-10 w-10">
        <path
          d="M4 6.5h12a2 2 0 0 1 2 2V12H6a2 2 0 0 1-2-2V6.5ZM6 12h12a2 2 0 0 1 2 2v3.5H8a2 2 0 0 1-2-2V12ZM4 17.5h12a2 2 0 0 1 2 2V21H6a2 2 0 0 1-2-2v-1.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
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
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-10 w-10">
        <path
          d="M6 20h4M8 20l7-12M13.5 5.5l4.5 4.5M17 3v2M17 10v2M14 7h2M20 7h2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
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
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-10 w-10">
        <path
          d="M12 3.5c3.4 3.9 5.8 6.8 5.8 10a5.8 5.8 0 1 1-11.6 0c0-3.2 2.4-6.1 5.8-10ZM9.5 14.3a2.5 2.5 0 0 0 2.5 2.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
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
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-10 w-10">
        <path
          d="M12 9.2v5.2M12 17.6h.01M10.3 4.8 4 16.3a2 2 0 0 0 1.8 2.9h12.4a2 2 0 0 0 1.8-2.9L13.7 4.8a2 2 0 0 0-3.4 0Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
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

function normalizeRoomStatus(status: string | undefined): RoomStatus {
  if (status === 'dnd' || status === 'please_clean' || status === 'maintenance_needed' || status === 'normal') {
    return status;
  }

  if (status === 'do_not_disturb') {
    return 'dnd';
  }

  return 'normal';
}

export default function ReservationTokenPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = normalizeRoomToken(params?.token ?? '');
  const tokenIsValid = isValidRoomToken(token);

  const [requests, setRequests] = useState<GuestRequest[]>([]);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [roomStatus, setCurrentRoomStatus] = useState<RoomStatus>('normal');
  const [resolvedRoomToken, setResolvedRoomToken] = useState('');
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [note, setNote] = useState('');
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>('now');
  const [showSentToast, setShowSentToast] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    function refreshRoomData() {
      if (!tokenIsValid) {
        setRequests([]);
        setRoomNumber(null);
        setResolvedRoomToken('');
        setCurrentRoomStatus('normal');
        return;
      }

      const room = getRoomByToken(token);
      const effectiveToken = room?.token ?? token;
      setResolvedRoomToken(effectiveToken);
      setRequests(getRoomRequests(effectiveToken));
      setRoomNumber(room?.roomNumber ?? token);
      setCurrentRoomStatus(normalizeRoomStatus(room?.roomStatus ?? 'normal'));
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
  }, [token, tokenIsValid]);

  useEffect(() => {
    if (!showSentToast) {
      return;
    }

    const timeout = window.setTimeout(() => setShowSentToast(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [showSentToast]);

  const sortedRequests = useMemo(() => [...requests].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [requests]);
  const roomStatusTheme = useMemo(() => getRoomStatusTheme(roomStatus), [roomStatus]);

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
    if (!pendingRequest || !resolvedRoomToken || !roomNumber) {
      return;
    }

    createRequest(resolvedRoomToken, pendingRequest.type, {
      note,
      scheduledFor: getScheduledFor(scheduleOption),
      priority: pendingRequest.priority,
      roomNumber,
    });

    setRequests(getRoomRequests(resolvedRoomToken));
    closeRequestPanel();
    setShowSentToast(true);
  }

  function handleRoomStatusChange(nextStatus: RoomStatus) {
    setCurrentRoomStatus(nextStatus);
    setRoomStatus(resolvedRoomToken || token, nextStatus);
  }

  const isValidRoomLink = Boolean(roomNumber && tokenIsValid);

  return (
    <section className="space-y-8">
      {showSentToast && (
        <Card className="animate-toast fixed right-4 top-4 z-50 w-[min(92vw,20rem)] p-3 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center border border-border bg-surface-2 text-brand">
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
              <p className="font-medium text-text">Request sent</p>
              <p className="text-xs text-muted">The staff team has been notified.</p>
            </div>
          </div>
        </Card>
      )}

      <section>
        <div className="relative h-[340px] overflow-hidden border border-border">
          <img
            src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80"
            alt="Hotel room service lifestyle"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div
            className={`absolute inset-x-4 bottom-4 border p-4 backdrop-blur-sm ${roomStatusTheme.bgClass} ${roomStatusTheme.textClass} ${roomStatusTheme.borderClass}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-text">
                  {isValidRoomLink ? `Hi, Room ${roomNumber}` : 'Invalid room link'}
                </h1>
                <p className="mt-1 text-sm text-muted">Request services without calling reception</p>
              </div>

              {isValidRoomLink && (
                <div className="sm:min-w-[240px]">
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    <span className="text-muted">Room status</span>
                    <span className="relative inline-flex items-center">
                      <select
                        value={roomStatus}
                        onChange={(event) => handleRoomStatusChange(event.target.value as RoomStatus)}
                        className={`h-11 w-full appearance-none border px-4 py-3 pr-10 text-sm font-medium outline-none transition-colors hover:border-brand ${roomStatusTheme.bgClass} ${roomStatusTheme.textClass} ${roomStatusTheme.borderClass} ${roomStatusTheme.ringClass}`}
                      >
                        {ROOM_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 h-4 w-4 text-text" />
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {!isValidRoomLink && (
        <Card className="space-y-3">
          <h2 className="text-xl font-semibold text-text">Invalid room link</h2>
          <p className="text-sm text-muted">
            This room link is unavailable or malformed. Please scan the QR code again or contact reception.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => window.location.reload()} className="px-3.5 py-2 text-sm">
              Rescan QR code
            </Button>
            <Link href="/pages" className="btn-secondary px-3.5 py-2 text-sm">
              Go to pages
            </Link>
          </div>
        </Card>
      )}

      {isValidRoomLink && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Quick requests</h2>
            <Link href={`/r/${token}/services`} className="btn-secondary px-2.5 py-1 text-xs">
              All services
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUICK_REQUESTS.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => router.push(`/r/${token}/request?type=${encodeURIComponent(item.title)}`)}
                className="border border-border bg-surface p-5 text-left transition-colors hover:bg-surface-2"
              >
                <div className="text-muted">{item.icon}</div>
                <p className="mt-4 text-base font-semibold text-text">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.caption}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {isValidRoomLink && (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Hotel services</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {HOTEL_SERVICES.map((service) => (
              <button
                key={service.name}
                type="button"
                onClick={() => openRequestPanel(`Service: ${service.name}`, `Service: ${service.name}`, 'normal')}
                className="border border-border bg-surface-2 px-4 py-3 text-left transition-colors hover:bg-surface"
              >
                <p className="text-sm font-semibold text-text">{service.name}</p>
                <p className="mt-0.5 text-xs text-muted">{service.caption}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {pendingRequest && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4" onClick={closeRequestPanel}>
          <Card
            className="w-full max-w-md p-5"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-text">{pendingRequest.title}</h3>
            <p className="mt-1 text-sm text-muted">Add details and choose schedule (optional).</p>

            <label htmlFor="request-note" className="mt-4 block text-xs font-medium text-muted">
              Note
            </label>
            <Textarea
              id="request-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Any specific detail for the team"
              className="mt-2"
            />

            <p className="mt-4 text-xs font-medium text-muted">Schedule</p>
            <div className="mt-2 inline-flex border border-border bg-surface-2 p-1">
              {(['now', '1h', '2h'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScheduleOption(option)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    scheduleOption === option ? 'bg-surface text-text' : 'text-muted hover:bg-surface'
                  }`}
                >
                  {option === 'now' ? 'Now' : option}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeRequestPanel} className="px-3.5 py-2 text-sm">
                Cancel
              </Button>
              <Button type="button" onClick={handleSendRequest} className="px-3.5 py-2 text-sm">
                Send request
              </Button>
            </div>
          </Card>
        </div>
      )}

      {isValidRoomLink && (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">My requests</h2>

          {sortedRequests.length === 0 ? (
            <Card className="mt-3 text-sm text-muted">No requests yet for this room.</Card>
          ) : (
            <ul className="mt-3 space-y-2">
              {sortedRequests.map((request) => {
                const requestTheme = getRequestStatusTheme(request.status);

                return (
                  <li key={request.id} className={`border-l-4 px-4 py-3 ${requestTheme.rowBg} ${requestTheme.rowBorder}`}>
                    <Link href={`/r/${token}/requests/${request.id}`} className="block">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-text">{formatRequestType(request.type)}</p>
                          <p className="mt-0.5 text-xs text-muted">{formatRelativeTime(request.createdAt)}</p>
                          {request.scheduledFor && (
                            <p className="mt-0.5 text-xs text-muted">Scheduled {formatRelativeTime(request.scheduledFor)}</p>
                          )}
                        </div>
                        <Badge className={`${requestTheme.badgeBg} ${requestTheme.badgeText} ${requestTheme.badgeRing}`}>
                          {formatStatusLabel(request.status)}
                        </Badge>
                      </div>
                      {request.note && <p className="mt-2 text-xs text-muted">Note: {request.note}</p>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">FAQ</h2>
        <div className="mt-3 space-y-2">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;

            return (
              <Card key={item.question} className="p-0">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-text">{item.question}</span>
                  <span className="text-muted">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <p className="px-4 pb-3 text-sm text-muted">{item.answer}</p>}
              </Card>
            );
          })}
        </div>
      </section>
    </section>
  );
}
