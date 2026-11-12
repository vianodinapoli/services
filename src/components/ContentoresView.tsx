'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import type { Contentor, ContentoresData } from '@/lib/types';
import { fmt1, fmtData } from '@/lib/logic';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';
const CORES = ['#1e293b', '#c60a1a', '#187fc4', '#7ed953', '#f59e0b', '#8b3ecf', '#342cc9', '#707070'];
const BADGE: Record<string, string> = {
  no_parque: 'bg-blue-50 text-blue-700', em_transito: 'bg-amber-50 text-amber-700', descarregado: 'bg-cyan-50 text-cyan-700',
  carregado: 'bg-green-50 text-green-700', vazio: 'bg-slate-100 text-slate-600', saiu: 'bg-slate-200 text-slate-700',
};
const CAMPOS = ['numero', 'tipo', 'estado', 'armador', 'cliente', 'navio', 'bl', 'selo', 'pesoKg', 'localizacao', 'dataEntrada', 'dataSaida', 'observacoes'] as const;
type Form = Record<(typeof CAMPOS)[number], string>;
const PAGE = 10;

const vazio = (tipo: string): Form => ({
  numero: '', tipo, estado: 'no_parque', armador: '', cliente: '', navio: '', bl: '', selo: '', pesoKg: '',
  localizacao: '', dataEntrada: new Date().toISOString().slice(0, 10), dataSaida: '', observacoes: '',
});
const doContentor = (c: Contentor): Form =>
  Object.fromEntries(CAMPOS.map((k) => [k, (c[k] as any) == null ? '' : String(c[k]).slice(0, k.startsWith('data') ? 10 : undefined)])) as Form;

