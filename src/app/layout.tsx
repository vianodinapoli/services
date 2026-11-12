import './globals.css';
import { DM_Sans, Syne } from 'next/font/google';
import NavProgress from '@/components/NavProgress';

const dm = DM_Sans({ subsets: ['latin'], variable: '--font-dm' });
const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-syne' });

export const metadata = { title: 'SGL - Descargas' };
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${dm.variable} ${syne.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        <NavProgress />
        {children}
      </body>
    </html>
  );
}