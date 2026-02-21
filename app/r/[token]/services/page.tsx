'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import {
  getGuestServices,
  getRoomByToken,
  normalizeRoomToken,
  type ServiceCategory,
  type ServiceItem,
} from '@/lib/requests';

const ALL_CATEGORY = 'All';

export default function GuestServicesPage() {
  const params = useParams<{ token: string }>();
  const token = normalizeRoomToken(params?.token ?? '');

  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'All'>(ALL_CATEGORY);

  useEffect(() => {
    setServices(getGuestServices());
    const room = getRoomByToken(token);
    setRoomNumber((room?.roomNumber ?? token) || null);
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
          <BackButton />
          <h1 className="type-page-title">Services</h1>
        </div>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search services"
          className="input-base sm:max-w-xs"
        />
      </header>

      {!isValidRoom ? (
        <section className="form-container shadow-warm">
          <p className="text-sm text-muted">Invalid room link.</p>
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
                    className={`whitespace-nowrap rounded-none px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'tabs-trigger tabs-trigger-active'
                        : 'tabs-trigger'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <section className="form-container shadow-warm">
              <p className="text-sm text-muted">No services match your filters.</p>
            </section>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredServices.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/r/${token}/services/${service.id}`}
                    className="block rounded-none border border-border bg-surface p-4 shadow-warm transition-colors hover:bg-surface-2"
                  >
                    <p className="type-kicker">{service.category}</p>
                    <p className="mt-1 type-card-title">{service.name}</p>
                    <p className="mt-1 text-sm text-muted">{service.priceText}</p>

                    <span className="btn-secondary mt-3 px-3 py-1.5 text-sm">
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
