import { cookies } from 'next/headers';
import Sidebar from '@/components/LaravelSidebar';

function lerUser(raw?: string): { name: string; role: string } {
  const fallback = { name: 'Utilizador', role: '' };
  if (!raw) return fallback;
  for (const v of [raw, (() => { try { return decodeURIComponent(raw); } catch { return raw; } })()]) {
    try {
      const u = JSON.parse(v);
      return { name: u.name ?? fallback.name, role: u.role ?? '' };
    } catch {}
  }
  return fallback;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = lerUser((await cookies()).get('user')?.value);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar user={user} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
