'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Field';
import Tabs from '@/components/ui/Tabs';
import {
  REQUEST_STATUS_STYLES,
  formatRelativeTime,
  formatRequestType,
  formatStatusLabel,
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
      return;
    }

    setTeam(selectedRequest.assignedTeam ?? '');
    setPerson(selectedRequest.assignedPerson ?? '');
    setPriority(selectedRequest.priority ?? 'normal');
    setEtaMinutes(selectedRequest.etaMinutes ? String(selectedRequest.etaMinutes) : '');
    setStaffNote(selectedRequest.staffNote ?? '');
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

    const updated = updateRequestDetails(selectedRequest.id, {
      assignedTeam: team,
      assignedPerson: person,
      priority,
      etaMinutes: etaMinutes ? Number(etaMinutes) : undefined,
      staffNote,
    });
    persistAndRefresh(updated);
  }

  function handleStatusChange(nextStatus: RequestStatus) {
    if (!selectedRequest) {
      return;
    }

    const updated = updateRequestStatus(selectedRequest.id, nextStatus);
    persistAndRefresh(updated);
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
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-text">Staff Dashboard</h1>
        <p className="mt-2 text-sm text-muted">Operational control panel for active requests.</p>
        <Link href="/staff/rooms" className="btn-secondary mt-3 px-3 py-1.5 text-sm">
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
          <div className="overflow-hidden border border-border bg-surface shadow-soft">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2">Room</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Note</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.map((request) => {
                    const isSelected = selectedRequestId === request.id;
                    const note = getShortNote(request);
                    const statusTheme =
                      activeTab === 'sla_risk'
                        ? REQUEST_STATUS_STYLES.sla_risk
                        : REQUEST_STATUS_STYLES[request.status];

                    return (
                      <tr
                        key={request.id}
                        onClick={() => setSelectedRequestId(request.id)}
                        className={`cursor-pointer border-l-4 ${statusTheme.rowBg} ${statusTheme.rowBorder} ${
                          isSelected ? 'ring-1 ring-inset ring-focus' : ''
                        }`}
                      >
                        <td className="px-3 py-2 font-medium text-text">{getRoomDisplay(request)}</td>
                        <td className="px-3 py-2 text-text">{formatRequestType(request.type)}</td>
                        <td className="px-3 py-2 text-muted">{formatRelativeTime(request.createdAt)}</td>
                        <td className="px-3 py-2">
                          <Badge className={`${statusTheme.badgeBg} ${statusTheme.badgeText} ${statusTheme.badgeRing}`}>
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
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/35 p-0 sm:items-center sm:p-4"
          onClick={() => setSelectedRequestId(null)}
        >
          <Card
            role="dialog"
            aria-modal="true"
            className="h-full w-full overflow-y-auto p-4 sm:mx-auto sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted">Request details</p>
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
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-text">
                    {formatRequestType(selectedRequest.type)} - Room {getRoomDisplay(selectedRequest)}
                  </p>
                  <p className="mt-1 text-xs text-muted">Created {formatRelativeTime(selectedRequest.createdAt)}</p>
                </div>
                <Badge
                  className={`${REQUEST_STATUS_STYLES[selectedRequest.status].badgeBg} ${REQUEST_STATUS_STYLES[selectedRequest.status].badgeText} ${REQUEST_STATUS_STYLES[selectedRequest.status].badgeRing}`}
                >
                  {formatStatusLabel(selectedRequest.status)}
                </Badge>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Guest note</p>
                <Card className="mt-1 px-3 py-2 text-sm text-text">{selectedRequest.note?.trim() || '-'}</Card>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs font-medium text-muted">
                  Team
                  <Select value={team} onChange={(event) => setTeam(event.target.value)} className="mt-1 py-2">
                    <option value="">Unassigned</option>
                    {TEAM_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="text-xs font-medium text-muted">
                  Person
                  <Select value={person} onChange={(event) => setPerson(event.target.value)} className="mt-1 py-2">
                    <option value="">Unassigned</option>
                    {PERSON_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </label>

                <label className="text-xs font-medium text-muted">
                  Priority
                  <Select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as RequestPriority)}
                    className="mt-1 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </Select>
                </label>

                <label className="text-xs font-medium text-muted">
                  ETA (minutes)
                  <Input
                    type="number"
                    min={1}
                    value={etaMinutes}
                    onChange={(event) => setEtaMinutes(event.target.value)}
                    className="mt-1 py-2"
                  />
                </label>

                <label className="text-xs font-medium text-muted">
                  Internal staff note
                  <Textarea
                    rows={3}
                    value={staffNote}
                    onChange={(event) => setStaffNote(event.target.value)}
                    className="mt-1 py-2"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => handleStatusChange('accepted')} className="px-3 py-1.5 text-xs">
                  Accept
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStatusChange('in_progress')}
                  className="px-3 py-1.5 text-xs"
                >
                  Mark in progress
                </Button>
                <Button type="button" variant="outline" onClick={() => handleStatusChange('done')} className="px-3 py-1.5 text-xs">
                  Mark done
                </Button>
                <Button type="button" onClick={handleSaveDetails} className="px-3 py-1.5 text-xs">
                  Save updates
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