export default function ContentoresView({ data }: { data: ContentoresData }) {
  const router = useRouter();
  const { kpis, contentores, estados, tipos } = data;
  const [filtro, setFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<{ id: number | null; form: Form } | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return contentores
      .filter((c) => !filtro || c.estado === filtro)
      .filter((c) => !q || [c.numero, c.cliente, c.navio, c.bl, c.selo, c.localizacao].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => (b.dataEntrada ?? '').localeCompare(a.dataEntrada ?? ''));
  }, [contentores, filtro, busca]);
  const paginas = Math.max(1, Math.ceil(lista.length / PAGE));
  const visiveis = lista.slice(page * PAGE, page * PAGE + PAGE);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setSaving(true); setErros([]);
    const body: Record<string, unknown> = Object.fromEntries(Object.entries(modal.form).map(([k, v]) => [k, v === '' ? null : v]));
    body.numero = (modal.form.numero || '').toUpperCase();
    const r = await fetch(modal.id ? `${API}/contentores/${modal.id}` : `${API}/contentores`, {
      method: modal.id ? 'PUT' : 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body),
    }).catch(() => null);
    setSaving(false);
    if (!r) return setErros(['Sem ligação ao servidor. Tente novamente.']);
    if (r.status === 422) { const j = await r.json(); return setErros(j.errors ? (Object.values(j.errors).flat() as string[]) : [j.message]); }
    if (!r.ok) return setErros([`Erro ${r.status}`]);
    setModal(null); router.refresh();
  }

  async function apagar(c: Contentor) {
    if (!confirm(`Apagar o contentor ${c.numero}?`)) return;
    await fetch(`${API}/contentores/${c.id}`, { method: 'DELETE', credentials: 'include' });
    router.refresh();
  }

  const set = (k: keyof Form, v: string) => setModal((m) => m && { ...m, form: { ...m.form, [k]: v } });
  const inp = 'w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-slate-800 focus:outline-none';
  const lbl = 'mb-1 text-xs font-semibold text-slate-600';
  const card = 'rounded-2xl border border-slate-200 bg-white p-4';
  const eixo = { fontSize: 10, fill: '#94a3b8' };

  const kpi = [
    ['No parque', kpis.noParque, `${kpis.total} registados · ${fmt1(kpis.peso)} t`, '#2563eb'],
    ['Em trânsito', kpis.emTransito, '', '#d97706'],
    ['Carregados', kpis.carregados, `${kpis.saiu} já saíram`, '#16a34a'],
    ['Parados há demasiado tempo', kpis.atrasados, `mais de ${kpis.limite} dias no parque`, '#dc2626'],
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Contentores</h1>
          <p className="text-xs text-slate-400">Gestão do parque: o que está no recinto, em trânsito e há quantos dias</p>
        </div>
        <button onClick={() => { setErros([]); setModal({ id: null, form: vazio(tipos[0] ?? '20GP') }); }}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">+ Novo contentor</button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpi.map(([l, v, s, c]) => (
          <div key={l as string} className={`${card} border-l-4`} style={{ borderLeftColor: c as string }}>
            <div className="text-xs text-slate-400">{l}</div>
            <div className="text-3xl font-extrabold text-slate-800">{v}</div>
            {s && <div className="text-[11px] text-slate-400">{s}</div>}
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className={`${card} lg:col-span-2`}>
          <div className="text-sm font-bold text-slate-700">Entradas por mês</div>
          <div className="mb-2 text-xs text-slate-400">Últimos 12 meses</div>
          <div className="h-[280px]">
            <ResponsiveContainer>
              <LineChart data={data.meses.map((m, i) => ({ m, v: data.entradasMensais[i] }))}>
                <CartesianGrid stroke="#f1f5f9" /><XAxis dataKey="m" tick={eixo} /><YAxis tick={eixo} allowDecimals={false} /><Tooltip />
                <Line type="monotone" dataKey="v" name="Entradas" stroke="#1e293b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={card}>
          <div className="text-sm font-bold text-slate-700">Contentores por estado</div>
          <div className="mb-2 text-xs text-slate-400">Todos os registos</div>
          <div className="h-[280px]">
            {data.porEstado.length === 0 ? <p className="pt-24 text-center text-sm text-slate-400">Sem contentores registados</p> : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.porEstado} dataKey="total" nameKey="nome" innerRadius="68%" outerRadius="90%" stroke="none">
                    {data.porEstado.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                  <Tooltip /><Legend iconSize={9} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="text-sm font-bold text-slate-700">Clientes com mais contentores no parque</div>
        <div className="mb-2 text-xs text-slate-400">Top 8</div>
        <div className="h-[240px]">
          {data.topClientes.length === 0 ? <p className="pt-20 text-center text-sm text-slate-400">Sem contentores com cliente no parque</p> : (
            <ResponsiveContainer>
              <BarChart data={data.topClientes}>
                <CartesianGrid stroke="#f1f5f9" /><XAxis dataKey="nome" tick={eixo} /><YAxis tick={eixo} allowDecimals={false} /><Tooltip />
                <Bar dataKey="total" name="Contentores no parque" fill="#1e293b" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className={`${card} p-0`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4">
          <div>
            <div className="text-sm font-bold text-slate-700">Lista de contentores</div>
            <div className="text-xs text-slate-400">{kpis.total} registados</div>
          </div>
          <div className="flex gap-2">
            <input placeholder="Pesquisar..." value={busca} onChange={(e) => { setBusca(e.target.value); setPage(0); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
            <select value={filtro} onChange={(e) => { setFiltro(e.target.value); setPage(0); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
              <option value="">Todos os estados</option>
              {Object.entries(estados).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] font-bold uppercase text-slate-400">
              {['Número', 'Tipo', 'Estado', 'Cliente', 'Navio', 'BL / Selo', 'Localização', 'Entrada', 'Dias no parque', ''].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}
            </tr></thead>
            <tbody>
              {visiveis.map((c) => {
                const ativo = !['em_transito', 'saiu'].includes(c.estado);
                const d = c.diasNoParque;
                return (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono font-semibold text-slate-800">{c.numero}</td>
                    <td className="px-3 py-2">{c.tipo}</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${BADGE[c.estado] ?? ''}`}>{estados[c.estado] ?? c.estado}</span></td>
                    <td className="px-3 py-2">{c.cliente || '—'}</td>
                    <td className="px-3 py-2">{c.navio || '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{c.bl || c.selo ? [c.bl, c.selo].filter(Boolean).join(' ') : '—'}</td>
                    <td className="px-3 py-2">{c.localizacao || '—'}</td>
                    <td className="px-3 py-2 text-right">{c.dataEntrada ? fmtData(c.dataEntrada.slice(0, 10)) : '—'}</td>
                    <td className="px-3 py-2">
                      {d === null ? '—' : (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded bg-slate-100">
                            <div className={`h-full ${ativo && d > kpis.limite ? 'bg-red-500' : 'bg-slate-700'}`} style={{ width: `${Math.min(100, Math.round((d / 14) * 100))}%` }} />
                          </div>
                          <span className="w-10 text-xs text-slate-500">{d} d</span>
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <button title="Editar" onClick={() => { setErros([]); setModal({ id: c.id, form: doContentor(c) }); }} className="mr-1 rounded-md border px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">✎</button>
                      <button title="Apagar" onClick={() => apagar(c)} className="rounded-md border px-2 py-1 text-xs text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600">🗑</button>
                    </td>
                  </tr>
                );
              })}
              {visiveis.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-slate-400">Nenhum contentor encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-400">
          <span>{lista.length} registos</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded border px-2 py-0.5 disabled:opacity-40">Anterior</button>
            <span>{page + 1} / {paginas}</span>
            <button disabled={page >= paginas - 1} onClick={() => setPage(page + 1)} className="rounded border px-2 py-0.5 disabled:opacity-40">Seguinte</button>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={guardar} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <div className="text-sm font-bold text-slate-700">{modal.id ? 'Editar contentor' : 'Novo contentor'}</div>
                <div className="text-xs text-slate-400">Número segundo a norma ISO 6346 (4 letras + 7 dígitos)</div>
              </div>
              <button type="button" onClick={() => setModal(null)} aria-label="Fechar">✕</button>
            </div>

            <div className="space-y-4 p-5">
              {erros.length > 0 && <ul className="list-disc rounded-lg bg-red-50 p-3 pl-7 text-sm text-red-700">{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>}

              <fieldset className="grid gap-3 md:grid-cols-3">
                <legend className="mb-2 text-xs font-bold text-slate-400">Identificação</legend>
                <div><div className={lbl}>Número (ISO 6346)</div><input required maxLength={13} className={inp + ' uppercase'} placeholder="MSKU1234565" value={modal.form.numero} onChange={(e) => set('numero', e.target.value)} /></div>
                <div><div className={lbl}>Tipo</div><select className={inp} value={modal.form.tipo} onChange={(e) => set('tipo', e.target.value)}>{tipos.map((t) => <option key={t}>{t}</option>)}</select></div>
                <div><div className={lbl}>Estado</div><select className={inp} value={modal.form.estado} onChange={(e) => set('estado', e.target.value)}>{Object.entries(estados).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
              </fieldset>

              <fieldset className="grid gap-3 md:grid-cols-3">
                <legend className="mb-2 text-xs font-bold text-slate-400">Origem e documentos</legend>
                {([['armador', 'Armador'], ['cliente', 'Cliente'], ['navio', 'Navio'], ['bl', 'BL'], ['selo', 'Selo']] as const).map(([k, l]) => (
                  <div key={k}><div className={lbl}>{l}</div><input className={inp} value={modal.form[k]} onChange={(e) => set(k, e.target.value)} /></div>
                ))}
                <div><div className={lbl}>Peso (kg)</div><input type="number" step="0.01" className={inp} value={modal.form.pesoKg} onChange={(e) => set('pesoKg', e.target.value)} /></div>
              </fieldset>

              <fieldset className="grid gap-3 md:grid-cols-3">
                <legend className="mb-2 text-xs font-bold text-slate-400">Parque</legend>
                <div><div className={lbl}>Localização no parque</div><input className={inp} placeholder="Ex.: Bloco A · Fila 3" value={modal.form.localizacao} onChange={(e) => set('localizacao', e.target.value)} /></div>
                <div><div className={lbl}>Data de entrada</div><input type="date" className={inp} value={modal.form.dataEntrada} onChange={(e) => set('dataEntrada', e.target.value)} /></div>
                <div><div className={lbl}>Data de saída</div><input type="date" className={inp} value={modal.form.dataSaida} onChange={(e) => set('dataSaida', e.target.value)} /></div>
                <div className="md:col-span-3"><div className={lbl}>Observações</div><textarea rows={3} className={inp} value={modal.form.observacoes} onChange={(e) => set('observacoes', e.target.value)} /></div>
              </fieldset>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border px-4 py-1.5 text-sm text-slate-600">Cancelar</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'A guardar...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
