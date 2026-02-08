export const REQUESTS_STORAGE_KEY = 'hotellyx_requests';
export const ROOMS_STORAGE_KEY = 'hotellyx_rooms';
export const SERVICES_STORAGE_KEY = 'hotellyx_services';
export const SERVICE_VIEWS_STORAGE_KEY = 'hotellyx_service_views';

export type RequestStatus = 'new' | 'accepted' | 'in_progress' | 'done' | 'cancelled';
export type RequestPriority = 'low' | 'normal' | 'high';

export type GuestRequest = {
  id: string;
  roomToken: string;
  roomNumber?: string;
  type: string;
  status: RequestStatus;
  createdAt: string;
  note?: string;
  scheduledFor?: string;
  priority?: RequestPriority;
  staffNote?: string;
  assignedTeam?: string;
  assignedPerson?: string;
  etaMinutes?: number;
  acceptedAt?: string;
  inProgressAt?: string;
  doneAt?: string;
  cancelledAt?: string;
};

export type RoomRecord = {
  roomNumber: string;
  token: string;
  createdAt: string;
  roomStatus: RoomStatus;
};

export type RoomStatus = 'dnd' | 'please_clean' | 'maintenance_needed';

export type ServiceCategory =
  | 'Housekeeping'
  | 'Food & Drinks'
  | 'Wellness'
  | 'Transport'
  | 'Conference'
  | 'Other';

export type ServiceActionLabel = 'Book' | 'Request' | 'Add';

export type ServiceUpsellRules = {
  showPreArrival: boolean;
  showWhenLateCheckoutNotBought: boolean;
};

export type AdminService = {
  id: string;
  name: string;
  category: ServiceCategory;
  priceText: string;
  active: boolean;
  availability?: string[];
  upsellRules?: ServiceUpsellRules;
  createdAt: string;
};

export type ServiceItem = AdminService & {
  actionLabel: ServiceActionLabel;
  description?: string;
  duration?: string;
  location?: string;
  notes?: string;
};

type CreateRequestInput = {
  note?: string;
  scheduledFor?: string;
  priority?: RequestPriority;
  roomNumber?: string;
};

const STATUS_FLOW: RequestStatus[] = ['new', 'accepted', 'in_progress', 'done'];
const REQUEST_STATUSES: RequestStatus[] = ['new', 'accepted', 'in_progress', 'done', 'cancelled'];
const REQUEST_PRIORITIES: RequestPriority[] = ['low', 'normal', 'high'];
const ROOM_STATUSES: RoomStatus[] = ['dnd', 'please_clean', 'maintenance_needed'];
const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Housekeeping',
  'Food & Drinks',
  'Wellness',
  'Transport',
  'Conference',
  'Other',
];
const SERVICE_ACTIONS: ServiceActionLabel[] = ['Book', 'Request', 'Add'];

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'svc_spa_massage',
    name: 'Spa massage',
    category: 'Wellness',
    priceText: 'from €60',
    active: true,
    createdAt: '2026-02-07T00:00:00.000Z',
    actionLabel: 'Book',
    description: 'Relaxing full-body massage by certified therapists.',
    availability: ['2026-02-07T13:00:00.000Z', '2026-02-07T15:00:00.000Z', '2026-02-07T17:00:00.000Z'],
    duration: '60 min',
    location: 'Spa floor, level 2',
    notes: 'Please arrive 10 minutes before your slot.',
  },
  {
    id: 'svc_airport_taxi',
    name: 'Airport taxi',
    category: 'Transport',
    priceText: 'from €35',
    active: true,
    createdAt: '2026-02-07T00:00:00.000Z',
    actionLabel: 'Book',
    description: 'Private transfer service between hotel and airport.',
    availability: ['2026-02-07T12:30:00.000Z', '2026-02-07T14:00:00.000Z', '2026-02-07T18:00:00.000Z'],
    duration: '30–60 min',
    location: 'Hotel main entrance',
  },
  {
    id: 'svc_breakfast',
    name: 'Breakfast',
    category: 'Food & Drinks',
    priceText: '€12',
    active: true,
    createdAt: '2026-02-07T00:00:00.000Z',
    actionLabel: 'Add',
    description: 'Continental breakfast buffet with hot and cold options.',
    availability: ['2026-02-08T07:00:00.000Z', '2026-02-08T08:00:00.000Z', '2026-02-08T09:00:00.000Z'],
    location: 'Restaurant, ground floor',
  },
  {
    id: 'svc_extra_towels',
    name: 'Extra towels',
    category: 'Housekeeping',
    priceText: 'Included',
    active: true,
    createdAt: '2026-02-07T00:00:00.000Z',
    actionLabel: 'Request',
    description: 'Additional towel set delivered to your room.',
    duration: '10–20 min',
  },
  {
    id: 'svc_meeting_room',
    name: 'Meeting room setup',
    category: 'Conference',
    priceText: 'from €40',
    active: true,
    createdAt: '2026-02-07T00:00:00.000Z',
    actionLabel: 'Book',
    description: 'Reserve and prepare a private meeting space.',
    availability: ['2026-02-07T11:00:00.000Z', '2026-02-07T16:00:00.000Z'],
    location: 'Business center, level 1',
  },
];

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isRequestStatus(value: unknown): value is RequestStatus {
  return typeof value === 'string' && REQUEST_STATUSES.includes(value as RequestStatus);
}

