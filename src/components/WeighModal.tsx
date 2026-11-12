'use client';
import { useMemo, useState } from 'react';
import { Discharge } from '@/lib/types';
import { Balanca } from '@/lib/balanca';
import { passosPesagem, tempoTransporte, validarPesos } from '@/lib/logic';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export default function WeighModal({ d, onClose, onSaved }: { d: Discharge; onClose: () => void; onSaved: () => void }) {
  const [bruto, setBruto] = useState(d.pesoBruto?.toString() ?? '');
  const [tara, setTara] = useState(d.tara?.toString() ?? '');
  const [hora, setHora] = useState((d.horaChegadaBalanca ?? '').slice(0, 5));
  const [obs, setObs] = useState(d.observacoes ?? '');
  const [conf, setConf] = useState<Record<number, string>>(
    Object.fromEntries(d.items.map((i) => [i.operationItemId, String(i.quantidadeConfirmada ?? i.quantidade)]))
  );
  const [baud, setBaud] = useState(9600);
  const [parity, setParity] = useState<'none' | 'even' | 'odd'>('none');
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null);
  const [lendo, setLendo] = useState<'bruto' | 'tara' | null>(null);
  const [saving, setSaving] = useState(false);

  const p = passosPesagem(bruto, tara);
  const liquido = p.n === 2 ? parseFloat(bruto) - parseFloat(tara) : null;
  const tempo = useMemo(() => tempoTransporte(d.horaSaidaPorto, hora), [d.horaSaidaPorto, hora]);
  const divergencia = d.items.some((i) => Math.abs((parseFloat(conf[i.operationItemId]) || 0) - i.quantidade) > 0.0005);

  async function ler(campo: 'bruto' | 'tara') {
    setLendo(campo);
    try {
      const peso = await Balanca.lerPeso({ baudRate: baud, parity, onStatus: (t) => setMsg({ t: '⏳ ' + t }) });
      (campo === 'bruto' ? setBruto : setTara)(peso.toFixed(2));
      setMsg({ t: `✓ Peso ${campo === 'tara' ? 'vazio' : 'cheio'} lido: ${peso.toFixed(2)} kg`, ok: true });
    } catch (e: any) {
      setMsg({ t: '✗ ' + e.message, ok: false });
    } finally { setLendo(null); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const erro = validarPesos(bruto, tara);
    if (erro) return setMsg({ t: '✗ ' + erro, ok: false });
    setSaving(true);
    try {
      const r = await fetch(`${API}/discharges/${d.id}/confirm`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          horaChegadaBalanca: hora, pesoBruto: bruto || null, tara: tara || null,
          observacoes: obs, confirmados: conf,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        const lista = j.errors ? Object.values(j.errors).flat().join(' ') : j.message ?? `Erro ${r.status}`;
        throw new Error(lista as string);
      }
      onSaved();
    } catch (err: any) {
      setMsg({ t: '✗ ' + err.message, ok: false });
      setSaving(false);
    }
  }

  const inp = 'w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm';
  const lbl = 'mb-1 block text-xs font-semibold text-slate-400';
  const lerBtn = 'rounded-r-lg border border-emerald-600 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-emerald-600 px-5 py-3 text-white">
          <h2 className="text-sm font-bold">Confirmação na balança</h2>
          <button type="button" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="space-y-3 p-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <strong>Passo {p.n} de 2</strong>
              <span className="text-xs text-slate-500">{p.texto}</span>
            </div>
            <div className="my-2 h-2 overflow-hidden rounded bg-slate-200">
              <div className="h-full rounded transition-all"
                   style={{ width: `${p.n * 50}%`, background: p.n === 2 ? '#198754' : p.n === 1 ? '#fd7e14' : '#cbd5e1' }} />
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              {[['Cheio (bruto)', p.b], ['Vazio (tara)', p.t]].map(([n, ok]) => (
                <span key={n as string} className="rounded-full border px-3 py-0.5"
                      style={ok ? { background: '#e6f4ec', color: '#198754', borderColor: '#b7dfc7' } : { color: '#64748b' }}>
                  {ok ? '✓ ' : '○ '}{n}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Guia <strong>{d.numeroGuia}</strong> — confirme a quantidade de cada produto
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Hora de chegada</label>
              <input type="time" required value={hora} onChange={(e) => setHora(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Tempo de transporte (min)</label>
              <input readOnly value={tempo ?? ''} placeholder="Auto" className={inp + ' bg-slate-100'} />
            </div>

            <div className="col-span-2">
              <label className={lbl}>Peso cheio / bruto (kg) · camião a chegar com a carga</label>
              <div className="flex">
                <input type="number" step="0.01" min="0" value={bruto} onChange={(e) => setBruto(e.target.value)}
                       className={inp + ' rounded-r-none'} placeholder="0.00" />
                <button type="button" disabled={!!lendo} onClick={() => ler('bruto')} className={lerBtn}>
                  {lendo === 'bruto' ? 'A ler...' : 'Ler balança'}
                </button>
              </div>
            </div>

            <div>
              <label className={lbl}>Peso vazio / tara (kg) · ao voltar</label>
              <div className="flex">
                <input type="number" step="0.01" min="0" value={tara} onChange={(e) => setTara(e.target.value)}
                       className={inp + ' rounded-r-none'} placeholder="0.00" />
                <button type="button" disabled={!!lendo} onClick={() => ler('tara')} className={lerBtn}>
                  {lendo === 'tara' ? '...' : 'Ler'}
                </button>
              </div>
            </div>
            <div>
              <label className={lbl}>Peso líquido (kg)</label>
              <input readOnly className={inp + ' bg-slate-100 font-bold text-emerald-700'}
                     value={liquido === null ? '' : liquido > 0 ? liquido.toFixed(2) : '—'} placeholder="Aguarda os 2 pesos" />
            </div>
          </div>

          {msg && <div className="text-xs" style={{ color: msg.ok === undefined ? '#64748b' : msg.ok ? '#198754' : '#dc3545' }}>{msg.t}</div>}

          <div>
            <label className={lbl}>Quantidade confirmada por produto</label>
            <div className="grid grid-cols-2 gap-2">
              {d.items.map((i) => {
                const dif = Math.abs((parseFloat(conf[i.operationItemId]) || 0) - i.quantidade) > 0.0005;
                return (
                  <div key={i.operationItemId}>
                    <label className="text-[11px] font-semibold text-slate-500">
                      {i.nome} (registado: {i.quantidade.toLocaleString('pt-PT')} {i.unidade === 'tonelada' ? 't' : 'sacos'})
                    </label>
                    <input type="number" required min={0} step={i.unidade === 'tonelada' ? 0.001 : 1}
                           value={conf[i.operationItemId]}
                           onChange={(e) => setConf({ ...conf, [i.operationItemId]: e.target.value })}
                           className={inp + (dif ? ' border-red-500' : '')} />
                  </div>
                );
              })}
            </div>
            {divergencia && <p className="mt-1 text-xs text-red-600">⚠ Divergência detectada!</p>}
          </div>

          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer">Configurações da porta serial</summary>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border bg-slate-50 p-2">
              <select value={baud} onChange={(e) => setBaud(+e.target.value)} className={inp}>
                {[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map((b) => <option key={b}>{b}</option>)}
              </select>
              <select value={parity} onChange={(e) => setParity(e.target.value as any)} className={inp}>
                <option value="none">None</option><option value="even">Even</option><option value="odd">Odd</option>
              </select>
              <p className="col-span-2">O mais comum é 9600/8N1. Consulte o manual da balança.</p>
            </div>
          </details>

          <div>
            <label className={lbl}>Observações</label>
            <textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} className={inp}
                      placeholder="Ex: saco rasgado, diferença de peso..." />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 pb-4">
          <button type="button" onClick={() => { Balanca.cancelar(); onClose(); }}
                  className="rounded-lg bg-slate-100 px-4 py-1.5 text-sm">Cancelar</button>
          <button type="submit" disabled={p.n === 0 || saving}
                  className="rounded-lg bg-emerald-600 px-5 py-1.5 text-sm font-bold text-white disabled:opacity-50">
            {saving ? 'A guardar...' : p.n === 2 ? 'Confirmar descarga' : 'Guardar peso (passo 1 de 2)'}
          </button>
        </div>
      </form>
    </div>
  );
}
