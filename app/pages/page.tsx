import Link from 'next/link';

type HubLink = {
  title: string;
  href?: string;
  hint: string;
  path: string;
};

const guestLinks: HubLink[] = [
  {
    title: 'Room home example',
    href: '/r/101',
    hint: 'Pattern: /r/[token]',
    path: '/r/101',
  },
  {
    title: 'Services catalog',
    href: '/r/101/services',
    hint: 'Pattern: /r/[token]/services',
    path: '/r/101/services',
  },
  {
    title: 'Service details',
    href: '/r/101/services/svc_spa_massage',
    hint: 'Pattern: /r/[token]/services/[serviceId]',
    path: '/r/101/services/svc_spa_massage',
  },
  {
    title: 'Request form',
    href: '/r/101/request?type=Towels',
    hint: 'Pattern: /r/[token]/request',
    path: '/r/101/request',
  },
  {
    title: 'My requests (list)',
    hint: 'No dedicated route found in app/. Currently shown inside room home page.',
    path: 'Coming soon',
  },
  {
    title: 'Request details',
    href: '/r/101/requests/request-001',
    hint: 'Pattern: /r/[token]/requests/[requestId]',
    path: '/r/101/requests/request-001',
  },
];

const staffLinks: HubLink[] = [
  {
    title: 'Staff login',
    href: '/staff/login',
    hint: 'Current login placeholder route',
    path: '/staff/login',
  },
  {
    title: 'Staff dashboard',
    href: '/staff',
    hint: 'Live queue and request operations',
    path: '/staff',
  },
  {
    title: 'Rooms page',
    href: '/staff/rooms',
    hint: 'Room tokens and QR management',
    path: '/staff/rooms',
  },
  {
    title: 'Room details',
    href: '/staff/rooms/101',
    hint: 'Pattern: /staff/rooms/[token]',
    path: '/staff/rooms/101',
  },
];

const adminLinks: HubLink[] = [
  {
    title: 'Admin catalog',
    href: '/admin/services',
    hint: 'Service management',
    path: '/admin/services',
  },
  {
    title: 'Admin analytics',
    href: '/admin/analytics',
    hint: 'Requests and conversion metrics',
    path: '/admin/analytics',
  },
];

function LinkSection({ title, links }: { title: string; links: HubLink[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <ul className="space-y-2">
        {links.map((item) => (
          <li key={item.title}>
            {item.href ? (
              <Link href={item.href} className="block border border-border bg-surface p-4 transition-colors hover:bg-surface-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-base font-semibold text-text">{item.title}</p>
                  <span className="border border-border bg-surface px-2 py-0.5 text-xs text-muted">
                    {item.path}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{item.hint}</p>
              </Link>
            ) : (
              <div className="border border-dashed border-border bg-surface-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-base font-semibold text-text">{item.title}</p>
                  <span className="px-2 py-0.5 text-xs text-muted">{item.path}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{item.hint}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function PagesHubPage() {
  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-text">Hotellyx pages</h1>
        <p className="mt-2 text-sm text-muted">Internal navigation hub for all current product screens.</p>
      </header>

      <LinkSection title="Guest" links={guestLinks} />
      <LinkSection title="Staff/Reception" links={staffLinks} />
      <LinkSection title="Admin" links={adminLinks} />
    </section>
  );
}