function isRequestPriority(value: unknown): value is RequestPriority {
  return typeof value === 'string' && REQUEST_PRIORITIES.includes(value as RequestPriority);
}

function isServiceCategory(value: unknown): value is ServiceCategory {
  return typeof value === 'string' && SERVICE_CATEGORIES.includes(value as ServiceCategory);
}

function isServiceAction(value: unknown): value is ServiceActionLabel {
  return typeof value === 'string' && SERVICE_ACTIONS.includes(value as ServiceActionLabel);
}

function isRoomStatus(value: unknown): value is RoomStatus {
  return typeof value === 'string' && ROOM_STATUSES.includes(value as RoomStatus);
}

function parseRequests(raw: string | null): GuestRequest[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Record<string, unknown> => {
        if (typeof item !== 'object' || item === null) {
          return false;
        }

        return (
          typeof item.id === 'string' &&
          typeof item.roomToken === 'string' &&
          typeof item.type === 'string' &&
          isRequestStatus(item.status) &&
          typeof item.createdAt === 'string'
        );
      })
      .map((item) => {
        const possibleNote = (item.note ?? item.notes ?? item.message ?? item.details) as
          | string
          | undefined;
        const normalizedNote = possibleNote?.trim();

        const possibleStaffNote = item.staffNote as string | undefined;
        const normalizedStaffNote = possibleStaffNote?.trim();

        const possibleScheduledFor = item.scheduledFor as string | undefined;
        const possibleRoomNumber = item.roomNumber as string | undefined;
        const acceptedAt = item.acceptedAt as string | undefined;
        const inProgressAt = item.inProgressAt as string | undefined;
        const doneAt = item.doneAt as string | undefined;
        const cancelledAt = item.cancelledAt as string | undefined;
        const assignedTeam = item.assignedTeam as string | undefined;
        const assignedPerson = item.assignedPerson as string | undefined;
        const etaMinutes = item.etaMinutes as number | undefined;

        return {
          id: item.id as string,
          roomToken: item.roomToken as string,
          type: item.type as string,
          status: item.status as RequestStatus,
          createdAt: item.createdAt as string,
          ...(typeof possibleRoomNumber === 'string' ? { roomNumber: possibleRoomNumber } : {}),
          ...(normalizedNote ? { note: normalizedNote } : {}),
          ...(typeof possibleScheduledFor === 'string' ? { scheduledFor: possibleScheduledFor } : {}),
          ...(isRequestPriority(item.priority) ? { priority: item.priority } : {}),
          ...(normalizedStaffNote ? { staffNote: normalizedStaffNote } : {}),
          ...(typeof assignedTeam === 'string' ? { assignedTeam } : {}),
          ...(typeof assignedPerson === 'string' ? { assignedPerson } : {}),
          ...(typeof etaMinutes === 'number' && Number.isFinite(etaMinutes) ? { etaMinutes } : {}),
          ...(typeof acceptedAt === 'string' ? { acceptedAt } : {}),
          ...(typeof inProgressAt === 'string' ? { inProgressAt } : {}),
          ...(typeof doneAt === 'string' ? { doneAt } : {}),
          ...(typeof cancelledAt === 'string' ? { cancelledAt } : {}),
        };
      });
  } catch {
    return [];
  }
}

