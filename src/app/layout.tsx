import './globals.css';
import type { Metadata, Viewport } from 'next';
import { DM_Sans, Syne } from 'next/font/google';
import NavProgress from '@/components/NavProgress';
import FeitoHost from '@/components/FeitoHost';
import InstalarApp from '@/components/InstalarApp';

const dm = DM_Sans({ subsets: ['latin'], variable: '--font-dm' });
const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-syne' });

export const metadata: Metadata = {
  title: 'SGL - Descargas',
  applicationName: 'SGL - Descargas',
  appleWebApp: {
    capable: true,
    title: 'Descargas',
    statusBarStyle: 'default',
  },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${dm.variable} ${syne.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        <NavProgress />
        {children}
        <FeitoHost />
        <InstalarApp />
      </body>
    </html>
  );
}
