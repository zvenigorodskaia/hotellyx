'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import RoomStatusDropdown from '@/components/ui/RoomStatusDropdown';
import { Textarea } from '@/components/ui/Field';
import {
  REQUESTS_STORAGE_KEY,
  ROOMS_STORAGE_KEY,
  createRequest,
  formatRelativeTime,
  formatRequestType,
  formatStatusLabel,
  getRequestTone,
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
type ServiceActionType = 'schedule' | 'current_bill' | 'personal_offers' | 'local_info';
type LocalInfoTab = 'hotel_picks' | 'walk_guide' | 'transport' | 'attractions' | 'weather';

type ScheduleRow = {
  label: string;
  value: string;
};

type BillCharge = {
  id: string;
  title: string;
  amountEur: number;
};

type PersonalOffer = {
  id: string;
  title: string;
  description: string;
  price: string;
};

type InfoPlace = {
  name: string;
  details: string;
};

type GuestActionModalData = {
  schedule: {
    title: string;
    rows: ScheduleRow[];
    timeLeft: string;
  };
  bill: {
    title: string;
    charges: BillCharge[];
    totalSoFarEur: number;
    toPayNowEur: number;
  };
  offers: {
    title: string;
    cards: PersonalOffer[];
  };
  localInfo: {
    title: string;
    hotelPicks: {
      restaurants: InfoPlace[];
      breakfastNearby: InfoPlace[];
      nightLife: InfoPlace[];
    };
    walkGuide: {
      title: string;
      stops: string[];
    };
    transport: InfoPlace[];
    attractionsSchedule: InfoPlace[];
    weather: InfoPlace[];
  };
};

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

const SERVICE_ACTIONS: Array<{ id: ServiceActionType; label: string }> = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'current_bill', label: 'Current bill' },
  { id: 'personal_offers', label: 'Personal offers' },
  { id: 'local_info', label: 'Local info' },
];