function parseRooms(raw: string | null): RoomRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => {
        const roomNumber =
          typeof item.roomNumber === 'string'
            ? item.roomNumber
            : typeof item.roomToken === 'string'
              ? item.roomToken
              : typeof item.token === 'string'
                ? item.token
                : '';

        const token =
          typeof item.token === 'string'
            ? item.token
            : typeof item.roomToken === 'string'
              ? item.roomToken
              : '';

        const createdAt =
          typeof item.createdAt === 'string'
            ? item.createdAt
            : typeof item.updatedAt === 'string'
              ? item.updatedAt
              : new Date().toISOString();
        const roomStatus = isRoomStatus(item.roomStatus) ? item.roomStatus : 'dnd';

        if (!roomNumber || !token) {
          return null;
        }

        return {
          roomNumber,
          token,
          createdAt,
          roomStatus,
        };
      })
      .filter((item): item is RoomRecord => item !== null);
  } catch {
    return [];
  }
}

function parseServices(raw: string | null): ServiceItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => {
        if (
          typeof item.id !== 'string' ||
          typeof item.name !== 'string' ||
          !isServiceCategory(item.category) ||
          typeof item.priceText !== 'string'
        ) {
          return null;
        }

        const availabilityCandidate = item.availability ?? item.availableSlots;
        const availability =
          Array.isArray(availabilityCandidate) &&
          availabilityCandidate.every((slot) => typeof slot === 'string')
            ? (availabilityCandidate as string[])
            : undefined;

        const upsellRaw = item.upsellRules as
          | { showPreArrival?: unknown; showWhenLateCheckoutNotBought?: unknown }
          | undefined;
        const upsellRules =
          upsellRaw &&
          (typeof upsellRaw.showPreArrival === 'boolean' ||
            typeof upsellRaw.showWhenLateCheckoutNotBought === 'boolean')
            ? {
                showPreArrival: Boolean(upsellRaw.showPreArrival),
                showWhenLateCheckoutNotBought: Boolean(upsellRaw.showWhenLateCheckoutNotBought),
              }
            : undefined;

        return {
          id: item.id,
          name: item.name,
          category: item.category,
          priceText: item.priceText,
          active: typeof item.active === 'boolean' ? item.active : true,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
          actionLabel: isServiceAction(item.actionLabel) ? item.actionLabel : 'Request',
          ...(typeof item.description === 'string' ? { description: item.description } : {}),
          ...(typeof item.duration === 'string' ? { duration: item.duration } : {}),
          ...(typeof item.location === 'string' ? { location: item.location } : {}),
          ...(typeof item.notes === 'string' ? { notes: item.notes } : {}),
          ...(availability ? { availability } : {}),
          ...(upsellRules ? { upsellRules } : {}),
        } as ServiceItem;
      })
      .filter((item): item is ServiceItem => item !== null);
  } catch {
    return [];
  }
}

