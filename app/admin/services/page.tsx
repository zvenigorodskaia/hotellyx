'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createServiceId,
  getServices,
  saveServices,
  type ServiceCategory,
  type ServiceItem,
} from '@/lib/requests';

type AdminService = {
  id: string;
  name: string;
  category: ServiceCategory;
  priceText: string;
  active: boolean;
  availability?: string[];
  upsellRules?: {
    showPreArrival: boolean;
    showWhenLateCheckoutNotBought: boolean;
  };
  createdAt: string;
};

const CATEGORY_OPTIONS: ServiceCategory[] = [
  'Housekeeping',
  'Food & Drinks',
  'Wellness',
  'Transport',
  'Conference',
  'Other',
];

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('Other');
  const [priceText, setPriceText] = useState('');
  const [availabilityInput, setAvailabilityInput] = useState('');
  const [showPreArrival, setShowPreArrival] = useState(false);
  const [showWhenLateCheckoutNotBought, setShowWhenLateCheckoutNotBought] = useState(false);

  useEffect(() => {
    setServices(getServices());
  }, []);

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => a.name.localeCompare(b.name));
  }, [services]);

  function resetForm() {
    setEditingServiceId(null);
    setName('');
    setCategory('Other');
    setPriceText('');
    setAvailabilityInput('');
    setShowPreArrival(false);
    setShowWhenLateCheckoutNotBought(false);
  }

  function openCreateModal() {
    resetForm();
    setShowModal(true);
  }

  function openEditModal(service: ServiceItem) {
    setEditingServiceId(service.id);
    setName(service.name);
    setCategory(service.category);
    setPriceText(service.priceText);
    setAvailabilityInput(service.availability?.join(', ') ?? '');
    setShowPreArrival(Boolean(service.upsellRules?.showPreArrival));
    setShowWhenLateCheckoutNotBought(Boolean(service.upsellRules?.showWhenLateCheckoutNotBought));
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    resetForm();
  }

  function persist(nextServices: ServiceItem[]) {
    setServices(nextServices);
    saveServices(nextServices);
  }

  function handleSave() {
    const normalizedName = name.trim();
    const normalizedPrice = priceText.trim();
    if (!normalizedName || !normalizedPrice) {
      return;
    }

    const availability = availabilityInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const upsellRules = {
      showPreArrival,
      showWhenLateCheckoutNotBought,
    };

    if (editingServiceId) {
      const next = services.map((service) => {
        if (service.id !== editingServiceId) {
          return service;
        }

        return {
          ...service,
          name: normalizedName,
          category,
          priceText: normalizedPrice,
          availability: availability.length > 0 ? availability : undefined,
          upsellRules,
        };
      });

      persist(next);
    } else {
      const created: ServiceItem = {
        id: createServiceId(),
        name: normalizedName,
        category,
        priceText: normalizedPrice,
        actionLabel: 'Request',
        active: true,
        createdAt: new Date().toISOString(),
        availability: availability.length > 0 ? availability : undefined,
        upsellRules,
      };

      persist([created, ...services]);
    }

    closeModal();
  }

  function handleActiveToggle(id: string) {
    const next = services.map((service) => {
      if (service.id !== id) {
        return service;
      }

      return {
        ...service,
        active: !service.active,
      };
    });

    persist(next);
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-slate-900">Services catalog</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:brightness-110"
        >
          + Add service
        </button>
      </header>

      <section className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Active</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedServices.map((service) => (
                <tr key={service.id}>
                  <td className="px-3 py-3 font-medium text-slate-900">{service.name}</td>
                  <td className="px-3 py-3 text-slate-700">{service.category}</td>
                  <td className="px-3 py-3 text-slate-700">{service.priceText}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => handleActiveToggle(service.id)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition ${
                        service.active
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-slate-100 text-slate-600 ring-slate-200'
                      }`}
                    >
                      {service.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(service)}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {editingServiceId ? 'Edit service' : 'Add service'}
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="text-xs font-medium text-slate-600">
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-300"
                />
              </label>

              <label className="text-xs font-medium text-slate-600">
                Category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as ServiceCategory)}
                  className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-300"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-slate-600">
                Price
                <input
                  type="text"
                  value={priceText}
                  onChange={(event) => setPriceText(event.target.value)}
                  placeholder="€60"
                  className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-300"
                />
              </label>

              <label className="text-xs font-medium text-slate-600">
                Availability (comma-separated time slots)
                <input
                  type="text"
                  value={availabilityInput}
                  onChange={(event) => setAvailabilityInput(event.target.value)}
                  placeholder="2026-02-07T13:00:00.000Z, 2026-02-07T15:00:00.000Z"
                  className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-300"
                />
              </label>

              <div>
                <p className="text-xs font-medium text-slate-600">Upsell rules</p>
                <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showPreArrival}
                    onChange={(event) => setShowPreArrival(event.target.checked)}
                  />
                  Show pre-arrival
                </label>
                <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showWhenLateCheckoutNotBought}
                    onChange={(event) => setShowWhenLateCheckoutNotBought(event.target.checked)}
                  />
                  Show when late checkout not bought
                </label>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:brightness-110"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
