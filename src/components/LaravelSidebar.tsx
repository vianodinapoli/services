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
      // { href: '/operations', label: 'Descargas de navio', icon: 'ship' as const, match: ['/operations', '/discharges'] },
      // { href: '/contentores', label: 'Contentores', icon: 'box' as const, match: ['/contentores'] },
    ],
  },
];

const foco =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100';

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
      {/* Barra superior (mobile) */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 text-slate-800 md:hidden"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', height: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
      >
        <button
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          className={`flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 active:scale-95 ${foco}`}
        >
          <Icon name="menu" />
        </button>
        <img src="/nitro-logo.png" alt="Nitro S.A" className="h-8 w-8 object-contain" />
        <span className="font-display text-base font-bold tracking-tight text-slate-900">SGT - GRUPO FEM</span>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 md:hidden" onClick={() => setAberto(false)} aria-hidden="true" />
      )}

      <aside
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform
          md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-[width] ${recolhida ? 'md:w-20' : 'md:w-64'}
          ${aberto ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Cabeçalho com logo */}
        <div
          className={`flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-4 ${recolhida ? 'md:justify-center md:px-0' : ''}`}
        >
          <button
            type="button"
            onClick={() => recolhida && alternar()}
            title={recolhida ? 'Expandir menu' : 'Nitro S.A'}
            className={`shrink-0 rounded-lg ${foco}`}
          >
            <img src="/nitro-logo.png" alt="Nitro S.A" className="h-9 w-9 object-contain" />
          </button>

          <div className={`min-w-0 flex-1 ${recolhida ? 'md:hidden' : ''}`}>
            <div className="truncate font-display text-base font-bold leading-tight tracking-tight text-slate-900">
              SGT - GRUPO FEM
            </div>
            <div className="text-xs text-slate-500">Sistema de Gestão</div>
          </div>

          <button
            onClick={alternar}
            aria-label="Recolher menu"
            className={`hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 ${foco} ${recolhida ? '' : 'md:flex'}`}
          >
            <Icon name="menu" className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAberto(false)}
            aria-label="Fechar menu"
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 md:hidden ${foco}`}
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2 pt-1" aria-label="Menu principal">
          {GRUPOS.map((g) => (
            <div key={g.titulo}>
              <div
                className={`px-3 pb-1.5 pt-5 text-xs font-semibold text-slate-500 ${recolhida ? 'md:hidden' : ''}`}
              >
                {g.titulo}
              </div>
              {g.itens.map((i) => {
                const ativo = i.match.some((r) => pathname === r || pathname.startsWith(r + '/'));
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    title={i.label}
                    aria-current={ativo ? 'page' : undefined}
                    className={`relative mb-1 flex min-h-12 items-center gap-3 overflow-hidden whitespace-nowrap rounded-xl px-3 text-[15px] transition-colors ${foco}
                      ${recolhida ? 'md:justify-center md:px-0' : ''}
                      ${ativo
                        ? 'bg-red-50 font-semibold text-accent before:absolute before:bottom-[20%] before:left-0 before:top-[20%] before:w-[3px] before:rounded-r before:bg-accent'
                        : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <Icon name={i.icon} className={`h-5 w-5 shrink-0 ${ativo ? 'text-accent' : 'text-slate-400'}`} />
                    <span className={recolhida ? 'md:hidden' : ''}>{i.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Utilizador */}
        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className={`flex items-center gap-3 px-3 py-2 ${recolhida ? 'md:justify-center md:px-0' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50 font-display text-sm font-semibold text-accent">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className={`min-w-0 flex-1 ${recolhida ? 'md:hidden' : ''}`}>
              <div className="truncate text-sm font-semibold text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500">{user.role || 'Membro'}</div>
            </div>
          </div>
          <button
            onClick={sair}
            title="Terminar sessão"
            className={`mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-accent ${foco}`}
          >
            <Icon name="logout" className="h-4 w-4" />
            <span className={recolhida ? 'md:hidden' : ''}>Terminar sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
}