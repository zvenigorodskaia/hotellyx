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

const SLA_MINUTES = 30;
const TEAM_OPTIONS = ['Front Desk', 'Housekeeping', 'Maintenance', 'Room Service'];
const PERSON_OPTIONS = ['Alex', 'Sam', 'Jordan', 'Taylor'];

const TAB_OPTIONS: Array<{ id: StaffTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
  { id: 'sla_risk', label: 'SLA risk' },
];

function isSlaRisk(request: GuestRequest): boolean {
  if (request.status === 'done' || request.status === 'cancelled') {
    return false;
  }

  const createdAtMs = new Date(request.createdAt).getTime();
  if (Number.isNaN(createdAtMs)) {
    return false;
  }

  return Date.now() - createdAtMs > SLA_MINUTES * 60 * 1000;
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

      <Tabs value={activeTab} onChange={setActiveTab} items={TAB_OPTIONS} />

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
                        ? undefined
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
                            className={`${statusTheme.badgeRing} ${activeTab === 'sla_risk' ? `${statusTheme.badgeBg} ${statusTheme.badgeText}` : ''}`}
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
