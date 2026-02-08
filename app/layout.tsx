import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hotellyx',
  description: 'Hotellyx web app scaffold',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="relative min-h-screen overflow-hidden bg-slate-950/5">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-100/70 via-slate-100 to-violet-100/60" />
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] [background-size:18px_18px]" />

          <header className="border-b border-white/40 bg-white/50 backdrop-blur-xl">
            <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
              <p className="text-lg font-semibold tracking-tight text-slate-900">Hotellyx</p>
            </div>
          </header>

          <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>
        </div>
      </body>
    </html>
  );
}
