'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Instagram, Linkedin, Mail, Phone } from 'lucide-react';

type ScreenTab = 'guest' | 'staff' | 'admin';

const SCREEN_COPY: Record<
  ScreenTab,
  {
    title: string;
    bullets: string[];
    image: string;
  }
> = {
  guest: {
    title: 'Guest',
    bullets: [
      'Quick requests (towels, cleaning, water)',
      'Room status: Do not disturb / Please clean',
      'Real-time request status',
    ],
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80',
  },
  staff: {
    title: 'Staff',
    bullets: ['Live queue with statuses', 'Search by room', 'SLA risk filter (optional)'],
    image:
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1800&q=80',
  },
  admin: {
    title: 'Admin',
    bullets: ['Service catalog management', 'Room QR links', 'Service conversion analytics'],
    image:
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1800&q=80',
  },
};

const FAQ_ITEMS = [
  {
    q: 'How long does setup take?',
    a: 'Most pilot setups can be launched in a few days with your current operations team.',
  },
  {
    q: 'Do guests need to install an app?',
    a: 'No. Guests scan a QR code and use the web interface directly.',
  },
  {
    q: 'Can we customize services and categories?',
    a: 'Yes. Services, categories, and pricing text can be configured in admin screens.',
  },
  {
    q: 'Does it work for multi-property groups?',
    a: 'Yes. The workflow model supports scaling to multiple hotels with shared standards.',
  },
  {
    q: 'What data do you store and where?',
    a: 'For the current pilot, data is stored locally for demo purposes. Production storage is configurable.',
  },
];

const SURFACE_BORDER = 'border border-[rgba(0,0,0,0.08)]';
const CHECKLIST_CLASS = 'pt-[30px] space-y-4 text-[15px] leading-8 text-[rgb(70,60,55)]';
const CHECKLIST_ITEM_CLASS =
  "relative pl-9 before:absolute before:left-0 before:top-[2px] before:text-[24px] before:font-semibold before:leading-none before:text-[rgb(103,20,14)] before:content-['✓']";

type CheckListProps = {
  items: string[];
};

