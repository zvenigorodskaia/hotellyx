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
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900">Admin analytics</h1>
        <p className="mt-2 text-sm text-slate-500">
          Lightweight operational analytics computed from localStorage only.
        </p>
      </header>

      <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
        <h2 className="text-base font-semibold text-slate-900">Top requested</h2>
        <p className="mt-1 text-xs text-slate-500">Top 5 request types by request count.</p>

        {topRequested.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No requests yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {topRequested.map((item) => (
              <li key={item.type} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-800">{item.type}</span>
                <span className="text-sm font-semibold text-slate-900">{item.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
        <h2 className="text-base font-semibold text-slate-900">Conversion</h2>
        <p className="mt-1 text-xs text-slate-500">Views, requests, and conversion per service.</p>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Views</th>
                <th className="px-3 py-2">Requests</th>
                <th className="px-3 py-2">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conversionRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 text-slate-800">{row.name}</td>
                  <td className="px-3 py-2 text-slate-700">{row.views}</td>
                  <td className="px-3 py-2 text-slate-700">{row.requests}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{row.conversion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-white/70 backdrop-blur-md">
        <h2 className="text-base font-semibold text-slate-900">Unused services</h2>
        <p className="mt-1 text-xs text-slate-500">Services with fewer than {UNUSED_THRESHOLD} views.</p>

        {unusedServices.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No unused services based on current threshold.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {unusedServices.map((service) => (
              <li key={service.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-sm font-medium text-slate-900">{service.name}</p>
                <p className="mt-0.5 text-xs text-slate-600">
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
