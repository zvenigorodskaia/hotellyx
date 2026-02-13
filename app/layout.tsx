import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import AppChrome from '@/components/AppChrome';
import './globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const serif = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['500', '600', '700'],
});

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
      <body className={`${sans.variable} ${serif.variable}`}>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
