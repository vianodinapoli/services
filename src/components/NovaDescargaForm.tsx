'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { fmt, type Operation } from '@/lib/laravel-types';
import { registarDescarga, listar } from '@/lib/offline';
import CartaNovaAviso from '@/components/CartaNovaAviso';
import MatriculaInput from '@/components/MatriculaInput';

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
  const formRef = useRef<HTMLFormElement>(null);
  const sig = useRef<SignatureCanvas>(null);
  const [qtys, setQtys] = useState<Record<number, string>>({});
  const [matricula, setMatricula] = useState('');
  const [motorista, setMotorista] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const err = (k: string) => errors[k]?.[0];
  const hoje = new Date().toLocaleDateString('en-CA');

  // Guarda esta página no tablet para abrir sem rede (a cópia vem do que foi carregado com rede)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.active?.postMessage({ tipo: 'cachear', urls: [location.pathname + location.search] }))
      .catch(() => {});
  }, []);

  function limparFormulario() {
    formRef.current?.reset();
    setQtys({});
    setMatricula('');
    setMotorista('');
    setErrors({});
    sig.current?.clear();
  }

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
    setAviso(null);

    try {
      const r = await registarDescarga(
        {
          operation_id: operation.id,
          data: f.get('data'),
          motorista: f.get('motorista'),
          matricula: f.get('matricula'),
          transportadora: f.get('transportadora'),
          numero_guia: f.get('numero_guia'),
          tipo_atrelado: f.get('tipo_atrelado'),
          items: qtys,
          assinatura: sig.current.getCanvas().toDataURL('image/png'),
          // Hora do toque no tablet: o servidor deve usá-la em vez da hora de recepção
          carregado_em: new Date().toISOString(),
        },
        operation.id,
        `${f.get('matricula')} · ${f.get('motorista')}`,
      );

      if (r.r === 'ok') {
        const msg = encodeURIComponent('Camião registado como carregado. Aguarda a saída do porto.');
        router.push(`/operacoes/${operation.id}?ok=${msg}`);
        router.refresh();
        return;
      }

      if (r.r === 'rejeitado') {
        setErrors(r.erros ?? { geral: [r.msg ?? 'Dados inválidos.'] });
        return;
      }

      if (r.r === 'sessao') {
        router.push('/login'); // o registo fica guardado e é enviado depois de entrar
        return;
      }

      // offline: ficou guardado no tablet
      const n = (await listar()).filter((i) => i.estado === 'pendente').length;
      setAviso(`Guardado no tablet (${n} por enviar). Será enviado quando o servidor voltar. Pode registar o próximo camião.`);
      limparFormulario();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5 p-6 pb-28">
      {aviso && <p className="rounded-lg bg-amber-50 p-3 text-amber-800">{aviso}</p>}
      {err('geral') && <p className="rounded-lg bg-red-50 p-3 text-red-700">{err('geral')}</p>}

      <section className={card}>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-gray-500">Carregamento</h2>
        <Field label="Data">
          <input type="date" name="data" defaultValue={hoje} required className={input} suppressHydrationWarning />
        </Field>
        <p className="text-sm text-gray-500">A hora de carregamento fica registada automaticamente no momento em que carrega em Registar.</p>
      </section>

      <section className={card}>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-gray-500">Camião</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Matrícula" error={err('matricula')}>
            <MatriculaInput
              operationId={operation.id}
              value={matricula}
              onChange={setMatricula}
              onPick={(s) => {
                setMatricula(s.matricula);
                setMotorista(s.nome_completo);
              }}
              className={input}
            />
          </Field>
          <Field label="Número da guia" error={err('numero_guia')}>
            <input name="numero_guia" required className={input} />
          </Field>
        </div>

        <CartaNovaAviso operationId={operation.id} matricula={matricula} />

        <Field label="Motorista" error={err('motorista')}>
          <input
            name="motorista"
            required
            value={motorista}
            onChange={(e) => setMotorista(e.target.value)}
            className={input}
          />
        </Field>

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