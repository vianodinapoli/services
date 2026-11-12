'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from './icons';

const GRUPOS = [
  {
    titulo: 'Descarga / Navio',
    itens: [{ href: '/operacoes', label: 'Operações', icon: 'anchor' as const, match: ['/operacoes'] }],
  },
  {
    titulo: 'Módulo local',
    itens: [
      { href: '/operations', label: 'Descargas de navio', icon: 'ship' as const, match: ['/operations', '/discharges'] },
      { href: '/contentores', label: 'Contentores', icon: 'box' as const, match: ['/contentores'] },
    ],
  },
];

export default function Sidebar({ user }: { user: { name: string; role: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [recolhida, setRecolhida] = useState(false);

  useEffect(() => {
    try { setRecolhida(localStorage.getItem('sb-collapsed') === '1'); } catch {}
  }, []);
  useEffect(() => { setAberto(false); }, [pathname]);

  const alternar = () => {
    const v = !recolhida;
    setRecolhida(v);
    try { localStorage.setItem('sb-collapsed', v ? '1' : '0'); } catch {}
  };

  async function sair() {
    await fetch('/api/laravel/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <div className="flex h-14 items-center gap-3 bg-sb px-4 text-white md:hidden">
        <button onClick={() => setAberto(true)} aria-label="Abrir menu" className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10">
          <Icon name="menu" />
        </button>
        <span className="font-display text-sm font-bold">SGL - CREATIV DEMO</span>
      </div>

      {aberto && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setAberto(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/5 bg-sb transition-transform
          md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-[width] ${recolhida ? 'md:w-16' : 'md:w-64'}
          ${aberto ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex h-16 shrink-0 items-center gap-3 border-b border-white/5 px-4 ${recolhida ? 'md:justify-center md:px-0' : ''}`}>
          <div className={`min-w-0 flex-1 ${recolhida ? 'md:hidden' : ''}`}>
            <div className="truncate font-display text-[14.5px] font-bold leading-tight text-slate-100">SGL - CREATIV DEMO</div>
            <div className="text-[10px] uppercase tracking-[1.4px] text-gray-500">Sistema de Gestão</div>
          </div>
          <button onClick={alternar} aria-label="Recolher menu" className="hidden h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:bg-white/5 hover:text-slate-200 md:flex">
            <Icon name="menu" className="h-4 w-4" />
          </button>
          <button onClick={() => setAberto(false)} aria-label="Fechar menu" className="flex h-10 w-10 items-center justify-center text-gray-500 md:hidden">
            <Icon name="close" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-2 pt-1">
          {GRUPOS.map((g) => (
            <div key={g.titulo}>
              <div className={`px-2.5 pb-1 pt-5 text-[9.5px] font-semibold uppercase tracking-[1.6px] text-white/20 ${recolhida ? 'md:hidden' : ''}`}>
                {g.titulo}
              </div>
              {g.itens.map((i) => {
                const ativo = i.match.some((r) => pathname === r || pathname.startsWith(r + '/'));
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    title={i.label}
                    className={`relative mb-0.5 flex min-h-11 items-center gap-3 overflow-hidden whitespace-nowrap rounded-lg px-2.5 text-[13.5px] transition-colors
                      ${recolhida ? 'md:justify-center md:px-0' : ''}
                      ${ativo
                        ? 'bg-[rgba(198,10,26,.14)] font-medium text-[#fca5a5] before:absolute before:bottom-[18%] before:left-0 before:top-[18%] before:w-[2.5px] before:rounded-r before:bg-accent'
                        : 'text-gray-500 hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    <Icon name={i.icon} className={`h-[18px] w-[18px] ${ativo ? 'text-red-400' : 'opacity-70'}`} />
                    <span className={recolhida ? 'md:hidden' : ''}>{i.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/5 p-2.5">
          <div className={`flex items-center gap-2.5 px-2.5 py-2 ${recolhida ? 'md:justify-center md:px-0' : ''}`}>
            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[rgba(198,10,26,.3)] bg-[rgba(198,10,26,.14)] font-display text-[11px] font-semibold text-[#fca5a5]">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className={`min-w-0 flex-1 ${recolhida ? 'md:hidden' : ''}`}>
              <div className="truncate text-[12.5px] font-medium text-slate-200">{user.name}</div>
              <div className="text-[10.5px] text-gray-500">{user.role || 'Membro'}</div>
            </div>
          </div>
          <button onClick={sair} className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-xs text-white/30 transition-colors hover:bg-[rgba(198,10,26,.08)] hover:text-red-400">
            <Icon name="logout" className="h-4 w-4" />
            <span className={recolhida ? 'md:hidden' : ''}>Terminar sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
}
