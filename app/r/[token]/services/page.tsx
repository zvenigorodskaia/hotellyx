'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  getGuestServices,
  getRoomByToken,
  type ServiceCategory,
  type ServiceItem,
} from '@/lib/requests';

const ALL_CATEGORY = 'All';

export default function GuestServicesPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';

  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'All'>(ALL_CATEGORY);

  useEffect(() => {
    setServices(getGuestServices());
    const room = getRoomByToken(token);
    setRoomNumber(room?.roomNumber ?? null);
  }, [token]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(services.map((service) => service.category)));
    return [ALL_CATEGORY, ...uniqueCategories] as Array<ServiceCategory | 'All'>;
  }, [services]);

  const filteredServices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return services.filter((service) => {
      const categoryMatch = activeCategory === ALL_CATEGORY || service.category === activeCategory;
      const searchMatch = !normalizedSearch || service.name.toLowerCase().includes(normalizedSearch);
      return categoryMatch && searchMatch;
    });
  }, [services, activeCategory, search]);

  const isValidRoom = Boolean(roomNumber);

  return (
    <section className="space-y-6">
      <header className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/r/${token}`}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            Back
          </Link>
          <h1 className="text-3xl font-semibold text-slate-900">Services</h1>
        </div>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search services"
          className="w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-indigo-300 sm:max-w-xs"
        />
      </header>

      {!isValidRoom ? (
        <section className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
          <p className="text-sm text-slate-600">Invalid room link.</p>
        </section>
      ) : (
        <>
          <div className="overflow-x-auto pb-1">
            <div className="inline-flex gap-2">
              {categories.map((category) => {
                const isActive = activeCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <section className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
              <p className="text-sm text-slate-600">No services match your filters.</p>
            </section>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredServices.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/r/${token}/services/${service.id}`}
                    className="block rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-400">{service.category}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{service.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{service.priceText}</p>

                    <span className="mt-3 inline-flex rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200">
                      {service.actionLabel}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
