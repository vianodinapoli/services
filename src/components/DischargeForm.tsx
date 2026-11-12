'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Discharge, Operation } from '@/lib/types';

const API = '/api';

export default function DischargeForm({ operation, discharge }: { operation: Operation; discharge?: Discharge }) {
  const router = useRouter();
  const [f, setF] = useState({
    data: discharge?.data ?? '', numeroGuia: discharge?.numeroGuia ?? '', motorista: discharge?.motorista ?? '',
    matricula: discharge?.matricula ?? '', transportadora: discharge?.transportadora ?? '',
    tipoAtrelado: discharge?.tipoAtrelado ?? '', assinado: discharge?.assinado ?? false,
    horaSaidaPorto: (discharge?.horaSaidaPorto ?? '').slice(0, 5), observacoes: discharge?.observacoes ?? '',
  });
  const [qtd, setQtd] = useState<Record<number, string>>(
    Object.fromEntries(operation.planItems.map((p) => [p.id, String(discharge?.items.find((i) => i.operationItemId === p.id)?.quantidade ?? '')]))
  );
  const [erros, setErros] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof f, v: string | boolean) => setF({ ...f, [k]: v } as typeof f);
  const inp = 'w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm';
  const lbl = 'mb-1 block text-xs font-semibold text-slate-500';

  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErros([]);
    const data = f.data || new Date().toLocaleDateString('sv-SE');
    const r = await fetch(discharge ? `${API}/discharges/${discharge.id}` : `${API}/discharges`, {
      method: discharge ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...f, data, operationId: operation.id, tipoAtrelado: f.tipoAtrelado || null, horaSaidaPorto: f.horaSaidaPorto || null,
        items: operation.planItems.filter((p) => Number(qtd[p.id]) > 0).map((p) => ({ operationItemId: p.id, quantidade: Number(qtd[p.id]) })),
      }),
    }).catch(() => null);
    setSaving(false);
    if (!r) return setErros(['Sem ligação ao servidor.']);
    if (!r.ok) { const j = await r.json().catch(() => ({})); return setErros(j.errors ? (Object.values(j.errors).flat() as string[]) : [j.message ?? `Erro ${r.status}`]); }
    router.push(`/operations/${operation.id}`); router.refresh();
  }

  async function eliminar() {
    if (!discharge || !confirm(`Eliminar a descarga #${discharge.id}?`)) return;
    await fetch(`${API}/discharges/${discharge.id}`, { method: 'DELETE' });
    router.push(`/operations/${operation.id}`); router.refresh();
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-3xl space-y-4 p-4">
      <Link href={`/operations/${operation.id}`} className="text-xs text-slate-400">← {operation.navio}</Link>
      <h1 className="text-lg font-bold text-slate-800">{discharge ? `Editar descarga #${discharge.id}` : 'Nova descarga'}</h1>
      {erros.length > 0 && <ul className="list-disc rounded-lg bg-red-50 p-3 pl-7 text-sm text-red-700">{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>}

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <div><label className={lbl}>Data</label><input type="date" suppressHydrationWarning className={inp} value={f.data} onChange={(e) => set('data', e.target.value)} /></div>
        <div><label className={lbl}>Nº da guia (vazio = automático)</label><input className={inp} value={f.numeroGuia} onChange={(e) => set('numeroGuia', e.target.value)} /></div>
        <div><label className={lbl}>Saída do porto</label><input type="time" className={inp} value={f.horaSaidaPorto} onChange={(e) => set('horaSaidaPorto', e.target.value)} /></div>
        <div><label className={lbl}>Motorista</label><input required className={inp} value={f.motorista} onChange={(e) => set('motorista', e.target.value)} /></div>
        <div><label className={lbl}>Matrícula</label><input required className={inp + ' uppercase'} value={f.matricula} onChange={(e) => set('matricula', e.target.value)} /></div>
        <div><label className={lbl}>Transportadora</label>
          <input required list="transportadoras" className={inp} value={f.transportadora} onChange={(e) => set('transportadora', e.target.value)} />
          <datalist id="transportadoras">{operation.transportadoras.map((t) => <option key={t.nome} value={t.nome} />)}</datalist></div>
        <div><label className={lbl}>Atrelado</label>
          <select className={inp} value={f.tipoAtrelado} onChange={(e) => set('tipoAtrelado', e.target.value)}>
            <option value="">Não definido</option><option value="normal">Normal (até 24 t)</option><option value="link">Link (mais de 24 t)</option></select></div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={f.assinado} onChange={(e) => set('assinado', e.target.checked)} />Assinado pelo motorista</label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-bold text-slate-700">Carga (deixe vazio o que não vai neste camião)</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {operation.planItems.map((p) => (
            <div key={p.id}>
              <label className={lbl}>{p.nome} ({p.unidade === 'saco' ? 'sacos' : 'toneladas'})</label>
              <input type="number" min="0" step={p.unidade === 'saco' ? 1 : 'any'} className={inp} value={qtd[p.id]} onChange={(e) => setQtd({ ...qtd, [p.id]: e.target.value })} />
            </div>
          ))}
        </div>
      </div>

      <div><label className={lbl}>Observações</label><textarea rows={2} className={inp} value={f.observacoes} onChange={(e) => set('observacoes', e.target.value)} /></div>

      <div className="flex justify-between">
        {discharge ? <button type="button" onClick={eliminar} className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600">Eliminar descarga</button> : <span />}
        <button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? 'A guardar...' : 'Guardar'}</button>
      </div>
    </form>
  );
}
