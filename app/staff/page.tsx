'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  formatRelativeTime,
  formatRequestType,
  formatStatusLabel,
  getNextStatus,
  getRequests,
  getRoomByToken,
  updateRequestDetails,
  updateRequestStatus,
  type GuestRequest,
  type RequestPriority,
  type RequestStatus,
} from '@/lib/requests';

type StaffTab = 'new' | 'in_progress' | 'done' | 'sla_risk';

const SLA_MINUTES = 30;
const TEAM_OPTIONS = ['Front Desk', 'Housekeeping', 'Maintenance', 'Room Service'];
const PERSON_OPTIONS = ['Alex', 'Sam', 'Jordan', 'Taylor'];

const TAB_OPTIONS: Array<{ id: StaffTab; label: string }> = [
  { id: 'new', label: 'New' },
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
  const [activeTab, setActiveTab] = useState<StaffTab>('new');
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
        if (activeTab === 'new') {
          return request.status === 'new';
        }

        if (activeTab === 'in_progress') {
          return request.status === 'accepted' || request.status === 'in_progress';
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

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900">Staff Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Operational control panel for active requests.</p>
        <Link
          href="/staff/rooms"
          className="mt-3 inline-flex rounded-xl bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
        >
          Open Rooms page
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        {TAB_OPTIONS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          <input
            type="text"
            value={roomQuery}
            onChange={(event) => setRoomQuery(event.target.value)}
            placeholder="Search by room number or token"
            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-indigo-300"
          />

          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl bg-white/75 p-5 text-sm text-slate-600 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
              No requests in this tab.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {filteredRequests.map((request) => {
                const isSelected = selectedRequestId === request.id;

                return (
                  <li key={request.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedRequestId(request.id)}
                      className={`w-full rounded-2xl px-4 py-3 text-left shadow-sm ring-1 transition ${
                        isSelected
                          ? 'bg-indigo-50 ring-indigo-200'
                          : 'bg-white/80 ring-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{getRoomDisplay(request)}</p>
                          <p className="mt-0.5 text-sm text-slate-700">{formatRequestType(request.type)}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatRelativeTime(request.createdAt)}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {formatStatusLabel(request.status)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
          {!selectedRequest ? (
            <p className="text-sm text-slate-500">Select a request to open operational controls.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Request details</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatRequestType(selectedRequest.type)}</p>
                <p className="text-xs text-slate-500">Room {getRoomDisplay(selectedRequest)}</p>
                <p className="text-xs text-slate-500">Status: {formatStatusLabel(selectedRequest.status)}</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs font-medium text-slate-600">
                  Team
                  <select
                    value={team}
                    onChange={(event) => setTeam(event.target.value)}
                    className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">Unassigned</option>
                    {TEAM_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-medium text-slate-600">
                  Person
                  <select
                    value={person}
                    onChange={(event) => setPerson(event.target.value)}
                    className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="">Unassigned</option>
                    {PERSON_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-medium text-slate-600">
                  Priority
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as RequestPriority)}
                    className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label className="text-xs font-medium text-slate-600">
                  ETA (minutes)
                  <input
                    type="number"
                    min={1}
                    value={etaMinutes}
                    onChange={(event) => setEtaMinutes(event.target.value)}
                    className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-300"
                  />
                </label>

                <label className="text-xs font-medium text-slate-600">
                  Internal staff note
                  <textarea
                    rows={3}
                    value={staffNote}
                    onChange={(event) => setStaffNote(event.target.value)}
                    className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-300"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('accepted')}
                  className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('in_progress')}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
                >
                  Mark in progress
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('done')}
                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                >
                  Mark done
                </button>
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100"
                >
                  Save updates
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
