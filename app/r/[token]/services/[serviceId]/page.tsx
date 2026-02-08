'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  getRoomByToken,
  getServiceById,
  incrementServiceView,
  type ServiceItem,
} from '@/lib/requests';

function formatSlotLabel(slot: string): string {
  const timestamp = new Date(slot).getTime();
  if (Number.isNaN(timestamp)) {
    return slot;
  }

  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(slot));
}

export default function GuestServiceDetailPage() {
  const router = useRouter();
  const params = useParams<{ token: string; serviceId: string }>();

  const token = params?.token ?? '';
  const serviceId = params?.serviceId ?? '';

  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [service, setService] = useState<ServiceItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [hasTrackedView, setHasTrackedView] = useState(false);

  useEffect(() => {
    const foundService = getServiceById(serviceId, false) ?? null;
    const room = getRoomByToken(token);

    setService(foundService);
    setRoomNumber(room?.roomNumber ?? null);
    setSelectedSlot('');
    setHasTrackedView(false);
  }, [serviceId, token]);

  useEffect(() => {
    if (!service || hasTrackedView) {
      return;
    }

    incrementServiceView(service.id);
    setHasTrackedView(true);
  }, [service, hasTrackedView]);

  const hasSlots = Boolean(service?.availability && service.availability.length > 0);
  const canSubmit = Boolean(service) && (!hasSlots || Boolean(selectedSlot));

  const details = useMemo(() => {
    if (!service) {
      return [];
    }

    return [
      { label: 'Duration', value: service.duration },
      { label: 'Location', value: service.location },
      { label: 'Notes', value: service.notes ?? 'Additional details will be shared after request.' },
    ].filter((item) => Boolean(item.value));
  }, [service]);

  function handleGoToRequest() {
    if (!service) {
      return;
    }

    const query = new URLSearchParams({
      type: `Service: ${service.name}`,
      serviceId: service.id,
    });
    if (selectedSlot) {
      query.set('slot', selectedSlot);
    }

    router.push(`/r/${token}/request?${query.toString()}`);
  }

  if (!roomNumber) {
    return (
      <section className="space-y-4">
        <Link
          href={`/r/${token}/services`}
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

  if (!service) {
    return (
      <section className="space-y-4">
        <Link
          href={`/r/${token}/services`}
          className="inline-flex rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          Back
        </Link>
        <div className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
          <p className="text-sm text-slate-600">Service not found. Please return to the services list.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-24">
      <header className="flex items-center gap-3">
        <Link
          href={`/r/${token}/services`}
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          Back
        </Link>
        <h1 className="text-3xl font-semibold text-slate-900">{service.name}</h1>
      </header>

      <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
        <p className="text-sm text-slate-500">
          {service.description ?? 'Service details and availability tailored for your stay.'}
        </p>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Price</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{service.priceText}</p>
        </div>

        {hasSlots && (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">Available slots</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {service.availability?.map((slot) => {
                const isSelected = selectedSlot === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {formatSlotLabel(slot)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {details.length > 0 && (
          <div className="mt-5 space-y-2">
            {details.map((detail) => (
              <p key={detail.label} className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">{detail.label}:</span> {detail.value}
              </p>
            ))}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/40 bg-white/75 p-4 backdrop-blur md:static md:border-none md:bg-transparent md:p-0">
        <button
          type="button"
          onClick={handleGoToRequest}
          disabled={!canSubmit}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {service.actionLabel}
        </button>
      </div>
    </section>
  );
}
