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
      <div className="flex h-14 items-center gap-3 border-b border-nitro-100 bg-white px-4 text-slate-800 md:hidden">
        <button onClick={() => setAberto(true)} aria-label="Abrir menu" className="flex h-11 w-11 items-center justify-center rounded-lg border border-nitro-100 text-nitro-700">
          <Icon name="menu" />
        </button>
        <img src="/nitro-logo.png" alt="Nitro S.A" className="h-8 w-8 object-contain" />
        <span className="font-display text-sm font-bold text-nitro-900">SGT - GRUPO FEM</span>
      </div>

      {aberto && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setAberto(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-nitro-100 bg-white transition-transform
          md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-[width] ${recolhida ? 'md:w-16' : 'md:w-64'}
          ${aberto ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Cabeçalho com logo */}
        <div className={`flex h-16 shrink-0 items-center gap-3 border-b border-nitro-100 px-4 ${recolhida ? 'md:justify-center md:px-0' : ''}`}>
          <button
            type="button"
            onClick={() => recolhida && alternar()}
            title={recolhida ? 'Expandir menu' : 'Nitro S.A'}
            className="shrink-0"
          >
            <img src="/nitro-logo.png" alt="Nitro S.A" className="h-9 w-9 object-contain" />
          </button>

          <div className={`min-w-0 flex-1 ${recolhida ? 'md:hidden' : ''}`}>
            <div className="truncate font-display text-[14.5px] font-bold leading-tight text-nitro-900">SGT - GRUPO FEM</div>
            <div className="text-[10px] uppercase tracking-[1.4px] text-nitro-600/70">Sistema de Gestão</div>
          </div>

          <button
            onClick={alternar}
            aria-label="Recolher menu"
            className={`hidden h-8 w-8 items-center justify-center rounded-lg border border-nitro-100 text-slate-400 hover:bg-nitro-50 hover:text-nitro-700 ${recolhida ? '' : 'md:flex'}`}
          >
            <Icon name="menu" className="h-4 w-4" />
          </button>
          <button onClick={() => setAberto(false)} aria-label="Fechar menu" className="flex h-10 w-10 items-center justify-center text-slate-400 md:hidden">
            <Icon name="close" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-2 pt-1">
          {GRUPOS.map((g) => (
            <div key={g.titulo}>
              <div className={`px-2.5 pb-1 pt-5 text-[9.5px] font-semibold uppercase tracking-[1.6px] text-slate-400 ${recolhida ? 'md:hidden' : ''}`}>
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
                        ? 'bg-nitro-50 font-semibold text-nitro-700 before:absolute before:bottom-[18%] before:left-0 before:top-[18%] before:w-[3px] before:rounded-r before:bg-nitro-500'
                        : 'text-slate-500 hover:bg-nitro-50/70 hover:text-nitro-800'}`}
                  >
                    <Icon name={i.icon} className={`h-[18px] w-[18px] ${ativo ? 'text-nitro-600' : 'opacity-70'}`} />
                    <span className={recolhida ? 'md:hidden' : ''}>{i.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Utilizador */}
        <div className="shrink-0 border-t border-nitro-100 p-2.5">
          <div className={`flex items-center gap-2.5 px-2.5 py-2 ${recolhida ? 'md:justify-center md:px-0' : ''}`}>
            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-nitro-200 bg-nitro-100 font-display text-[11px] font-semibold text-nitro-700">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className={`min-w-0 flex-1 ${recolhida ? 'md:hidden' : ''}`}>
              <div className="truncate text-[12.5px] font-medium text-slate-800">{user.name}</div>
              <div className="text-[10.5px] text-slate-400">{user.role || 'Membro'}</div>
            </div>
          </div>
          <button
            onClick={sair}
            className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-xs text-slate-400 transition-colors hover:bg-nitro-50 hover:text-nitro-700"
          >
            <Icon name="logout" className="h-4 w-4" />
            <span className={recolhida ? 'md:hidden' : ''}>Terminar sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
}