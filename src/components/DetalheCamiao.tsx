'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { fmt, STATUS_COLOR, STATUS_LABEL, type DischargeList } from '@/lib/laravel-types';

type Camiao = DischargeList['data'][number];

export default function DetalheCamiao({
  camiao: c,
  href,
  className,
}: {
  camiao: Camiao;
  href: string;
  className: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  // Fecha com Esc e bloqueia o scroll da página enquanto o modal está aberto
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false);
    };
    document.addEventListener('keydown', onKey);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  const linhas: { rotulo: string; valor: string }[] = [
    { rotulo: 'Guia', valor: String(c.numero_guia ?? '—') },
    { rotulo: 'Data e hora', valor: `${c.data ?? '—'}${c.hora_saida_porto ? ` ${c.hora_saida_porto}` : ''}` },
    { rotulo: 'Motorista', valor: String(c.motorista ?? '—') },
    { rotulo: 'Transportadora', valor: String(c.transportadora ?? '—') },
    { rotulo: 'Atrelado', valor: c.tipo_atrelado ? (c.tipo_atrelado === 'link' ? 'Link' : 'Normal') : '—' },
    { rotulo: 'Sacos', valor: String(c.total_sacos ?? '—') },
    { rotulo: 'Peso estimado', valor: `${fmt(c.peso_total_estimado, 1)} t` },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Ver detalhes do camião ${c.matricula}`}
        title="Ver detalhes"
        className={className}
      >
        <Icon name="eye" className="h-5 w-5" />
      </button>

      {montado &&
        aberto &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
            onClick={() => setAberto(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`detalhe-${c.id}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                <div className="min-w-0">
                  <h2 id={`detalhe-${c.id}`} className="truncate text-xl font-bold tracking-tight text-slate-900">
                    {c.matricula}
                  </h2>
                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[c.status]}`}
                  >
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  aria-label="Fechar"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-5">
                {linhas.map((l) => (
                  <div key={l.rotulo} className="min-w-0">
                    <dt className="text-xs font-medium text-slate-500">{l.rotulo}</dt>
                    <dd className="mt-1 break-words text-[15px] font-semibold text-slate-900">{l.valor}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="h-12 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Fechar
                </button>
                <Link
                  href={href}
                  className="flex h-12 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white hover:opacity-95"
                >
                  Abrir ticket completo
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}