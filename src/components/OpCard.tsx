'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './icons';
import { fmt, type Operation } from '@/lib/laravel-types';

const AMARELO = 80;
const VERMELHO = 120;

export default function OpCard({ op }: { op: Operation }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const min =
    op.pendentes_count > 0 && op.pendente_desde && now
      ? Math.max(0, Math.floor((now - op.pendente_desde) / 60000))
      : null;
  const nivel = min === null ? '' : min >= VERMELHO ? 'danger' : min >= AMARELO ? 'warn' : '';
  const tempo = min === null ? '' : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
  const pct = op.esperado_ton > 0 ? Math.min(100, Math.round((op.recebido_ton / op.esperado_ton) * 1000) / 10) : 0;

  const borda =
    nivel === 'danger' ? 'border-2 border-red-600 bg-red-50'
    : nivel === 'warn' ? 'border-2 border-amber-500 bg-amber-50'
    : 'border border-[#e9ecef] bg-white';

  let chip: React.ReactNode;
  if (op.pendentes_count > 0) {
    const cor =
      nivel === 'danger' ? 'bg-red-100 text-red-700 animate-pulse'
      : nivel === 'warn' ? 'bg-amber-100 text-amber-700'
      : 'bg-[#e0f7fc] text-[#0aa2c0]';
    chip = (
      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${cor}`}>
        <Icon name={nivel ? 'alert' : 'truck'} className="h-3.5 w-3.5" />
        {op.pendentes_count} por confirmar{tempo ? ` · ${tempo}` : ''}
      </span>
    );
  } else if (op.camioes_count > 0) {
    chip = (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e6f4ec] px-3 py-1 text-xs font-semibold text-[#198754]">
        <Icon name="check" className="h-3.5 w-3.5" />
        Tudo confirmado
      </span>
    );
  } else {
    chip = (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e0f7fc] px-3 py-1 text-xs font-semibold text-[#0aa2c0]">
        <Icon name="play" className="h-3 w-3" />
        Em curso
      </span>
    );
  }

  return (
    <Link href={`/operacoes/${op.id}`} className={`block h-full rounded-xl p-5 transition hover:-translate-y-px hover:shadow-lg active:bg-gray-50 ${borda}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-base font-extrabold leading-tight text-slate-800">{op.navio}</div>
          <div className="text-xs text-slate-500">{op.empresa}</div>
        </div>
        {chip}
      </div>

      <div className="mt-2 text-[11px] text-slate-400">
        BL: <b className="font-semibold text-slate-600">{op.bl || '—'}</b> · Factura:{' '}
        <b className="font-semibold text-slate-600">{op.factura || '—'}</b>
        {op.data_chegada ? ` · ${op.data_chegada}` : ''}
      </div>

      <div className="mt-1 flex flex-wrap">
        {op.items.map((it) => (
          <span key={it.id} className="mr-1 mt-1 inline-block rounded bg-[#eef2ff] px-2 py-0.5 text-[11px] font-semibold text-[#3b4cca]">
            {it.nome}: {fmt(it.plano)} {it.unidade_label}
            {it.unidade === 'saco' ? ` × ${fmt(it.peso_unitario_kg)} kg` : ''}
          </span>
        ))}
      </div>

      <div className="mb-1 mt-3 h-2 overflow-hidden rounded-md bg-[#f1f3f5]">
        <div
          className={`h-full rounded-md ${pct >= 100 ? 'bg-[#198754]' : 'bg-gradient-to-r from-[#1a56db] to-[#0dcaf0]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>
          <b>{fmt(op.recebido_ton, 1)} t</b> de {fmt(op.esperado_ton, 1)} t
        </span>
        <span>
          {pct}% · {op.camioes_count} camiões
        </span>
      </div>
    </Link>
  );
}