function parseServiceViews(raw: string | null): Record<string, number> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }

    return Object.entries(parsed).reduce<Record<string, number>>((acc, [key, value]) => {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        acc[key] = Math.floor(value);
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createServiceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `svc_${crypto.randomUUID().slice(0, 8)}`;
  }

  return `svc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function createRoomToken(length = 14): string {
  const size = Math.min(16, Math.max(12, length));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);

    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  }

  let token = '';
  for (let index = 0; index < size; index += 1) {
    token += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return token;
}

export function getRequests(): GuestRequest[] {
  if (!canUseStorage()) {
    return [];
  }

  return parseRequests(window.localStorage.getItem(REQUESTS_STORAGE_KEY));
}

export function saveRequests(requests: GuestRequest[]): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
}

export function createRequest(
  roomToken: string,
  type: string,
  input?: CreateRequestInput | string
): GuestRequest {
  const options = typeof input === 'string' ? { note: input } : input;
  const note = options?.note?.trim();
  const roomNumber = options?.roomNumber?.trim();

  const next: GuestRequest = {
    id: createRequestId(),
    roomToken,
    type,
    status: 'new',
    createdAt: new Date().toISOString(),
    ...(roomNumber ? { roomNumber } : {}),
    ...(note ? { note } : {}),
    ...(typeof options?.scheduledFor === 'string' ? { scheduledFor: options.scheduledFor } : {}),
    ...(isRequestPriority(options?.priority) ? { priority: options.priority } : {}),
  };

  const updated = [next, ...getRequests()];
  saveRequests(updated);

  return next;
}

export function getRoomRequests(roomToken: string): GuestRequest[] {
  return getRequests().filter((request) => request.roomToken === roomToken);
}

export function getNextStatus(status: RequestStatus): RequestStatus {
  const index = STATUS_FLOW.indexOf(status);
  if (index < 0 || index >= STATUS_FLOW.length - 1) {
    return 'done';
  }

  return STATUS_FLOW[index + 1];
}

export function updateRequestStatus(id: string, nextStatus: RequestStatus): GuestRequest[] {
  const updated = getRequests().map((request) => {
    if (request.id !== id) {
      return request;
    }

    const now = new Date().toISOString();

    return {
      ...request,
      status: nextStatus,
      ...(nextStatus === 'accepted' ? { acceptedAt: request.acceptedAt ?? now } : {}),
      ...(nextStatus === 'in_progress' ? { inProgressAt: request.inProgressAt ?? now } : {}),
      ...(nextStatus === 'done' ? { doneAt: request.doneAt ?? now } : {}),
      ...(nextStatus === 'cancelled' ? { cancelledAt: request.cancelledAt ?? now } : {}),
    };
  });

  saveRequests(updated);
  return updated;
}

export function updateRequestStaffNote(id: string, staffNote: string): GuestRequest[] {
  const trimmed = staffNote.trim();

  const updated = getRequests().map((request) => {
    if (request.id !== id) {
      return request;
    }

    return {
      ...request,
      ...(trimmed ? { staffNote: trimmed } : { staffNote: undefined }),
    };
  });

  saveRequests(updated);
  return updated;
}

export function updateRequestDetails(
  id: string,
  updates: {
    priority?: RequestPriority;
    staffNote?: string;
    assignedTeam?: string;
    assignedPerson?: string;
    etaMinutes?: number;
  }
): GuestRequest[] {
  const updated = getRequests().map((request) => {
    if (request.id !== id) {
      return request;
    }

    const nextStaffNote = updates.staffNote?.trim();
    const nextAssignedTeam = updates.assignedTeam?.trim();
    const nextAssignedPerson = updates.assignedPerson?.trim();
    const nextEta = updates.etaMinutes;

    return {
      ...request,
      ...(updates.priority ? { priority: updates.priority } : {}),
      ...(typeof nextEta === 'number' && Number.isFinite(nextEta) && nextEta > 0
        ? { etaMinutes: Math.round(nextEta) }
        : { etaMinutes: undefined }),
      ...(typeof updates.staffNote === 'undefined'
        ? {}
        : nextStaffNote
          ? { staffNote: nextStaffNote }
          : { staffNote: undefined }),
      ...(typeof updates.assignedTeam === 'undefined'
        ? {}
        : nextAssignedTeam
          ? { assignedTeam: nextAssignedTeam }
          : { assignedTeam: undefined }),
      ...(typeof updates.assignedPerson === 'undefined'
        ? {}
        : nextAssignedPerson
          ? { assignedPerson: nextAssignedPerson }
          : { assignedPerson: undefined }),
    };
  });

  saveRequests(updated);
  return updated;
}

export function getRooms(): RoomRecord[] {
  if (!canUseStorage()) {
    return [];
  }

  return parseRooms(window.localStorage.getItem(ROOMS_STORAGE_KEY));
}

export function saveRooms(rooms: RoomRecord[]): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
}

export function getServices(): ServiceItem[] {
  if (!canUseStorage()) {
    return DEFAULT_SERVICES;
  }

  const parsed = parseServices(window.localStorage.getItem(SERVICES_STORAGE_KEY));
  if (parsed.length > 0) {
    return parsed;
  }

  saveServices(DEFAULT_SERVICES);
  return DEFAULT_SERVICES;
}

export function saveServices(services: ServiceItem[]): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
}

export function getServiceViews(): Record<string, number> {
  if (!canUseStorage()) {
    return {};
  }

  return parseServiceViews(window.localStorage.getItem(SERVICE_VIEWS_STORAGE_KEY));
}

export function saveServiceViews(views: Record<string, number>): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(SERVICE_VIEWS_STORAGE_KEY, JSON.stringify(views));
}

export function incrementServiceView(serviceId: string): Record<string, number> {
  const current = getServiceViews();
  const next = {
    ...current,
    [serviceId]: (current[serviceId] ?? 0) + 1,
  };

  saveServiceViews(next);
  return next;
}

export function seedDefaultServices(): ServiceItem[] {
  const current = getServices();
  if (current.length > 0) {
    return current;
  }

  const seeded = DEFAULT_SERVICES.map((service) => ({ ...service, id: service.id || createServiceId() }));
  saveServices(seeded);
  return seeded;
}

export function getGuestServices(): ServiceItem[] {
  return getServices().filter((service) => service.active);
}

export function getServiceById(serviceId: string, includeInactive = true): ServiceItem | undefined {
  return getServices().find((service) => {
    if (service.id !== serviceId) {
      return false;
    }

    return includeInactive || service.active;
  });
}

export function addRoom(roomNumber: string): RoomRecord {
  const normalizedRoomNumber = roomNumber.trim();
  const room: RoomRecord = {
    roomNumber: normalizedRoomNumber,
    token: createRoomToken(),
    createdAt: new Date().toISOString(),
    roomStatus: 'dnd',
  };

  const existing = getRooms();
  const filtered = existing.filter((item) => item.roomNumber !== normalizedRoomNumber);
  saveRooms([room, ...filtered]);

  return room;
}

export function getRoomByToken(token: string): RoomRecord | undefined {
  return getRooms().find((room) => room.token === token);
}

export function regenerateRoomToken(currentToken: string): RoomRecord | null {
  const existing = getRooms();
  const index = existing.findIndex((room) => room.token === currentToken);
  if (index < 0) {
    return null;
  }

  let nextToken = createRoomToken();
  while (existing.some((room) => room.token === nextToken)) {
    nextToken = createRoomToken();
  }

  const updatedRoom: RoomRecord = {
    ...existing[index],
    token: nextToken,
  };

  const updated = [...existing];
  updated[index] = updatedRoom;
  saveRooms(updated);

  return updatedRoom;
}

export function getRoomStatus(token: string): RoomStatus {
  return getRoomByToken(token)?.roomStatus ?? 'dnd';
}

export function setRoomStatus(token: string, roomStatus: RoomStatus): RoomRecord[] {
  const existing = getRooms();
  const index = existing.findIndex((room) => room.token === token);
  if (index < 0) {
    return existing;
  }

  const updated = [...existing];
  updated[index] = { ...updated[index], roomStatus };
  saveRooms(updated);
  return updated;
}

export function formatRoomStatusLabel(status: RoomStatus): string {
  if (status === 'dnd') {
    return 'Do not disturb';
  }

  if (status === 'please_clean') {
    return 'Please clean';
  }

  return 'Maintenance needed';
}

export function getAllRoomTokens(): string[] {
  const requestTokens = getRequests().map((request) => request.roomToken);
  const roomTokens = getRooms().map((room) => room.token);

  return Array.from(new Set([...requestTokens, ...roomTokens])).sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export function countNewRequestsForRoom(roomToken: string): number {
  return getRequests().filter((request) => request.roomToken === roomToken && request.status === 'new').length;
}

export function formatRequestType(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized === 'towels') {
    return 'Towels';
  }

  if (normalized === 'cleaning') {
    return 'Cleaning';
  }

  if (normalized === 'water') {
    return 'Water';
  }

  if (normalized === 'issue') {
    return 'Report an issue';
  }

  return type;
}

export function formatStatusLabel(status: RequestStatus): string {
  if (status === 'in_progress') {
    return 'In progress';
  }

  if (status === 'new') {
    return 'New';
  }

  if (status === 'accepted') {
    return 'Accepted';
  }

  if (status === 'cancelled') {
    return 'Cancelled';
  }

  return 'Done';
}

export function getStatusBadgeClassName(status: RequestStatus): string {
  if (status === 'new') {
    return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';
  }

  if (status === 'accepted') {
    return 'bg-amber-50 text-amber-700 ring-amber-600/20';
  }

  if (status === 'in_progress') {
    return 'bg-blue-50 text-blue-700 ring-blue-600/20';
  }

  if (status === 'cancelled') {
    return 'bg-slate-100 text-slate-600 ring-slate-300/40';
  }

  return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
}

export function getRequestById(requestId: string): GuestRequest | undefined {
  return getRequests().find((request) => request.id === requestId);
}

export function formatRelativeTime(dateIso: string): string {
  const timestamp = new Date(dateIso).getTime();
  if (Number.isNaN(timestamp)) {
    return 'just now';
  }

  const diffMs = timestamp - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absSeconds < 60) {
    return rtf.format(diffSeconds, 'second');
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
}
