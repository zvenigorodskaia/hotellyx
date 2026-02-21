'use client';

import {
  getRequests,
  getServices,
  getServiceViews,
  type ServiceItem,
} from '@/lib/requests';

const UNUSED_THRESHOLD = 5;

function formatPercent(numerator: number, denominator: number): string {
  if (denominator <= 0) {
    return '0%';
  }

  const value = (numerator / denominator) * 100;
  return `${value.toFixed(1)}%`;
}

export default function AdminAnalyticsPage() {
  const requests = getRequests();
  const services = getServices();
  const serviceViews = getServiceViews();

  const requestCounts = requests.reduce<Record<string, number>>((acc, request) => {
    acc[request.type] = (acc[request.type] ?? 0) + 1;
    return acc;
  }, {});

  const topRequested = Object.entries(requestCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const conversionRows = services.map((service: ServiceItem) => {
    const views = serviceViews[service.id] ?? 0;
    const serviceRequestType = `Service: ${service.name}`;
    const serviceRequests = requests.filter((request) => request.type === serviceRequestType).length;

    return {
      id: service.id,
      name: service.name,
      views,
      requests: serviceRequests,
      conversion: formatPercent(serviceRequests, views),
    };
  });

  const unusedServices = conversionRows.filter((row) => row.views < UNUSED_THRESHOLD);

  return (
    <section className="space-y-10">
      <header className="space-y-3">
        <h1 className="type-page-title">Admin analytics</h1>
        <p className="type-subtitle">
          Lightweight operational analytics computed from localStorage only.
        </p>
      </header>

      <section className="form-container">
        <h2 className="type-section-title">Top requested</h2>
        <p className="mt-1 text-xs text-muted">Top 5 request types by request count.</p>

        {topRequested.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No requests yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {topRequested.map((item) => (
              <li key={item.type} className="flex items-center justify-between rounded-none bg-surface px-3 py-2 border border-border">
                <span className="text-sm text-muted">{item.type}</span>
                <span className="type-card-title">{item.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="form-container">
        <h2 className="type-section-title">Conversion</h2>
        <p className="mt-1 text-xs text-muted">Views, requests, and conversion per service.</p>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-separate text-sm [border-spacing:0_8px]">
            <thead className="type-kicker text-left">
              <tr>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Views</th>
                <th className="px-3 py-2">Requests</th>
                <th className="px-3 py-2">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {conversionRows.map((row) => (
                <tr key={row.id} className="border border-border bg-surface">
                  <td className="px-3 py-2 text-muted">{row.name}</td>
                  <td className="px-3 py-2 text-muted">{row.views}</td>
                  <td className="px-3 py-2 text-muted">{row.requests}</td>
                  <td className="px-3 py-2 font-medium text-text">{row.conversion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="form-container">
        <h2 className="type-section-title">Unused services</h2>
        <p className="mt-1 text-xs text-muted">Services with fewer than {UNUSED_THRESHOLD} views.</p>

        {unusedServices.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No unused services based on current threshold.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {unusedServices.map((service) => (
              <li key={service.id} className="rounded-none border border-border bg-surface px-3 py-2">
                <p className="text-sm font-medium text-text">{service.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {service.views} views. Consider hiding, improving description, or A/B testing.
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