function CheckList({ items }: CheckListProps) {
  return (
    <ul className={CHECKLIST_CLASS}>
      {items.map((item) => (
        <li key={item} className={CHECKLIST_ITEM_CLASS}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<ScreenTab>('guest');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="bg-[#fcf7f7] text-[rgb(30,25,22)]">
      <section id="hero" className="relative min-h-[86vh]">
        <img
          src="/hero.jpg"
          alt="Luxury hotel lobby"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="relative mx-auto flex min-h-[86vh] w-full max-w-[1200px] items-center px-4 py-28 sm:px-6 md:py-36">
          <div className="max-w-3xl space-y-8 bg-[#00000057] px-8 py-10 backdrop-blur-[10px] md:px-12 md:py-12">
            <h1 className="text-5xl leading-[1.14] tracking-[0.01em] text-white md:text-7xl">
              Service Operations and Upsell System for Hotels
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white md:text-lg">
              Hotellyx turns room service into a trackable workflow for guests, staff, and managers - without adding
              staff or complex integrations.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="#cta"
                className="inline-flex min-h-8 items-center justify-center rounded-[2px] bg-[rgb(103,20,14)] px-8 py-3 text-sm font-medium text-white no-underline transition-colors duration-200 hover:bg-[rgb(120,28,22)] hover:text-white hover:no-underline"
              >
                Book a demo
              </Link>
              <Link
                href="#screens"
                className="inline-flex min-h-8 items-center justify-center rounded-[2px] bg-[rgb(236,227,220)] px-8 py-3 text-sm font-medium text-[rgb(30,25,22)] no-underline transition-colors duration-200 hover:bg-[rgb(224,214,206)] hover:no-underline"
              >
                See product screens
              </Link>
            </div>
            <p className="text-sm leading-7 text-white">
              For independent hotels that want better guest reviews and stronger margins.
            </p>
          </div>
        </div>
      </section>

      <section id="problem" className="px-4 py-14 sm:px-6 md:py-28">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 md:grid-cols-[1fr_1.1fr] md:gap-14">
          <div className="space-y-5">
            <h2 className="text-4xl leading-[1.2] text-[rgb(30,25,22)] md:text-5xl">
              Manual service creates chaos (and missed revenue)
            </h2>
            <p className="max-w-xl text-base leading-8 text-[rgb(70,60,55)]">
              Luxury guest experience breaks when service operations stay manual.
            </p>
          </div>
          <CheckList
            items={[
              'Requests get lost between reception and housekeeping',
              'Guests call, wait, repeat - often in a different language',
              'No SLA visibility, no prioritization',
              'Upsell services exist, but conversion is invisible',
            ]}
          />
        </div>
      </section>

      <section id="changes" className="bg-[#f2ecec] px-4 py-14 sm:px-6 md:py-28">
        <div className="mx-auto w-full max-w-[1200px] space-y-10">
          <h2 className="text-4xl leading-[1.2] text-[rgb(30,25,22)] md:text-5xl">
            From room requests to a measurable workflow
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            <article className={`${SURFACE_BORDER} bg-white p-7`}>
              <h3 className="text-2xl leading-[1.24] text-[rgb(30,25,22)]">All requests in one place</h3>
              <p className="mt-3 text-sm leading-7 text-[rgb(70,60,55)]">Track new, in progress, done, and SLA risk.</p>
            </article>
            <article className={`${SURFACE_BORDER} bg-white p-7`}>
              <h3 className="text-2xl leading-[1.24] text-[rgb(30,25,22)]">Clear guest status</h3>
              <p className="mt-3 text-sm leading-7 text-[rgb(70,60,55)]">
                Guests see what is happening, without calling reception.
              </p>
            </article>
            <article className={`${SURFACE_BORDER} bg-white p-7`}>
              <h3 className="text-2xl leading-[1.24] text-[rgb(30,25,22)]">Built-in upsell layer</h3>
              <p className="mt-3 text-sm leading-7 text-[rgb(70,60,55)]">
                Turn services into a catalog with conversion analytics.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="how" className="px-4 py-14 sm:px-6 md:py-28">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 md:grid-cols-[1.08fr_0.92fr] md:gap-14">
          <div className="space-y-7">
            <h2 className="text-4xl leading-[1.2] text-[rgb(30,25,22)] md:text-5xl">Simple for guests. Clear for staff.</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className={`${SURFACE_BORDER} bg-white px-5 py-4 text-sm leading-7 text-[rgb(70,60,55)]`}>
                1. Guest scans the room QR
              </div>
              <div className={`${SURFACE_BORDER} bg-white px-5 py-4 text-sm leading-7 text-[rgb(70,60,55)]`}>
                2. Requests a service (or changes room status)
              </div>
              <div className={`${SURFACE_BORDER} bg-white px-5 py-4 text-sm leading-7 text-[rgb(70,60,55)]`}>
                3. Staff handles it from a live dashboard
              </div>
              <div className={`${SURFACE_BORDER} bg-white px-5 py-4 text-sm leading-7 text-[rgb(70,60,55)]`}>
                4. Managers see performance and service conversion
              </div>
            </div>
          </div>
          <div className={`${SURFACE_BORDER} overflow-hidden bg-white`}>
            <img
              src="/simple_for_guests.jpg"
              alt="Guest arriving at hotel"
              className="h-full min-h-[360px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section id="screens" className="bg-[#fcf7f7] px-4 py-14 sm:px-6 md:py-28">
        <div className="mx-auto w-full max-w-[1200px] space-y-9">
          <h2 className="text-4xl leading-[1.2] text-[rgb(30,25,22)] md:text-5xl">One system - three views</h2>

          <div className="flex flex-wrap gap-2">
            {(['guest', 'staff', 'admin'] as ScreenTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`min-h-8 px-5 py-2 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab
                    ? 'bg-[rgb(103,20,14)] text-white'
                    : 'bg-[rgb(236,227,220)] text-[rgb(30,25,22)] hover:bg-[rgb(224,214,206)]'
                }`}
              >
                {SCREEN_COPY[tab].title}
              </button>
            ))}
          </div>

          <div className={`${SURFACE_BORDER} grid grid-cols-1 gap-6 bg-white p-6 md:grid-cols-[1.05fr_0.95fr]`}>
            <div className={`${SURFACE_BORDER} overflow-hidden bg-white`}>
              <img
                src={SCREEN_COPY[activeTab].image}
                alt={`${SCREEN_COPY[activeTab].title} interface`}
                className="h-full min-h-[380px] w-full object-cover"
              />
            </div>
            <ul className="space-y-3 text-sm leading-8 text-[rgb(70,60,55)]">
              {SCREEN_COPY[activeTab].bullets.map((bullet) => (
                <li key={bullet} className={`${SURFACE_BORDER} bg-[rgb(250,247,243)] px-5 py-4`}>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="#cta"
            className="inline-flex min-h-8 items-center justify-center rounded-[2px] bg-[rgb(103,20,14)] px-8 py-3 text-sm font-medium text-white no-underline transition-colors duration-200 hover:bg-[rgb(120,28,22)] hover:text-white hover:no-underline"
          >
            Book a demo
          </Link>
        </div>
      </section>

      <section id="why" className="bg-[#f2ecec] px-4 py-14 sm:px-6 md:py-28">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 md:grid-cols-[1fr_0.95fr] md:gap-14">
          <div className="space-y-5">
            <h2 className="text-4xl leading-[1.2] text-[rgb(30,25,22)] md:text-5xl">Built for fast deployment</h2>
            <p className="max-w-xl text-base leading-8 text-[rgb(70,60,55)]">
              Integration with PMS can come later - pilot does not require it.
            </p>
            <div className={`${SURFACE_BORDER} overflow-hidden bg-white`}>
              <img
                src="/fast-dev.jpg"
                alt="Luxury bathroom with soft candle lighting"
                className="h-[360px] w-full object-cover"
              />
            </div>
          </div>
          <CheckList
            items={[
              'No app install for guests',
              'No guest accounts',
              'Works with your existing workflow',
              'Setup in days, not months',
            ]}
          />
        </div>
      </section>

      <section id="cta" className="bg-[#fcf7f7] px-4 py-14 sm:px-6 md:py-28">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 md:grid-cols-[1.08fr_0.92fr] md:gap-14">
          <div className="space-y-7">
            <h2 className="text-4xl leading-[1.2] text-[rgb(30,25,22)] md:text-5xl">Ready to modernize hotel operations?</h2>
            <Link
              href="mailto:demo@hotellyx.com?subject=Hotellyx%20Demo"
              className="inline-flex min-h-8 items-center justify-center rounded-[2px] bg-[rgb(103,20,14)] px-8 py-3 text-sm font-medium text-white no-underline transition-colors duration-200 hover:bg-[rgb(120,28,22)] hover:text-white hover:no-underline"
            >
              Book a demo
            </Link>

            <div className="space-y-4 md:space-y-5">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={item.q}
                    className={`border border-[rgba(0,0,0,0.06)] bg-white p-6 transition-shadow duration-200 ${
                      isOpen ? 'shadow-[0_8px_30px_rgba(0,0,0,0.04)]' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span className="font-serif text-xl leading-7 text-[rgb(30,25,22)]">{item.q}</span>
                      <span className="text-[rgb(70,60,55)]">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen ? <p className="pt-4 text-base leading-8 text-[rgba(0,0,0,0.7)]">{item.a}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-[6px] bg-white shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
            <img
              src="/ready.jpg"
              alt="Elegant evening couple in luxury hotel scene"
              className="h-full min-h-[460px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <footer className="bg-[#12100f] px-4 py-12 sm:px-6">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-8 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div className="space-y-4">
            <p className="text-2xl font-semibold tracking-tight text-[rgb(156,20,11)]">Hotellyx</p>
            <p className="max-w-md text-sm leading-7 text-[rgb(232,220,206)]">
              123 Hospitality Avenue, London, UK
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-[rgb(232,220,206)] transition-colors hover:text-white"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-[rgb(232,220,206)] transition-colors hover:text-white"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="mailto:hello@hotellyx.com"
                className="inline-flex text-[rgb(232,220,206)] transition-colors hover:text-white"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
              <a
                href="tel:+442079460000"
                className="inline-flex text-[rgb(232,220,206)] transition-colors hover:text-white"
                aria-label="Phone"
              >
                <Phone size={20} />
              </a>
            </div>
          </div>

          <div className="space-y-3 text-sm text-[rgb(232,220,206)] md:justify-self-end md:text-right">
            <p>All rights reserved.</p>
            <Link href="#hero" className="text-[rgb(232,220,206)] transition-colors hover:text-white hover:no-underline">
              Privacy policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
