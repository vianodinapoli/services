'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { fmt, STATUS_COLOR, STATUS_LABEL, type DischargeList } from '@/lib/laravel-types';
import { horaMaputo } from '@/lib/tempos';

type Camiao = DischargeList['data'][number];

/** Cores do atraso: iguais às da linha e às do sinal da central (nivelAtraso do Laravel). */
const COR_ATRASO: Record<string, { bg: string; texto: string; rotulo: string }> = {
  ok: { bg: 'bg-emerald-500', texto: 'text-emerald-700', rotulo: 'Dentro do prazo' },
  warn: { bg: 'bg-orange-500', texto: 'text-orange-700', rotulo: 'Atenção ao prazo' },
  danger: { bg: 'bg-red-600', texto: 'text-red-700', rotulo: 'Atrasado' },
};

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

  // Campos extra devolvidos pelo Laravel (atraso, observações, edição)
  const {
    nivel_atraso: nivel,
    atraso_minutos: minAtraso,
    atraso_motivo: motivoAtraso,
    observacoes,
    editado_por_nome: editadoPor,
    editado_em: editadoEm,
  } = c as Camiao & {
    nivel_atraso?: string | null;
    atraso_minutos?: number | null;
    atraso_motivo?: string | null;
    observacoes?: string | null;
    editado_por_nome?: string | null;
    editado_em?: string | null;
  };

  const corAtraso = nivel ? COR_ATRASO[nivel] : undefined;
  const obs = observacoes?.trim() || '';
  const editadoQuando = editadoEm
    ? new Date(editadoEm).toLocaleString('pt-PT', { timeZone: 'Africa/Maputo', dateStyle: 'short', timeStyle: 'short' })
    : '';

  // Os 4 tempos, com a hora do servidor (Maputo). "—" = ainda não aconteceu.
  const tempos = [
    { rotulo: 'Carregado', hora: horaMaputo(c.carregado_em) },
    { rotulo: 'Saiu do porto', hora: horaMaputo(c.saiu_porto_em) },
    { rotulo: 'Chegou à balança', hora: horaMaputo(c.chegou_balanca_em) },
    { rotulo: 'Confirmado', hora: horaMaputo(c.saiu_descarga_em) },
  ];

  const horaBase = horaMaputo(c.carregado_em) ?? c.hora_saida_porto;

  const linhas: { rotulo: string; valor: string }[] = [
    { rotulo: 'Guia', valor: String(c.numero_guia ?? '—') },
    { rotulo: 'Data e hora', valor: `${c.data ?? '—'}${horaBase ? ` ${horaBase}` : ''}` },
    { rotulo: 'Motorista', valor: String(c.motorista ?? '—') },
    { rotulo: 'Transportadora', valor: String(c.transportadora ?? '—') },
    { rotulo: 'Atrelado', valor: c.tipo_atrelado ? (c.tipo_atrelado === 'link' ? 'Link' : 'Normal') : '—' },
    { rotulo: 'Sacos', valor: String(c.total_sacos ?? '—') },
    { rotulo: 'Peso estimado', valor: `${fmt(c.peso_total_estimado, 0)} kg` },
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
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[c.status]}`}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                    {corAtraso && (
                      <span className="flex items-center gap-1.5">
                        <span
                          role="img"
                          aria-label={corAtraso.rotulo}
                          className={`h-3.5 w-3.5 rounded-full shadow ring-2 ring-white ${corAtraso.bg}`}
                        />
                        <span className={`text-xs font-semibold ${corAtraso.texto}`}>
                          {corAtraso.rotulo}
                          {minAtraso != null && minAtraso > 0 ? ` · ${minAtraso} min` : ''}
                        </span>
                      </span>
                    )}
                  </div>
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

              {/* Os 4 tempos */}
              <section className="border-b border-slate-100 p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tempos</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {tempos.map((t) => (
                    <div key={t.rotulo} className="min-w-0">
                      <div className="text-xs font-medium text-slate-500">{t.rotulo}</div>
                      <div className={`mt-0.5 text-lg font-bold tracking-tight ${t.hora ? 'text-slate-900' : 'text-slate-300'}`}>
                        {t.hora ?? '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 p-5">
                {linhas.map((l) => (
                  <div key={l.rotulo} className="min-w-0">
                    <dt className="text-xs font-medium text-slate-500">{l.rotulo}</dt>
                    <dd className="mt-1 break-words text-[15px] font-semibold text-slate-900">{l.valor}</dd>
                  </div>
                ))}
              </dl>

              {/* Atraso, observações e edição: só aparecem se existirem */}
              {(motivoAtraso || obs || editadoPor) && (
                <section className="space-y-2 border-t border-slate-100 p-5">
                  {motivoAtraso && (
                    <p className="text-sm font-semibold text-red-700">Atraso: {motivoAtraso}</p>
                  )}
                  {obs && (
                    <p className="break-words text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Obs.:</span> {obs}
                    </p>
                  )}
                  {editadoPor && (
                    <p className="text-xs text-slate-500">
                      Editado por <span className="font-semibold text-slate-700">{editadoPor}</span>
                      {editadoQuando ? ` · ${editadoQuando}` : ''}
                    </p>
                  )}
                </section>
              )}

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