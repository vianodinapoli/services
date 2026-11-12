'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const IconNavio = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l2 3h14l2-3-9-3-9 3z" /><path d="M6 14V9h12v5" /><path d="M10 9V5h4v4" />
  </svg>
);
const IconCaixa = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" />
  </svg>
);

// Para acrescentar uma página à sidebar, basta juntar uma linha aqui.
const ITENS = [
  { href: '/operations', label: 'Descargas de navio', icon: <IconNavio />, rotas: ['/operations', '/discharges'] },
  { href: '/contentores', label: 'Contentores', icon: <IconCaixa />, rotas: ['/contentores'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);        // gaveta no telemóvel
  const [recolhida, setRecolhida] = useState(false);  // só ícones no ecrã grande

  useEffect(() => {
    try { setRecolhida(localStorage.getItem('sidebar-recolhida') === '1'); } catch {}
  }, []);
  useEffect(() => { setAberto(false); }, [pathname]);

  const alternar = () => {
    const v = !recolhida;
    setRecolhida(v);
    try { localStorage.setItem('sidebar-recolhida', v ? '1' : '0'); } catch {}
  };

  return (
    <>
      {/* barra superior (telemóvel) */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden print:hidden">
        <button onClick={() => setAberto(true)} aria-label="Abrir menu" className="rounded-md border border-slate-200 p-1.5">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="font-extrabold text-slate-900">FEM</span>
      </div>

      {aberto && <div className="fixed inset-0 z-30 bg-black/40 md:hidden print:hidden" onClick={() => setAberto(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform print:hidden
          md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-[width] ${recolhida ? 'md:w-16' : 'md:w-60'}
          ${aberto ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex h-14 items-center border-b border-slate-100 px-4 ${recolhida ? 'md:justify-center md:px-0' : ''}`}>
          <span className="text-lg font-extrabold text-slate-900">{recolhida ? <><span className="md:hidden">FEM</span><span className="hidden md:inline">F</span></> : 'FEM'}</span>
          <button onClick={() => setAberto(false)} aria-label="Fechar menu" className="ml-auto rounded p-1 text-slate-400 md:hidden">✕</button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {ITENS.map((i) => {
            const ativo = i.rotas.some((r) => pathname === r || pathname.startsWith(r + '/'));
            return (
              <Link key={i.href} href={i.href} title={i.label} aria-current={ativo ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors
                      ${recolhida ? 'md:justify-center md:px-0' : ''}
                      ${ativo ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {i.icon}
                <span className={recolhida ? 'md:hidden' : ''}>{i.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-slate-100 p-2 md:block">
          <button onClick={alternar} title={recolhida ? 'Expandir menu' : 'Recolher menu'}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 ${recolhida ? 'justify-center px-0' : ''}`}>
            <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 transition-transform ${recolhida ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            {!recolhida && <span>Recolher</span>}
          </button>
        </div>
      </aside>
    </>
  );
}