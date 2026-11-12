'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { fmt, type Operation } from '@/lib/laravel-types';

const input =
  'h-14 w-full rounded-lg border border-gray-300 bg-white px-4 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-red-200';
const card = 'space-y-4 rounded-xl border border-[#e9ecef] bg-white p-5';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

export default function NovaDescargaForm({ operation }: { operation: Operation }) {
  const router = useRouter();
  const sig = useRef<SignatureCanvas>(null);
  const [qtys, setQtys] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

  const err = (k: string) => errors[k]?.[0];
  const hoje = new Date().toLocaleDateString('en-CA');
  const agora = new Date().toTimeString().slice(0, 5);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    if (!sig.current || sig.current.isEmpty()) {
      setErrors({ assinatura: ['A assinatura do motorista é obrigatória.'] });
      return;
    }

    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErrors({});

    try {
      const res = await fetch('/api/laravel/discharges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation_id: operation.id,
          data: f.get('data'),
          hora_saida_porto: f.get('hora_saida_porto') || null,
          motorista: f.get('motorista'),
          matricula: f.get('matricula'),
          transportadora: f.get('transportadora'),
          numero_guia: f.get('numero_guia'),
          tipo_atrelado: f.get('tipo_atrelado'),
          items: qtys,
          assinatura: sig.current.getCanvas().toDataURL('image/png'),
        }),
      });

      if (res.status === 401) return router.push('/login');
      if (res.status === 422) {
        setErrors((await res.json()).errors ?? {});
        return;
      }
      if (!res.ok) {
        setErrors({ geral: ['Falha ao registar. Verifique a ligação e tente novamente.'] });
        return;
      }

      const msg = encodeURIComponent('Camião registado. Aguarda confirmação na balança.');
      router.push(`/operacoes/${operation.id}?ok=${msg}`);
      router.refresh();
    } catch {
      setErrors({ geral: ['Sem ligação ao servidor. Verifique a rede e tente novamente.'] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5 p-6">
      {err('geral') && <p className="rounded-lg bg-red-50 p-3 text-red-700">{err('geral')}</p>}

      <section className={card}>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-gray-500">Saída do porto</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data">
            <input type="date" name="data" defaultValue={hoje} required className={input} suppressHydrationWarning />
          </Field>
          <Field label="Hora de saída">
            <input type="time" name="hora_saida_porto" defaultValue={agora} className={input} suppressHydrationWarning />
          </Field>
        </div>
      </section>

      <section className={card}>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-gray-500">Camião</h2>
        <Field label="Motorista" error={err('motorista')}>
          <input name="motorista" required className={input} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Matrícula" error={err('matricula')}>
            <input name="matricula" required className={input} />
          </Field>
          <Field label="Número da guia" error={err('numero_guia')}>
            <input name="numero_guia" required className={input} />
          </Field>
        </div>
        <Field label="Transportadora" error={err('transportadora')}>
          <input name="transportadora" list="transportadoras" required className={input} />
        </Field>
        <datalist id="transportadoras">
          {operation.transportadoras.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <Field label="Tipo de atrelado" error={err('tipo_atrelado')}>
          <select name="tipo_atrelado" defaultValue="normal" className={input}>
            <option value="normal">Atrelado normal</option>
            <option value="link">Atrelado link</option>
          </select>
        </Field>
      </section>

      <section className={card}>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-gray-500">Quantidades</h2>
        {operation.items.map((it) => (
          <div key={it.id}>
            <label className="flex items-center justify-between gap-4">
              <span className="text-slate-800">
                <span className="font-semibold">{it.nome}</span>
                <span className="block text-xs text-gray-500">
                  Saldo: {fmt(it.saldo)} {it.unidade_label}
                </span>
              </span>
              <input
                inputMode="decimal"
                value={qtys[it.id] ?? ''}
                onChange={(e) => setQtys({ ...qtys, [it.id]: e.target.value })}
                className={`${input} !w-40 text-right`}
              />
            </label>
            {err(`items.${it.id}`) && <p className="mt-1 text-sm text-red-600">{err(`items.${it.id}`)}</p>}
          </div>
        ))}
        {err('items') && <p className="text-sm text-red-600">{err('items')}</p>}
      </section>

      <section className={card}>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-gray-500">Assinatura do motorista</h2>
        <div className="overflow-x-auto">
          <SignatureCanvas
            ref={sig}
            canvasProps={{
              width: 640,
              height: 200,
              style: { width: 640, height: 200, touchAction: 'none' },
              className: 'rounded-lg border border-gray-300 bg-white',
            }}
          />
        </div>
        <button type="button" onClick={() => sig.current?.clear()} className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700">
          Limpar assinatura
        </button>
        {err('assinatura') && <p className="text-sm text-red-600">{err('assinatura')}</p>}
      </section>

      <button disabled={busy} className="h-16 w-full rounded-xl bg-accent text-lg font-semibold text-white shadow-sm disabled:opacity-50">
        {busy ? 'A registar...' : 'Registar camião'}
      </button>
    </form>
  );
}
