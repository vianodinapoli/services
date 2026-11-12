'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Discharge, Operation } from '@/lib/types';
import {
  PALETTE, EMPTY_FILTERS, Filters, applyFilters, fmt, fmt0, fmt1, fmtData,
  labelBalanca, slaMinutos, slaNivel, desdeSaida,
} from '@/lib/logic';
import WeighModal from './WeighModal';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';
const PAGE = 15;

const badge: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  in_transit: 'bg-cyan-100 text-cyan-700',
  weighing: 'bg-amber-100 text-amber-700',
  pending: 'bg-amber-100 text-amber-700',
};
const rowSla = { '': '', ok: '', warn: 'bg-amber-50 border-l-4 border-amber-500', danger: 'bg-red-50 border-l-4 border-red-600' };
const dotSla = { '': '', ok: 'bg-cyan-400', warn: 'bg-amber-500', danger: 'bg-red-600 animate-pulse' };

export default function OperationView({ operation: op, discharges }: { operation: Operation; discharges: Discharge[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filtros, setFiltros] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [weigh, setWeigh] = useState<Discharge | null>(null);

  // contador ao vivo (20 s), como o setInterval(atualizarSla) do Blade
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 20000); return () => clearInterval(t); }, []);

  const cor = useMemo(() => Object.fromEntries(op.planItems.map((p, i) => [p.id, PALETTE[i % PALETTE.length]])), [op.planItems]);
  const transportadoras = useMemo(() => [...new Set(discharges.map((d) => d.transportadora))].sort(), [discharges]);
  const lista = useMemo(() => applyFilters(discharges, filtros).sort((a, b) => b.id - a.id), [discharges, filtros]);
  const paginas = Math.max(1, Math.ceil(lista.length / PAGE));
  const visiveis = lista.slice(page * PAGE, page * PAGE + PAGE);

  const count = (s: string) => discharges.filter((d) => d.status === s).length;
  const pesoLiqT = discharges.reduce((s, d) => s + (d.pesoLiquido ?? 0), 0) / 1000;

  const aplicar = () => { setFiltros(draft); setPage(0); };
  const limpar = () => { setDraft(EMPTY_FILTERS); setFiltros(EMPTY_FILTERS); setPage(0); };
  const remover = (k: keyof Filters) => { const n = { ...filtros, [k]: '' }; setDraft(n); setFiltros(n); setPage(0); };

  const apagar = async (d: Discharge) => {
    if (!confirm(`Eliminar a descarga #${d.id}?`)) return;
    await fetch(`${API}/discharges/${d.id}`, { method: 'DELETE' });
    router.refresh();
  };

  const nomes = { de: 'De', ate: 'Até', tr: 'Transportadora', st: 'Estado', tc: 'Carga', dv: 'Divergência', at: 'Atrelado' };
  const tags = (Object.entries(filtros) as [keyof Filters, string][])
    .filter(([, v]) => v).map(([k, v]) => [k, `${nomes[k]}: ${v === 'nd' ? 'não definido' : v}`] as const);

  const card = 'rounded-xl border border-slate-200 bg-white';
  const sel = 'rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-sm';
  const lbl = 'text-[10px] font-semibold uppercase tracking-wide text-slate-400';

  return (
    <div className="space-y-4 p-4">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href={op.archived ? '/operations?arquivo=1' : '/operations'} className="text-xs text-slate-400">← {op.archived ? 'Arquivo' : 'Operações'}</Link>
          <h1 className="mt-1 text-lg font-bold text-slate-800">
            {op.navio}
            <span className={`ml-2 rounded px-2 py-0.5 align-middle text-[10px] ${op.archived ? 'bg-slate-500 text-white' : 'bg-cyan-100 text-cyan-700'}`}>
              {op.archived ? 'ARQUIVADA' : 'EM CURSO'}
            </span>
          </h1>
          <p className="text-xs text-slate-400">{op.empresa} — Nitrato de Amónio</p>
        </div>
        <div className="flex gap-2 text-xs font-bold">
          {!op.archived ? (
            <>
              <Link href={`/operations/${op.id}/edit`} className="rounded-lg border border-blue-600 px-3 py-1.5 text-blue-600">Editar operação</Link>
              <button onClick={async () => { if (confirm('Enviar esta operação para o arquivo?')) { await fetch(`${API}/operations/${op.id}/archive`, { method: 'PATCH', credentials: 'include' }); router.refresh(); } }}
                      className="rounded-lg border border-slate-800 px-3 py-1.5">Arquivar</button>
              <Link href={`/discharges/new?operation_id=${op.id}`} className="rounded-lg bg-blue-600 px-3 py-1.5 text-white">+ Nova descarga</Link>
            </>
          ) : (
            <button onClick={async () => { if (confirm('Reactivar esta operação?')) { await fetch(`${API}/operations/${op.id}/restore`, { method: 'PATCH', credentials: 'include' }); router.refresh(); } }}
                    className="rounded-lg border border-amber-500 px-3 py-1.5 text-amber-600">Reactivar</button>
          )}
        </div>
      </div>

      {/* CABEÇALHO DA OPERAÇÃO + PLANO */}
      <div className={`${card} p-4`}>
        <div className="text-xs text-slate-400">
          BL: <b className="text-slate-600">{op.bl || '—'}</b> · Factura: <b className="text-slate-600">{op.factura || '—'}</b> · Empresa: <b className="text-slate-600">{op.empresa}</b>
          {op.dataChegada && <> · Chegada: <b className="text-slate-600">{fmtData(op.dataChegada.slice(0, 10))}</b></>}
          {op.archived && op.archivedAt && <> · Arquivada em: <b className="text-slate-600">{fmtData(op.archivedAt.slice(0, 10))}</b></>}
        </div>

        {Object.entries(op.metadata).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(op.metadata).map(([k, v]) => <span key={k} className="rounded bg-slate-100 px-2 text-[10px] text-slate-600"><b>{k}:</b> {v}</span>)}
          </div>
        )}
        {op.transportadoras.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="mr-1 text-[10px] font-bold text-slate-400">Transportadoras</span>
            {op.transportadoras.map((t) => (
              <span key={t.nome} title={t.extra ? 'Fora da lista prevista (acrescentada ao lançar um camião)' : undefined}
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${t.extra ? 'border-orange-500 bg-orange-500 text-white' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
                {t.extra && '⚠ '}{t.nome}
              </span>
            ))}
          </div>
        )}
        {op.observacoes && <p className="mt-1 text-xs text-slate-500">{op.observacoes}</p>}

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-[10px] uppercase text-slate-400">
              <th className="p-1.5">Produto</th><th className="p-1.5 text-right">Plano</th><th className="p-1.5 text-right">No porto</th>
              <th className="p-1.5 text-right">Confirmado</th><th className="p-1.5 text-right">Falta lançar</th><th className="w-36 p-1.5">Lançado</th>
            </tr></thead>
            <tbody>
              {op.planItems.map((pi) => {
                const sal = Math.round((pi.quantidade - pi.registado) * 1000) / 1000;
                const pp = pi.quantidade > 0 ? Math.min(100, Math.round((pi.registado / pi.quantidade) * 100)) : 0;
                return (
                  <tr key={pi.id} className="border-b border-slate-100">
                    <td className="p-1.5 font-bold">
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: cor[pi.id].tx }} />{pi.nome}
                      <span className="ml-1 text-[11px] font-normal text-slate-400">{pi.unidade === 'saco' ? `· ${fmt(pi.pesoUnitarioKg)} kg/saco` : '· granel'}</span>
                    </td>
                    <td className="p-1.5 text-right">{fmt(pi.quantidade)} {pi.unidade === 'saco' ? 'sacos' : 't'}</td>
                    <td className="p-1.5 text-right">{fmt(pi.registado)}</td>
                    <td className="p-1.5 text-right text-green-700">{fmt(pi.confirmado)}</td>
                    <td className="p-1.5 text-right font-bold" style={{ color: sal > 0 ? '#dc3545' : '#198754' }}>{fmt(sal)}</td>
                    <td className="p-1.5"><div className="h-1.5 overflow-hidden rounded bg-slate-100"><div className="h-full" style={{ width: `${pp}%`, background: cor[pi.id].tx }} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 h-2.5 overflow-hidden rounded-md bg-slate-100">
          <div className={`h-full ${op.progresso >= 100 ? 'bg-green-600' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`} style={{ width: `${Math.min(100, op.progresso)}%` }} />
        </div>
        <div className="mt-1 flex flex-wrap justify-between gap-1 text-[11px] text-slate-500">
          <span><b>{fmt1(op.recebidoTon)} t</b> pesadas na balança de {fmt1(op.quantidadeEsperada)} t esperadas ({op.progresso}%)</span>
          <span style={{ color: op.faltaTon > 0 ? '#dc3545' : '#198754' }}>
            {op.faltaTon > 0 ? `Faltam ${fmt1(op.faltaTon)} t` : op.faltaTon < 0 ? `Excesso de ${fmt1(Math.abs(op.faltaTon))} t` : 'Quantidade completa'}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="flex flex-wrap gap-2">
        {[
          ['Em trânsito', count('in_transit'), 'camiões', '#0dcaf0'],
          ['A pesar', count('weighing'), 'falta 1 peso', '#d39e00'],
          ['Confirmados', count('confirmed'), 'na balança', '#198754'],
          ['Total', discharges.length, 'registos', '#6f42c1'],
          ['Peso líq.', `${fmt1(pesoLiqT)}t`, 'confirmado', '#fd7e14'],
        ].map(([l, v, s, c]) => (
          <div key={l as string} className={`${card} min-w-[110px] flex-1 border-l-[3px] px-3 py-2`} style={{ borderLeftColor: c as string }}>
            <div className="text-[10px] font-bold uppercase text-slate-400">{l}</div>
            <div className="text-2xl font-extrabold" style={{ color: c as string }}>{v}</div>
            <div className="text-[11px] text-slate-400">{s}</div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className={`${card} p-4`}>
        <div className="flex flex-wrap items-end gap-2">
          <div><div className={lbl}>De</div><input type="date" className={sel} value={draft.de} onChange={(e) => setDraft({ ...draft, de: e.target.value })} /></div>
          <div><div className={lbl}>Até</div><input type="date" className={sel} value={draft.ate} onChange={(e) => setDraft({ ...draft, ate: e.target.value })} /></div>
          <div><div className={lbl}>Transportadora</div>
            <select className={sel} value={draft.tr} onChange={(e) => setDraft({ ...draft, tr: e.target.value })}>
              <option value="">Todas</option>{transportadoras.map((t) => <option key={t}>{t}</option>)}
            </select></div>
          <div><div className={lbl}>Estado</div>
            <select className={sel} value={draft.st} onChange={(e) => setDraft({ ...draft, st: e.target.value as Filters['st'] })}>
              <option value="">Todos</option><option value="in_transit">Em trânsito</option><option value="weighing">A pesar</option>
              <option value="confirmed">Confirmado</option><option value="pending">Pendente</option>
            </select></div>
          <div><div className={lbl}>Carga</div>
            <select className={sel} value={draft.tc} onChange={(e) => setDraft({ ...draft, tc: e.target.value })}>
              <option value="">Todos</option>
              {op.planItems.map((p) => <option key={p.id} value={p.nome.toLowerCase()}>Só {p.nome}</option>)}
              <option value="misto">Misto</option>
            </select></div>
          <div><div className={lbl}>Divergência</div>
            <select className={sel} value={draft.dv} onChange={(e) => setDraft({ ...draft, dv: e.target.value as Filters['dv'] })}>
              <option value="">Todos</option><option value="sim">Com divergência</option><option value="nao">Sem divergência</option>
            </select></div>
          <div><div className={lbl}>Atrelado</div>
            <select className={sel} value={draft.at} onChange={(e) => setDraft({ ...draft, at: e.target.value as Filters['at'] })}>
              <option value="">Todos</option><option value="normal">Normal (até 24)</option><option value="link">Link (mais de 24)</option><option value="nd">Não definido</option>
            </select></div>
          <button onClick={aplicar} className="rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white">Filtrar</button>
          <button onClick={limpar} className="rounded-md border bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600">Limpar</button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map(([k, t]) => (
              <span key={k} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                {t} <button onClick={() => remover(k)} className="opacity-60 hover:opacity-100">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* TABELA */}
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {['# / Data', 'Guia', 'Motorista', 'Transportadora', 'Carga', 'Peso', 'Tempo', 'Estado', 'Ações'].map((h) => <th key={h} className="px-2.5 py-2">{h}</th>)}
          </tr></thead>
          <tbody>
            {visiveis.map((d) => {
              const min = slaMinutos(d, now);
              const nivel = slaNivel(min);
              const desde = desdeSaida(d);
              const fora = op.transportadorasExtra.includes(d.transportadora.toLowerCase());
              const ativo = !op.archived && ['pending', 'in_transit', 'weighing'].includes(d.status);
              return (
                <tr key={d.id} className={`border-b border-slate-100 hover:bg-slate-50 ${rowSla[nivel]}`}>
                  <td className="px-2.5 py-1.5"><b className="text-xs text-slate-500">#{d.id}</b><div className="text-[11px] text-slate-400">{fmtData(d.data)}</div></td>
                  <td className="px-2.5 py-1.5 text-xs font-bold text-blue-700">{d.numeroGuia}</td>
                  <td className="px-2.5 py-1.5">
                    <div className="font-semibold text-slate-800">{d.motorista}</div>
                    <span className="rounded bg-slate-800 px-1.5 text-[10px] font-semibold tracking-wider text-white">{d.matricula}</span>
                    {d.assinado && <span title="Assinado pelo motorista" className="ml-1 text-[10px] text-green-700">✎</span>}
                    {d.tipoAtrelado && (
                      <span title={d.atreladoInconsistente ? 'Não bate com o nº de sacos' : `Atrelado ${d.tipoAtrelado}`}
                            className={`ml-1 rounded px-1.5 text-[9px] font-bold ${d.tipoAtrelado === 'link' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
                        {d.tipoAtrelado.toUpperCase()}{d.atreladoInconsistente && ' ⚠'}
                      </span>
                    )}
                  </td>
                  <td className="px-2.5 py-1.5 text-xs text-slate-500">
                    {d.transportadora}
                    {fora && <div><span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white" title="Transportadora fora da lista prevista da operação">⚠ Fora da lista</span></div>}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="flex flex-wrap items-center gap-1">
                      {d.items.map((it) => {
                        const c = cor[it.operationItemId] ?? PALETTE[0];
                        return (
                          <span key={it.operationItemId} title={it.nome} className="inline-flex items-center gap-1 rounded border px-1.5 text-[11px] font-bold"
                                style={{ background: c.bg, color: c.tx, borderColor: c.bd }}>
                            <span className="text-[9px] uppercase opacity-75">{it.nome.slice(0, 3)}</span>{fmt(it.quantidade)}
                          </span>
                        );
                      })}
                      {d.totalSacos > 0 && <span className="rounded bg-slate-100 px-1 text-[10px] text-slate-400">{d.totalSacos}</span>}
                      {d.hasDivergence && <span className="rounded border border-amber-400 bg-amber-100 px-1 text-[10px] font-semibold text-amber-800">⚠ {d.sacosConfirmados}</span>}
                    </div>
                  </td>
                  <td className="px-2.5 py-1.5 text-center">
                    <div className="text-xs font-bold">{fmt0(d.pesoTotalEstimado)} kg</div>
                    {d.status === 'weighing'
                      ? <div className="text-[11px] text-amber-700">{d.pesoBruto !== null ? `Cheio: ${fmt0(d.pesoBruto)}` : `Vazio: ${fmt0(d.tara ?? 0)}`}</div>
                      : d.pesoLiquido ? <div className="text-[11px] text-green-700">Líq: {fmt0(d.pesoLiquido)}</div> : null}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-1.5 text-center text-xs text-slate-500">
                    {desde ? (
                      <span title={`Saiu do porto às ${d.horaSaidaPorto!.slice(0, 5)} · amarelo aos 80 min, vermelho aos 120 min`}
                            className={nivel === 'warn' ? 'font-bold text-amber-700' : nivel === 'danger' ? 'font-bold text-red-700' : ''}>
                        <span className={`mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle ${dotSla[nivel]}`} />{min}m
                      </span>
                    ) : d.tempoTransporte ? `🕒 ${d.tempoTransporte}m` : '—'}
                  </td>
                  <td className="px-2.5 py-1.5 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge[d.status]}`}>{d.statusLabel}</span>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="flex items-center justify-center gap-1">
                      {ativo && (
                        <button onClick={() => setWeigh(d)}
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${d.status === 'weighing' ? 'bg-orange-500' : 'bg-green-600'}`}>
                          {labelBalanca(d)}
                        </button>
                      )}
                      {['weighing', 'confirmed'].includes(d.status) && (
                        <a href={`/discharges/${d.id}/ticket`} target="_blank" title={d.status === 'confirmed' ? 'Ticket' : 'Ticket provisório'}
                           className="rounded border px-2 text-xs">🧾</a>
                      )}
                      <Link href={`/discharges/${d.id}`} title="Ver" className="rounded border px-2 text-xs text-blue-600">👁</Link>
                      {!op.archived && (<>
                        <Link href={`/discharges/${d.id}/edit`} title="Editar" className="rounded border px-2 text-xs text-amber-600">✎</Link>
                        <button onClick={() => apagar(d)} title="Eliminar" className="rounded border px-2 text-xs text-red-600">🗑</button>
                      </>)}
                    </div>
                  </td>
                </tr>
              );
            })}
            {visiveis.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-slate-400">Sem descargas para mostrar.</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-400">
          <span>{lista.length} registos</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded border px-2 py-0.5 disabled:opacity-40">Anterior</button>
            <span>{page + 1} / {paginas}</span>
            <button disabled={page >= paginas - 1} onClick={() => setPage(page + 1)} className="rounded border px-2 py-0.5 disabled:opacity-40">Seguinte</button>
          </div>
        </div>
      </div>

      {weigh && <WeighModal d={weigh} onClose={() => setWeigh(null)} onSaved={() => { setWeigh(null); router.refresh(); }} />}
    </div>
  );
}
