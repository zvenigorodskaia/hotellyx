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
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto w-full max-w-4xl px-4 py-4">
              <p className="text-lg font-semibold">Hotellyx</p>
            </div>
          </header>
          <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
