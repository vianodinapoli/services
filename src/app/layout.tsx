import './globals.css';
import type { Metadata, Viewport } from 'next';
import { DM_Sans, Syne } from 'next/font/google';
import NavProgress from '@/components/NavProgress';
import FeitoHost from '@/components/FeitoHost';
import InstalarApp from '@/components/InstalarApp';
import type { Viewport } from "next";


const dm = DM_Sans({ subsets: ['latin'], variable: '--font-dm' });
const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-syne' });

export const metadata: Metadata = {
  title: 'SGL - Descargas',
  applicationName: 'SGL - Descargas',
  appleWebApp: {
    capable: true,
    title: 'Descargas',
    statusBarStyle: 'black-translucent',
  },
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


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a", // usa a cor do teu cabeçalho
};

export const metadata = {
  title: "FEM Descargas",
  appleWebApp: { capable: true, title: "Descargas", statusBarStyle: "black-translucent" },
  icons: { apple: "/apple-touch-icon.png" },
};