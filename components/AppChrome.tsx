'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

type AppChromeProps = {
  children: ReactNode;
};

export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)]">
      {isLanding ? (
        <header className="sticky top-0 z-50 border-b border-[rgba(0,0,0,0.08)] bg-[#fcf7f7]/95 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link href="/pages" className="inline-flex text-lg font-semibold tracking-tight text-[rgb(156,20,11)] transition-colors hover:text-[rgb(170,30,20)]">
              Hotellyx
            </Link>

            <nav className="hidden items-center gap-6 text-sm md:flex">
              <Link href="#problem" className="text-[rgb(146,88,80)] transition-colors hover:text-[rgb(126,44,38)] hover:no-underline">
                Problem
              </Link>
              <Link href="#how" className="text-[rgb(146,88,80)] transition-colors hover:text-[rgb(126,44,38)] hover:no-underline">
                How it works
              </Link>
              <Link href="#screens" className="text-[rgb(146,88,80)] transition-colors hover:text-[rgb(126,44,38)] hover:no-underline">
                Screens
              </Link>
              <Link href="#cta" className="text-[rgb(146,88,80)] transition-colors hover:text-[rgb(126,44,38)] hover:no-underline">
                FAQ
              </Link>
            </nav>

            <Link href="#cta" className="inline-flex min-h-8 items-center justify-center rounded-[2px] bg-[rgb(103,20,14)] px-5 py-3 text-sm font-medium text-white no-underline transition-colors hover:bg-[rgb(120,28,22)] hover:no-underline">
              Book a demo
            </Link>
          </div>
        </header>
      ) : (
        <header className="border-b border-[var(--border)] bg-[var(--bg-main)]">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
            <Link
              href="/pages"
              className="inline-flex text-lg font-semibold tracking-tight text-[rgb(156,20,11)] transition-colors hover:text-[rgb(170,30,20)]"
            >
              Hotellyx
            </Link>
            <Link href="/pages" className="text-sm text-[rgb(120,30,25)] transition-colors hover:text-[rgb(103,20,14)]">
              Product pages
            </Link>
          </div>
        </header>
      )}

      <main className={isLanding ? 'mx-auto w-full max-w-none p-0' : 'mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14'}>
        {children}
      </main>
    </div>
  );
}
