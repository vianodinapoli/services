'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Operation } from '@/lib/types';

type Linha = { id?: number; nome: string; quantidade: string; unidade: 'saco' | 'tonelada'; pesoUnitarioKg: string };
const API = '/api';

export default function OperationForm({ operation }: { operation?: Operation }) {
  const router = useRouter();
  const [f, setF] = useState({
    navio: operation?.navio ?? '', empresa: operation?.empresa ?? '', bl: operation?.bl ?? '', factura: operation?.factura ?? '',
    dataChegada: operation?.dataChegada?.slice(0, 10) ?? '', observacoes: operation?.observacoes ?? '',
    transportadoras: (operation?.transportadoras ?? []).filter((t) => !t.extra).map((t) => t.nome).join(', '),
  });
  const [linhas, setLinhas] = useState<Linha[]>(
    operation?.planItems.map((p) => ({ id: p.id, nome: p.nome, quantidade: String(p.quantidade), unidade: p.unidade, pesoUnitarioKg: String(p.pesoUnitarioKg ?? '') }))
    ?? [{ nome: '', quantidade: '', unidade: 'saco', pesoUnitarioKg: '50' }]
  );
  const [erros, setErros] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v } as typeof f);
  const setL = (i: number, k: keyof Linha, v: string) => setLinhas(linhas.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const inp = 'w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm';
  const lbl = 'mb-1 block text-xs font-semibold text-slate-500';

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErros([]);
    const r = await fetch(operation ? `${API}/operations/${operation.id}` : `${API}/operations`, {
      method: operation ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...f, transportadoras: f.transportadoras.split(',').map((t) => t.trim()).filter(Boolean), planItems: linhas }),
    }).catch(() => null);
    setSaving(false);
    if (!r) return setErros(['Sem ligação ao servidor.']);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErros(j.errors ? (Object.values(j.errors).flat() as string[]) : [j.message ?? `Erro ${r.status}`]);
    router.push(`/operations/${j.id}`); router.refresh();
  }

  async function eliminar() {
    if (!operation || !confirm(`Eliminar a operação "${operation.navio}"?`)) return;
    const r = await fetch(`${API}/operations/${operation.id}`, { method: 'DELETE' });
    if (!r.ok) { const j = await r.json().catch(() => ({})); return setErros([j.message ?? `Erro ${r.status}`]); }
    router.push('/operations'); router.refresh();
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-3xl space-y-4 p-4">
      <Link href={operation ? `/operations/${operation.id}` : '/operations'} className="text-xs text-slate-400">← Voltar</Link>
      <h1 className="text-lg font-bold text-slate-800">{operation ? 'Editar operação' : 'Nova operação'}</h1>
      {erros.length > 0 && <ul className="list-disc rounded-lg bg-red-50 p-3 pl-7 text-sm text-red-700">{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>}

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <div><label className={lbl}>Navio</label><input required className={inp} value={f.navio} onChange={(e) => set('navio', e.target.value)} /></div>
        <div><label className={lbl}>Empresa</label><input required className={inp} value={f.empresa} onChange={(e) => set('empresa', e.target.value)} /></div>
        <div><label className={lbl}>BL</label><input className={inp} value={f.bl} onChange={(e) => set('bl', e.target.value)} /></div>
        <div><label className={lbl}>Factura</label><input className={inp} value={f.factura} onChange={(e) => set('factura', e.target.value)} /></div>
        <div><label className={lbl}>Data de chegada</label><input type="date" className={inp} value={f.dataChegada} onChange={(e) => set('dataChegada', e.target.value)} /></div>
        <div><label className={lbl}>Transportadoras previstas (separadas por vírgula)</label><input className={inp} placeholder="TransMoz, Cargas do Sul" value={f.transportadoras} onChange={(e) => set('transportadoras', e.target.value)} /></div>
        <div className="md:col-span-2"><label className={lbl}>Observações</label><textarea rows={2} className={inp} value={f.observacoes} onChange={(e) => set('observacoes', e.target.value)} /></div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">Plano de produtos</h2>
          <button type="button" onClick={() => setLinhas([...linhas, { nome: '', quantidade: '', unidade: 'saco', pesoUnitarioKg: '50' }])} className="text-xs font-bold text-blue-600">+ Produto</button>
        </div>
        <div className="space-y-2">
          {linhas.map((l, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-4"><label className={lbl}>Nome</label><input className={inp} value={l.nome} onChange={(e) => setL(i, 'nome', e.target.value)} placeholder="Nitrato 50kg" /></div>
              <div className="col-span-3"><label className={lbl}>Quantidade</label><input type="number" min="0" step="any" className={inp} value={l.quantidade} onChange={(e) => setL(i, 'quantidade', e.target.value)} /></div>
              <div className="col-span-2"><label className={lbl}>Unidade</label>
                <select className={inp} value={l.unidade} onChange={(e) => setL(i, 'unidade', e.target.value)}><option value="saco">Sacos</option><option value="tonelada">Toneladas</option></select></div>
              <div className="col-span-2"><label className={lbl}>kg/saco</label><input type="number" min="0" step="any" disabled={l.unidade !== 'saco'} className={inp + ' disabled:bg-slate-100'} value={l.pesoUnitarioKg} onChange={(e) => setL(i, 'pesoUnitarioKg', e.target.value)} /></div>
              <div className="col-span-1"><button type="button" disabled={linhas.length === 1} onClick={() => setLinhas(linhas.filter((_, j) => j !== i))} className="rounded border px-2 py-1.5 text-xs text-red-600 disabled:opacity-30" title="Remover">✕</button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        {operation ? <button type="button" onClick={eliminar} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600">Eliminar operação</button> : <span />}
        <button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? 'A guardar...' : 'Guardar'}</button>
      </div>
    </form>
  );
}
