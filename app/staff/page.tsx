'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Dropdown from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Field';
import Tabs from '@/components/ui/Tabs';
import {
  REQUEST_STATUS_STYLES,
  formatRelativeTime,
  formatRequestType,
  formatStatusLabel,
  getRequestTone,
  getRequests,
  getRoomByToken,
  updateRequestDetails,
  updateRequestStatus,
  type GuestRequest,
  type RequestPriority,
  type RequestStatus,
} from '@/lib/requests';

type StaffTab = 'all' | 'new' | 'accepted' | 'in_progress' | 'done' | 'sla_risk';

const SLA_MINUTES = 25;
const TEAM_OPTIONS = ['Front Desk', 'Housekeeping', 'Maintenance', 'Room Service'];
const PERSON_OPTIONS = ['Alex', 'Sam', 'Jordan', 'Taylor'];

const TAB_OPTIONS_BASE: Array<{ id: StaffTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
  { id: 'sla_risk', label: 'SLA risk' },
];

function toMs(value?: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function isActive(status: RequestStatus): boolean {
  return status !== 'done';
}

export function minutesBetween(a: string, b: string): number | null {
  const start = toMs(a);
  const end = toMs(b);
  if (start === null || end === null || end < start) {
    return null;
  }

  return (end - start) / 60000;
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) {
    return '-';
  }

  const rounded = Math.round(minutes);
  if (rounded < 60) {
    return `${rounded}m`;
  }

  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function withinLastHours(date: string, hours: number, nowMs = Date.now()): boolean {
  const valueMs = toMs(date);
  if (valueMs === null) {
    return false;
  }

  const rangeMs = hours * 60 * 60 * 1000;
  return valueMs >= nowMs - rangeMs && valueMs <= nowMs;
}

function withinRange(date: string, startMs: number, endMs: number): boolean {
  const valueMs = toMs(date);
  if (valueMs === null) {
    return false;
  }

  return valueMs >= startMs && valueMs <= endMs;
}

function average(values: number[]): number | null {
  if (!values.length) {
    return null;
  }

  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

function averageTransitionMinutes(
  requests: GuestRequest[],
  toField: 'acceptedAt' | 'doneAt',
  startMs: number,
  endMs: number,
): number | null {
  const values = requests
    .filter((request) => {
      const endpoint = request[toField];
      if (!endpoint) {
        return false;
      }

      return withinRange(endpoint, startMs, endMs);
    })
    .map((request) => {
      const endpoint = request[toField];
      if (!endpoint) {
        return null;
      }

      return minutesBetween(request.createdAt, endpoint);
    })
    .filter((value): value is number => typeof value === 'number');

  return average(values);
}

function formatTrend(current: number | null, previous: number | null): string | null {
  if (current === null || previous === null || previous === 0) {
    return null;
  }

  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta);
  const fixed = rounded === 0 ? 0 : rounded;

  return `${fixed > 0 ? '+' : ''}${fixed}%`;
}

function isRequestActiveAt(request: GuestRequest, atMs: number): boolean {
  const createdAtMs = toMs(request.createdAt);
  if (createdAtMs === null || createdAtMs > atMs) {
    return false;
  }

  const doneAtMs = toMs(request.doneAt);
  if (doneAtMs !== null && doneAtMs <= atMs) {
    return false;
  }

  const cancelledAtMs = toMs(request.cancelledAt);
  if (cancelledAtMs !== null && cancelledAtMs <= atMs) {
    return false;
  }

  return true;
}

// Option B: request is in SLA risk when still active and older than threshold.
function isSlaRiskAt(request: GuestRequest, atMs: number): boolean {
  if (!isRequestActiveAt(request, atMs)) {
    return false;
  }

  const createdAtMs = toMs(request.createdAt);
  if (createdAtMs === null) {
    return false;
  }

  return atMs - createdAtMs > SLA_MINUTES * 60 * 1000;
}

function isSlaRisk(request: GuestRequest): boolean {
  return isSlaRiskAt(request, Date.now());
}

function getRoomDisplay(request: GuestRequest): string {
  return request.roomNumber ?? getRoomByToken(request.roomToken)?.roomNumber ?? request.roomToken;
}

export default function StaffPage() {
  const [requests, setRequests] = useState<GuestRequest[]>([]);
  const [roomQuery, setRoomQuery] = useState('');
  const [activeTab, setActiveTab] = useState<StaffTab>('all');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const [team, setTeam] = useState('');
  const [person, setPerson] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('normal');
  const [etaMinutes, setEtaMinutes] = useState('');
  const [staffNote, setStaffNote] = useState('');
  const [pendingStatus, setPendingStatus] = useState<RequestStatus | null>(null);

  useEffect(() => {
    setRequests(getRequests());
  }, []);

  const filteredRequests = useMemo(() => {
    const query = roomQuery.trim().toLowerCase();

    return requests
      .filter((request) => {
        if (!query) {
          return true;
        }

        const roomDisplay = getRoomDisplay(request).toLowerCase();
        return roomDisplay.includes(query) || request.roomToken.toLowerCase().includes(query);
      })
      .filter((request) => {
        if (activeTab === 'all') {
          return true;
        }

        if (activeTab === 'new') {
          return request.status === 'new';
        }

        if (activeTab === 'accepted') {
          return request.status === 'accepted';
        }

        if (activeTab === 'in_progress') {
          return request.status === 'in_progress';
        }

        if (activeTab === 'done') {
          return request.status === 'done';
        }

        return isSlaRisk(request);
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [requests, roomQuery, activeTab]);

  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) {
      return null;
    }

    return requests.find((request) => request.id === selectedRequestId) ?? null;
  }, [selectedRequestId, requests]);

  const tabOptions = useMemo(() => {
    const slaRiskCount = requests.filter((request) => isSlaRisk(request)).length;
    return TAB_OPTIONS_BASE.map((item) =>
      item.id === 'sla_risk' ? { ...item, label: `SLA risk (${slaRiskCount})` } : item,
    );
  }, [requests]);

  const liveOverview = useMemo(() => {
    const nowMs = Date.now();
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;

    const previousHourPoint = nowMs - hourMs;
    const last24Start = nowMs - dayMs;
    const previous24Start = nowMs - 2 * dayMs;

    const activeRequests = requests.filter((request) => isActive(request.status)).length;
    const previousActiveRequests = requests.filter((request) =>
      isRequestActiveAt(request, previousHourPoint),
    ).length;

    const slaRisk = requests.filter((request) => isSlaRiskAt(request, nowMs)).length;
    const previousSlaRisk = requests.filter((request) => isSlaRiskAt(request, previousHourPoint)).length;

    const avgResponseCurrent = averageTransitionMinutes(requests, 'acceptedAt', last24Start, nowMs);
    const avgResponsePrevious = averageTransitionMinutes(
      requests,
      'acceptedAt',
      previous24Start,
      last24Start,
    );

    const avgCompletionCurrent = averageTransitionMinutes(requests, 'doneAt', last24Start, nowMs);
    const avgCompletionPrevious = averageTransitionMinutes(
      requests,
      'doneAt',
      previous24Start,
      last24Start,
    );

    const requestsPerHour = requests.filter((request) => withinLastHours(request.createdAt, 1, nowMs)).length;
    const previousRequestsPerHour = requests.filter((request) =>
      withinRange(request.createdAt, nowMs - 2 * hourMs, nowMs - hourMs),
    ).length;

    return [
      {
        id: 'active',
        label: 'Active requests',
        value: String(activeRequests),
        helper: 'Live queue',
        trend: formatTrend(activeRequests, previousActiveRequests),
        toneClass: 'bg-[var(--surface)]',
      },
      {
        id: 'sla_risk',
        label: 'SLA risk',
        value: String(slaRisk),
        helper: 'Older than 25 min',
        trend: formatTrend(slaRisk, previousSlaRisk),
        toneClass: 'bg-[#ff43312b]',
      },
      {
        id: 'avg_response',
        label: 'Avg response time',
        value: formatDuration(avgResponseCurrent),
        helper: 'Last 24h',
        trend: formatTrend(avgResponseCurrent, avgResponsePrevious),
        toneClass: 'bg-[rgba(255,177,102,0.22)]',
      },
      {
        id: 'avg_completion',
        label: 'Avg completion time',
        value: formatDuration(avgCompletionCurrent),
        helper: 'Last 24h',
        trend: formatTrend(avgCompletionCurrent, avgCompletionPrevious),
        toneClass: 'bg-[rgba(146,209,146,0.22)]',
      },
      {
        id: 'per_hour',
        label: 'Requests per hour',
        value: String(requestsPerHour),
        helper: 'Last 60 min',
        trend: formatTrend(requestsPerHour, previousRequestsPerHour),
        toneClass: 'bg-[var(--surface)]',
      },
    ];
  }, [requests]);

  useEffect(() => {
    if (!selectedRequest) {
      setPendingStatus(null);
      return;
    }

    setTeam(selectedRequest.assignedTeam ?? '');
    setPerson(selectedRequest.assignedPerson ?? '');
    setPriority(selectedRequest.priority ?? 'normal');
    setEtaMinutes(selectedRequest.etaMinutes ? String(selectedRequest.etaMinutes) : '');
    setStaffNote(selectedRequest.staffNote ?? '');
    setPendingStatus(selectedRequest.status);
  }, [selectedRequest]);

  useEffect(() => {
    if (!selectedRequestId) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedRequestId(null);
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedRequestId]);

  function persistAndRefresh(updated: GuestRequest[]) {
    setRequests(updated);
    if (selectedRequestId && !updated.some((item) => item.id === selectedRequestId)) {
      setSelectedRequestId(null);
    }
  }

  function handleSaveDetails() {
    if (!selectedRequest) {
      return;
    }

    let updated = updateRequestDetails(selectedRequest.id, {
      assignedTeam: team,
      assignedPerson: person,
      priority,
      etaMinutes: etaMinutes ? Number(etaMinutes) : undefined,
      staffNote,
    });

    if (pendingStatus && pendingStatus !== selectedRequest.status) {
      updated = updateRequestStatus(selectedRequest.id, pendingStatus);
    }

    persistAndRefresh(updated);
    setSelectedRequestId(null);
  }

  function handleStatusChange(nextStatus: RequestStatus) {
    setPendingStatus(nextStatus);
  }

  function getShortNote(request: GuestRequest): string {
    const text = request.note?.trim();
    if (!text) {
      return '';
    }

    if (text.length <= 56) {
      return text;
    }

    return `${text.slice(0, 56).trimEnd()}...`;
  }

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <h1 className="type-page-title">Staff Dashboard</h1>
        <p className="type-subtitle">Operational control panel for active requests.</p>
        <Link href="/staff/rooms" className="btn-secondary px-4 py-2 text-sm">
          Open Rooms page
        </Link>
      </header>

      <section aria-label="Live overview" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="type-section-title text-[1.35rem]">Live overview</h2>
          <p className="text-xs text-muted">Updated from current request queue</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {liveOverview.map((metric) => (
            <Card key={metric.id} className={`space-y-2 p-4 ${metric.toneClass}`}>
              <p className="type-kicker">{metric.label}</p>
              <p className="text-2xl font-semibold text-text">{metric.value}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted">{metric.helper}</p>
                {metric.trend ? <p className="text-xs text-muted">{metric.trend}</p> : null}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Tabs value={activeTab} onChange={setActiveTab} items={tabOptions} />

      <section className="space-y-3">
        <Input
          type="text"
          value={roomQuery}
          onChange={(event) => setRoomQuery(event.target.value)}
          placeholder="Search by room number or token"
        />

        {filteredRequests.length === 0 ? (
          <Card className="text-sm text-muted">No requests in this tab.</Card>
        ) : (
          <div className="overflow-hidden border border-border bg-surface p-2 shadow-soft">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate text-sm [border-spacing:0_8px]">
                <thead className="type-kicker text-left">
                  <tr>
                    <th className="px-3 py-2">Room</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Note</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => {
                    const isSelected = selectedRequestId === request.id;
                    const note = getShortNote(request);
                    const statusTheme =
                      activeTab === 'sla_risk'
                        ? REQUEST_STATUS_STYLES.sla_risk
                        : REQUEST_STATUS_STYLES[request.status];
                    const tone = getRequestTone(request.status);
                    const typeColor = activeTab === 'sla_risk' ? undefined : tone.titleColor;
                    const badgeStyle =
                      activeTab === 'sla_risk'
                        ? { color: '#7A0000', borderColor: '#7A0000' }
                        : { backgroundColor: tone.badgeBg, color: tone.badgeText };

                    return (
                      <tr
                        key={request.id}
                        onClick={() => setSelectedRequestId(request.id)}
                        className={`cursor-pointer border ${statusTheme.rowBg} ${statusTheme.rowBorder} ${
                          isSelected ? 'ring-1 ring-inset ring-focus' : 'shadow-soft'
                        }`}
                      >
                        <td className="px-3 py-2 font-medium text-text">{getRoomDisplay(request)}</td>
                        <td className={`px-3 py-2 font-medium ${activeTab === 'sla_risk' ? statusTheme.accentText : ''}`} style={typeColor ? { color: typeColor } : undefined}>
                          {formatRequestType(request.type)}
                        </td>
                        <td className="px-3 py-2 text-muted">{formatRelativeTime(request.createdAt)}</td>
                        <td className="px-3 py-2">
                          <Badge
                            className={`${statusTheme.badgeRing} ${
                              activeTab === 'sla_risk'
                                ? `${statusTheme.badgeBg} ${statusTheme.badgeText}`
                                : ''
                            }`}
                            style={badgeStyle}
                          >
                            {activeTab === 'sla_risk' ? 'SLA risk' : formatStatusLabel(request.status)}
                          </Badge>
                        </td>
                        <td className="max-w-[20rem] px-3 py-2 text-muted">
                          <span className="block truncate">{note}</span>
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedRequestId(request.id);
                            }}
                            className="px-2.5 py-1 text-xs"
                          >
                            Open
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-[rgba(26,20,16,0.16)] p-0 sm:items-center sm:p-4"
          onClick={() => setSelectedRequestId(null)}
        >
          <Card
            role="dialog"
            aria-modal="true"
            className="h-full w-full overflow-y-auto p-4 sm:mx-auto sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="type-kicker">Request details</p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedRequestId(null)}
                className="h-8 w-8 px-0 py-0 text-base"
                aria-label="Close details"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              {(() => {
                const draftStatus = pendingStatus ?? selectedRequest.status;
                const draftTone = getRequestTone(draftStatus);
                return (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="type-card-title" style={{ color: draftTone.titleColor }}>
                    {formatRequestType(selectedRequest.type)} - Room {getRoomDisplay(selectedRequest)}
                  </p>
                  <p className="mt-1 text-xs text-muted">Created {formatRelativeTime(selectedRequest.createdAt)}</p>
                </div>
                <Badge
                  className={`${REQUEST_STATUS_STYLES[draftStatus].badgeRing}`}
                  style={{
                    backgroundColor: draftTone.badgeBg,
                    color: draftTone.badgeText,
                  }}
                >
                  {formatStatusLabel(draftStatus)}
                </Badge>
              </div>
                );
              })()}

              <div>
                <p className="type-kicker">Guest note</p>
                <Card className="mt-1 px-3 py-2 text-sm text-text">{selectedRequest.note?.trim() || '-'}</Card>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="text-xs font-medium text-muted">
                  <span className="block">Team</span>
                  <Dropdown
                    value={team}
                    onChange={setTeam}
                    className="mt-2"
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...TEAM_OPTIONS.map((value) => ({ value, label: value })),
                    ]}
                  />
                </div>

                <div className="text-xs font-medium text-muted">
                  <span className="block">Person</span>
                  <Dropdown
                    value={person}
                    onChange={setPerson}
                    className="mt-2"
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...PERSON_OPTIONS.map((value) => ({ value, label: value })),
                    ]}
                  />
                </div>

                <div className="text-xs font-medium text-muted">
                  <span className="block">Priority</span>
                  <Dropdown
                    value={priority}
                    onChange={(value) => setPriority(value as RequestPriority)}
                    className="mt-2"
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'high', label: 'High' },
                    ]}
                  />
                </div>

                <div className="text-xs font-medium text-muted">
                  <label htmlFor="staff-eta-minutes" className="block">
                    ETA (minutes)
                  </label>
                  <input
                    id="staff-eta-minutes"
                    name="staffEtaMinutes"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={etaMinutes}
                    onChange={(event) => {
                      const numericOnly = event.target.value.replace(/\D+/g, '');
                      setEtaMinutes(numericOnly);
                    }}
                    className="mt-2 block w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[rgb(103,20,14)]"
                  />
                </div>

                <div className="text-xs font-medium text-muted">
                  <label htmlFor="staff-internal-note" className="block">
                    Internal staff note
                  </label>
                  <textarea
                    id="staff-internal-note"
                    name="staffInternalNote"
                    rows={3}
                    value={staffNote}
                    onChange={(event) => setStaffNote(event.target.value)}
                    className="mt-2 block w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[rgb(103,20,14)]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-[25rem]">
                  <Button
                    type="button"
                    onClick={() => handleStatusChange('accepted')}
                    className={`w-full border border-[rgba(184,101,23,0.35)] px-3 py-1.5 text-xs text-[#B86517] hover:bg-[rgba(255,177,102,0.4)] hover:text-[#B86517] ${
                      pendingStatus === 'accepted' ? 'bg-[rgba(255,177,102,0.4)]' : 'bg-[rgba(255,177,102,0.28)]'
                    }`}
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleStatusChange('in_progress')}
                    className={`w-full border border-[rgba(42,143,205,0.35)] px-3 py-1.5 text-xs text-[#2A8FCD] hover:bg-[rgba(112,197,255,0.4)] hover:text-[#2A8FCD] ${
                      pendingStatus === 'in_progress' ? 'bg-[rgba(112,197,255,0.4)]' : 'bg-[rgba(112,197,255,0.25)]'
                    }`}
                  >
                    Mark in progress
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleStatusChange('done')}
                    className={`w-full border border-[rgba(46,125,50,0.35)] px-3 py-1.5 text-xs text-[#2E7D32] hover:bg-[rgba(146,209,146,0.4)] hover:text-[#2E7D32] ${
                      pendingStatus === 'done' ? 'bg-[rgba(146,209,146,0.4)]' : 'bg-[rgba(146,209,146,0.28)]'
                    }`}
                  >
                    Mark done
                  </Button>
                </div>

                <div className="ml-auto space-y-1 text-right">
                  <p className="text-xs text-muted">After saving, the status will be sent to the guest immediately.</p>
                  <Button type="button" onClick={handleSaveDetails} className="px-3 py-1.5 text-xs">
                    Save updates
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
