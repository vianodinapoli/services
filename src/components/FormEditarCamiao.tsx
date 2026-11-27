'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ObservacoesCampo from '@/components/ObservacoesCampo';

export type DadosCamiao = {
  id: number;
  matricula: string;
  motorista: string;
  transportadora: string;
  numero_guia: string;
  tipo_atrelado?: string | null;
  observacoes?: string | null;
};

const campo =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm placeholder:text-slate-400 ' +
  'transition-colors hover:border-slate-300 focus:border-accent focus:outline-none focus:ring-4 focus:ring-red-100 md:h-14';
const rotulo = 'mb-1.5 block text-sm font-medium text-slate-600';

function Erro({ texto }: { texto?: string }) {
  return texto ? <p className="mt-1.5 text-sm text-red-700">{texto}</p> : null;
}

export default function FormEditarCamiao({
  camiao,
  voltarHref,
}: {
  camiao: DadosCamiao;
  voltarHref: string;
}) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});

  async function aoSubmeter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setErro(null);
    setErros({});
    setEnviando(true);

    const f = new FormData(e.currentTarget);
    const txt = (k: string) => String(f.get(k) ?? '').trim();
    const corpo = {
      matricula: txt('matricula'),
      motorista: txt('motorista'),
      transportadora: txt('transportadora'),
      numero_guia: txt('numero_guia'),
      tipo_atrelado: txt('tipo_atrelado') || null,
      observacoes: txt('observacoes') || null,
    };

    try {
      const res = await fetch(`/api/laravel/discharges/${camiao.id}/editar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(corpo),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.status === 403) {
        setErro('Não tem permissão para editar este registo.');
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j?.errors && typeof j.errors === 'object') {
          const mapa: Record<string, string> = {};
          for (const [k, v] of Object.entries(j.errors)) mapa[k] = Array.isArray(v) ? String(v[0]) : String(v);
          setErros(mapa);
        }
        setErro(j?.message ?? `Erro ${res.status} ao guardar as alterações.`);
        return;
      }

      iniciar(() => {
        router.push(voltarHref);
        router.refresh();
      });
    } catch {
      setErro('Sem ligação ao servidor. Verifique a rede e tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={aoSubmeter}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-8"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <label className="block">
          <span className={rotulo}>Matrícula</span>
          <input name="matricula" defaultValue={camiao.matricula} required className={campo} />
          <Erro texto={erros.matricula} />
        </label>

        <label className="block">
          <span className={rotulo}>Guia</span>
          <input name="numero_guia" defaultValue={camiao.numero_guia} required className={campo} />
          <Erro texto={erros.numero_guia} />
        </label>

        <label className="block">
          <span className={rotulo}>Motorista</span>
          <input name="motorista" defaultValue={camiao.motorista} required className={campo} />
          <Erro texto={erros.motorista} />
        </label>

        <label className="block">
          <span className={rotulo}>Transportadora</span>
          <input name="transportadora" defaultValue={camiao.transportadora} required className={campo} />
          <Erro texto={erros.transportadora} />
        </label>

        <label className="block">
          <span className={rotulo}>Atrelado</span>
          <select name="tipo_atrelado" defaultValue={camiao.tipo_atrelado ?? ''} className={campo}>
            <option value="">Não definido</option>
            <option value="normal">Normal</option>
            <option value="link">Link</option>
          </select>
          <Erro texto={erros.tipo_atrelado} />
        </label>

        <div className="md:col-span-2">
          <ObservacoesCampo defaultValue={camiao.observacoes} erro={erros.observacoes} />
        </div>
      </div>

      {erro && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-base text-red-700">
          {erro}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={voltarHref}
          className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-base font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] md:h-14 md:px-8"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={enviando}
          className="h-12 rounded-xl bg-accent px-6 text-base font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 md:h-14 md:px-8"
        >
          {enviando ? 'A guardar…' : 'Guardar alterações'}
        </button>
      </div>
    </form>
  );
}