const GUEST_ACTION_MODAL_DATA: GuestActionModalData = {
  schedule: {
    title: 'Schedule',
    rows: [
      { label: 'Check-in date', value: '12 Feb 2026, 15:00' },
      { label: 'Check-out date', value: '15 Feb 2026, 11:00' },
      { label: 'Breakfast', value: '07:00-11:00 (Restaurant "Lumiere", Floor 1)' },
      { label: 'SPA', value: '10:00-20:00 (Appointments required)' },
      { label: 'Check-out', value: 'Until 11:00 (Late check-out available)' },
    ],
    timeLeft: '2 days 16 hours',
  },
  bill: {
    title: 'Current bill',
    charges: [
      { id: 'bill_breakfast', title: 'Breakfast package (2 guests)', amountEur: 48 },
      { id: 'bill_minibar', title: 'Mini bar', amountEur: 22 },
      { id: 'bill_late_checkout', title: 'Late check-out request (pending)', amountEur: 30 },
      { id: 'bill_city_tax', title: 'City tax', amountEur: 12 },
    ],
    totalSoFarEur: 112,
    toPayNowEur: 112,
  },
  offers: {
    title: 'Personal offers',
    cards: [
      {
        id: 'offer_spa',
        title: 'Couples spa massage',
        description: '60 min massage for two, includes sauna access',
        price: '160 EUR',
      },
      {
        id: 'offer_dinner',
        title: 'Romantic dinner',
        description: "Chef's tasting menu for two, candlelight seating",
        price: '220 EUR',
      },
      {
        id: 'offer_tour',
        title: 'Paris city tour',
        description: '3-hour guided walk + hidden spots',
        price: '95 EUR',
      },
      {
        id: 'offer_flowers',
        title: 'Flowers & champagne in room (proposal-ready)',
        description: 'Bouquet + chilled champagne delivered to your room at chosen time',
        price: '140 EUR',
      },
      {
        id: 'offer_restaurant',
        title: 'Restaurant booking near Eiffel Tower',
        description: 'Priority reservation assistance + confirmation message',
        price: 'Free service',
      },
    ],
  },
  localInfo: {
    title: 'Local info',
    hotelPicks: {
      restaurants: [
        { name: 'Maison Étoile', details: 'French fine dining, romantic - approx 70 EUR pp' },
        { name: 'Le Jardin Secret', details: 'Modern Parisian, intimate terrace - approx 55 EUR pp' },
        { name: 'Bistro Seine', details: 'Classic bistro, wine focused - approx 45 EUR pp' },
      ],
      breakfastNearby: [
        { name: 'Morning Fleur', details: 'Pastries and coffee - approx 14 EUR pp' },
        { name: 'Cafe Montrose', details: 'Brunch and eggs - approx 18 EUR pp' },
        { name: 'Pain Lumiere', details: 'Bakery and light breakfast - approx 10 EUR pp' },
      ],
      nightLife: [
        { name: 'Velvet Room', details: 'Cocktail lounge, dressy' },
        { name: 'Noir Bar', details: 'Late bar with DJ, premium crowd' },
        { name: 'Pulse Club Paris', details: 'Night club, electronic sets' },
      ],
    },
    walkGuide: {
      title: '4-hour walking guide',
      stops: [
        '1. Hotel lobby - start with coffee nearby',
        '2. Rue Cler market stroll',
        '3. Les Invalides courtyard',
        '4. Pont Alexandre III photo stop',
        "5. Champs de Mars gardens walk",
        '6. Eiffel Tower viewpoint and finish',
      ],
    },
    transport: [
      { name: 'To CDG airport', details: 'Taxi 45-60 min, 55-70 EUR. RER + Metro 60-75 min, 12 EUR' },
      { name: 'To ORY airport', details: 'Taxi 30-45 min, 35-50 EUR. Metro + Orlyval 45-60 min, 14 EUR' },
      { name: 'To Louvre', details: 'Metro line 1, about 20 min. Taxi about 18 min' },
      { name: 'To Eiffel Tower', details: 'Walk 20-30 min or Metro line 6, about 15 min' },
      { name: 'To Montmartre', details: 'Metro lines 12/2, about 35 min. Taxi 25-35 min' },
    ],
    attractionsSchedule: [
      { name: 'Eiffel Tower', details: '09:30-23:45' },
      { name: 'Louvre', details: '09:00-18:00 (closed Tue)' },
      { name: 'Musee d’Orsay', details: '09:30-18:00 (closed Mon)' },
    ],
    weather: [
      { name: 'Today', details: '12°C / 6°C, partly cloudy' },
      { name: 'Tomorrow', details: '10°C / 5°C, light rain' },
    ],
  },
};

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
  const [activeServiceAction, setActiveServiceAction] = useState<ServiceActionType | null>(null);
  const [showPaymentToast, setShowPaymentToast] = useState(false);
  const [requestedOffers, setRequestedOffers] = useState<Record<string, boolean>>({});
  const [localInfoTab, setLocalInfoTab] = useState<LocalInfoTab>('hotel_picks');
  const actionModalRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!showPaymentToast) {
      return;
    }

    const timeout = window.setTimeout(() => setShowPaymentToast(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [showPaymentToast]);

  useEffect(() => {
    if (!activeServiceAction) {
      return;
    }

    const previousFocused = document.activeElement as HTMLElement | null;

    function getFocusable(container: HTMLElement): HTMLElement[] {
      const selectors = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ];
      return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(',')));
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveServiceAction(null);
        return;
      }

      if (event.key !== 'Tab' || !actionModalRef.current) {
        return;
      }

      const focusable = getFocusable(actionModalRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (activeElement === first || !actionModalRef.current.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
      } else if (activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const focusTimer = window.setTimeout(() => {
      if (!actionModalRef.current) {
        return;
      }
      const focusable = getFocusable(actionModalRef.current);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }, 0);

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      previousFocused?.focus();
    };
  }, [activeServiceAction]);

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

  function handleBookOffer(offerId: string) {
    setRequestedOffers((current) => ({ ...current, [offerId]: true }));
  }

  const isValidRoomLink = Boolean(roomNumber && tokenIsValid);

  return (
    <section className="space-y-10">
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

      {showPaymentToast && (
        <Card className="animate-toast fixed right-4 top-20 z-50 w-[min(92vw,24rem)] p-3 shadow-soft">
          <p className="font-medium text-text">Payment flow coming soon</p>
        </Card>
      )}

      <section>
        <div className="relative h-[360px] border border-border shadow-soft">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src="/room.jpg"
              alt="Hotel room service lifestyle"
              className="h-full w-full object-cover"
            />
          </div>
          <div
            className="absolute inset-x-4 bottom-4 z-20 bg-[#00000057] p-5 backdrop-blur-[10px]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-serif text-5xl leading-[1.14] tracking-[0.01em] text-white md:text-6xl">
                  {isValidRoomLink ? `Hi, Room ${roomNumber}` : 'Invalid room link'}
                </h1>
                <p className="mt-1 text-sm text-white/90">Request services without calling reception</p>
              </div>

              {isValidRoomLink && (
                <div className="sm:min-w-[240px]">
                  <label className="flex flex-col gap-1 text-xs font-medium">
                    <span className="text-white/85">Room status</span>
                    <RoomStatusDropdown
                      value={roomStatus}
                      onChange={handleRoomStatusChange}
                      options={ROOM_STATUS_OPTIONS}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {!isValidRoomLink && (
        <Card className="space-y-3">
          <h2 className="type-section-title">Invalid room link</h2>
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="type-kicker">Quick requests</h2>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link href={`/r/${token}/services`} className="btn-primary px-2.5 py-1 text-xs">
                All services
              </Link>
              {SERVICE_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setActiveServiceAction(action.id)}
                  className="btn-secondary px-2.5 py-1 text-xs"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUICK_REQUESTS.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => router.push(`/r/${token}/request?type=${encodeURIComponent(item.title)}`)}
                className="border border-border bg-surface p-6 text-left shadow-soft transition-all duration-200 hover:bg-[rgba(103,20,14,0.03)] hover:shadow-[0_14px_42px_rgba(0,0,0,0.04)]"
              >
                <div className="text-muted">{item.icon}</div>
                <p className="mt-4 type-card-title">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.caption}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeServiceAction && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(26,20,16,0.2)] p-0 sm:items-center sm:p-4"
          onClick={() => setActiveServiceAction(null)}
        >
          <div
            ref={actionModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-action-title"
            className="card-base h-[92vh] w-full overflow-y-auto p-5 sm:h-auto sm:max-h-[88vh] sm:max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 id="service-action-title" className="type-section-title">
                {activeServiceAction === 'schedule' && GUEST_ACTION_MODAL_DATA.schedule.title}
                {activeServiceAction === 'current_bill' && GUEST_ACTION_MODAL_DATA.bill.title}
                {activeServiceAction === 'personal_offers' && GUEST_ACTION_MODAL_DATA.offers.title}
                {activeServiceAction === 'local_info' && GUEST_ACTION_MODAL_DATA.localInfo.title}
              </h3>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveServiceAction(null)}
                className="h-8 min-h-8 w-8 px-0 py-0 text-base"
                aria-label="Close modal"
              >
                ×
              </Button>
            </div>

            {activeServiceAction === 'schedule' && (
              <div className="space-y-3">
                {GUEST_ACTION_MODAL_DATA.schedule.rows.map((row) => (
                  <div key={row.label} className="flex flex-col gap-1 border border-border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between">
                    <p className="type-kicker">{row.label}</p>
                    <p className="text-sm text-text sm:text-right">{row.value}</p>
                  </div>
                ))}
                <div className="border border-[rgba(103,20,14,0.25)] bg-[rgba(103,20,14,0.06)] p-4">
                  <p className="text-sm font-medium text-[rgb(103,20,14)]">
                    Time left until check-out: {GUEST_ACTION_MODAL_DATA.schedule.timeLeft}
                  </p>
                </div>
              </div>
            )}

            {activeServiceAction === 'current_bill' && (
              <div className="space-y-4">
                <ul className="space-y-2">
                  {GUEST_ACTION_MODAL_DATA.bill.charges.map((charge) => (
                    <li key={charge.id} className="flex items-center justify-between border border-border bg-surface p-4">
                      <span className="text-sm text-text">{charge.title}</span>
                      <span className="text-sm font-medium text-text">{charge.amountEur} EUR</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 border border-border bg-surface p-4">
                  <p className="flex items-center justify-between text-sm">
                    <span className="text-muted">Total so far</span>
                    <span className="font-medium text-text">{GUEST_ACTION_MODAL_DATA.bill.totalSoFarEur} EUR</span>
                  </p>
                  <p className="flex items-center justify-between text-sm">
                    <span className="text-muted">To pay now</span>
                    <span className="font-medium text-text">{GUEST_ACTION_MODAL_DATA.bill.toPayNowEur} EUR</span>
                  </p>
                </div>

                <Button type="button" onClick={() => setShowPaymentToast(true)} className="px-4 py-2 text-sm">
                  Pay now
                </Button>
              </div>
            )}

            {activeServiceAction === 'personal_offers' && (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GUEST_ACTION_MODAL_DATA.offers.cards.map((offer) => {
                  const sent = Boolean(requestedOffers[offer.id]);
                  return (
                    <li key={offer.id} className="border border-border bg-surface p-4">
                      <p className="type-card-title">{offer.title}</p>
                      <p className="mt-2 text-sm text-muted">{offer.description}</p>
                      <p className="mt-3 text-sm font-medium text-text">{offer.price}</p>
                      <div className="mt-3">
                        {sent ? (
                          <p className="text-sm font-medium text-[rgb(103,20,14)]">Request sent</p>
                        ) : (
                          <Button type="button" onClick={() => handleBookOffer(offer.id)} className="px-3 py-1.5 text-xs">
                            Book
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {activeServiceAction === 'local_info' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setLocalInfoTab('hotel_picks')}
                    className={localInfoTab === 'hotel_picks' ? 'tabs-trigger tabs-trigger-active' : 'tabs-trigger'}
                  >
                    Hotel picks
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalInfoTab('walk_guide')}
                    className={localInfoTab === 'walk_guide' ? 'tabs-trigger tabs-trigger-active' : 'tabs-trigger'}
                  >
                    Walk guide
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalInfoTab('transport')}
                    className={localInfoTab === 'transport' ? 'tabs-trigger tabs-trigger-active' : 'tabs-trigger'}
                  >
                    Transport
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalInfoTab('attractions')}
                    className={localInfoTab === 'attractions' ? 'tabs-trigger tabs-trigger-active' : 'tabs-trigger'}
                  >
                    Attractions schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalInfoTab('weather')}
                    className={localInfoTab === 'weather' ? 'tabs-trigger tabs-trigger-active' : 'tabs-trigger'}
                  >
                    Weather
                  </button>
                </div>

                {localInfoTab === 'hotel_picks' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="type-kicker">Recommended restaurants from the hotel</p>
                      <ul className="space-y-2">
                        {GUEST_ACTION_MODAL_DATA.localInfo.hotelPicks.restaurants.map((item) => (
                          <li key={item.name} className="border border-border bg-surface p-3">
                            <p className="type-card-title">{item.name}</p>
                            <p className="text-sm text-muted">{item.details}</p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="type-kicker">Where to have breakfast nearby</p>
                      <ul className="space-y-2">
                        {GUEST_ACTION_MODAL_DATA.localInfo.hotelPicks.breakfastNearby.map((item) => (
                          <li key={item.name} className="border border-border bg-surface p-3">
                            <p className="type-card-title">{item.name}</p>
                            <p className="text-sm text-muted">{item.details}</p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="type-kicker">Best night clubs and bars</p>
                      <ul className="space-y-2">
                        {GUEST_ACTION_MODAL_DATA.localInfo.hotelPicks.nightLife.map((item) => (
                          <li key={item.name} className="border border-border bg-surface p-3">
                            <p className="type-card-title">{item.name}</p>
                            <p className="text-sm text-muted">{item.details}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {localInfoTab === 'walk_guide' && (
                  <div className="space-y-2">
                    <p className="type-kicker">{GUEST_ACTION_MODAL_DATA.localInfo.walkGuide.title}</p>
                    <ol className="space-y-2">
                      {GUEST_ACTION_MODAL_DATA.localInfo.walkGuide.stops.map((stop) => (
                        <li key={stop} className="border border-border bg-surface p-3 text-sm text-text">
                          {stop}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {localInfoTab === 'transport' && (
                  <ul className="space-y-2">
                    {GUEST_ACTION_MODAL_DATA.localInfo.transport.map((item) => (
                      <li key={item.name} className="border border-border bg-surface p-3">
                        <p className="type-card-title">{item.name}</p>
                        <p className="text-sm text-muted">{item.details}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {localInfoTab === 'attractions' && (
                  <ul className="space-y-2">
                    {GUEST_ACTION_MODAL_DATA.localInfo.attractionsSchedule.map((item) => (
                      <li key={item.name} className="flex items-center justify-between border border-border bg-surface p-3">
                        <p className="type-card-title">{item.name}</p>
                        <p className="text-sm text-muted">{item.details}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {localInfoTab === 'weather' && (
                  <ul className="space-y-2">
                    {GUEST_ACTION_MODAL_DATA.localInfo.weather.map((item) => (
                      <li key={item.name} className="flex items-center justify-between border border-border bg-surface p-3">
                        <p className="type-card-title">{item.name}</p>
                        <p className="text-sm text-muted">{item.details}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isValidRoomLink && (
        <section>
          <h2 className="type-kicker">Hotel services</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {HOTEL_SERVICES.map((service) => (
              <button
                key={service.name}
                type="button"
                onClick={() => openRequestPanel(`Service: ${service.name}`, `Service: ${service.name}`, 'normal')}
                className="border border-border bg-surface px-5 py-4 text-left shadow-soft transition-colors hover:bg-[rgba(103,20,14,0.03)]"
              >
                <p className="type-card-title">{service.name}</p>
                <p className="mt-0.5 text-xs text-muted">{service.caption}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {pendingRequest && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(26,20,16,0.16)] px-4"
          onClick={closeRequestPanel}
        >
          <Card
            className="w-full max-w-md p-5"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="type-section-title">{pendingRequest.title}</h3>
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
          <h2 className="type-kicker">My requests</h2>

          {sortedRequests.length === 0 ? (
            <Card className="mt-3 text-sm text-muted">No requests yet for this room.</Card>
          ) : (
            <ul className="mt-3 space-y-2">
              {sortedRequests.map((request) => {
                const requestTheme = getRequestStatusTheme(request.status);
                const inlineColors = getRequestTone(request.status);

                return (
                  <li key={request.id} className={`border px-4 py-3 ${requestTheme.rowBg} ${requestTheme.rowBorder}`}>
                    <Link href={`/r/${token}/requests/${request.id}`} className="block">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium" style={{ color: inlineColors.titleColor }}>
                            {formatRequestType(request.type)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">{formatRelativeTime(request.createdAt)}</p>
                          {request.scheduledFor && (
                            <p className="mt-0.5 text-xs text-muted">Scheduled {formatRelativeTime(request.scheduledFor)}</p>
                          )}
                        </div>
                        <Badge
                          className={`${requestTheme.badgeRing}`}
                          style={{ backgroundColor: inlineColors.badgeBg, color: inlineColors.badgeText }}
                        >
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
        <h2 className="type-kicker">FAQ</h2>
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
