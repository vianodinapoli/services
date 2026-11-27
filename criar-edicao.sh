#!/usr/bin/env bash
# Cria a página de edição do camião (só gestor) e o campo de observações.
# Uso, na raiz do projeto Next.js:   bash criar-edicao.sh
# (usa ./src se existir src/app; senão usa ./)
set -euo pipefail

RAIZ="${1:-$([ -d src/app ] && echo src || echo .)}"
PAGINA="$RAIZ/app/operacoes/[id]/camioes/[camiaoId]/editar"
COMP="$RAIZ/components"

mkdir -p "$PAGINA" "$COMP"

# ---------------------------------------------------------------- 1) Campo de observações
cat > "$COMP/ObservacoesCampo.tsx" <<'EOF'
'use client';

import { useId, useState } from 'react';

/** Campo de observações para o formulário de edição do camião. */
export default function ObservacoesCampo({
  defaultValue = '',
  name = 'observacoes',
  maxLength = 500,
  erro,
}: {
  defaultValue?: string | null;
  name?: string;
  maxLength?: number;
  erro?: string;
}) {
  const id = useId();
  const [valor, setValor] = useState(defaultValue ?? '');

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-600">
        Observações
      </label>
      <textarea
        id={id}
        name={name}
        rows={4}
        maxLength={maxLength}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        aria-invalid={!!erro}
        placeholder="Escreva aqui qualquer nota sobre este camião (opcional)"
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-accent focus:outline-none focus:ring-4 focus:ring-red-100"
      />
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <p className="text-sm text-red-700">{erro}</p>
        <p className="shrink-0 text-xs tabular-nums text-slate-500">
          {valor.length} / {maxLength}
        </p>
      </div>
    </div>
  );
}
EOF

# ---------------------------------------------------------------- 2) Formulário (cliente)
cat > "$COMP/FormEditarCamiao.tsx" <<'EOF'
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
      const res = await fetch(`/api/laravel/discharges/${camiao.id}`, {
        method: 'PATCH',
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
EOF

# ---------------------------------------------------------------- 3) Página (servidor): só gestor
cat > "$PAGINA/page.tsx" <<'EOF'
import { notFound, redirect } from 'next/navigation';
import { laravel } from '@/lib/laravel';
import PageHeader from '@/components/PageHeader';
import FormEditarCamiao, { type DadosCamiao } from '@/components/FormEditarCamiao';

export default async function EditarCamiaoPage({
  params,
}: {
  params: Promise<{ id: string; camiaoId: string }>;
}) {
  const { id, camiaoId } = await params;
  const voltarHref = `/operacoes/${id}`;

  // Só o role "gestor" pode editar. Qualquer outro volta à lista.
  const utilizador = await laravel<{ role?: string }>('/auth/me').catch(() => null);
  if ((utilizador?.role ?? '').trim().toLowerCase() !== 'gestor') redirect(voltarHref);

  const camiao = await laravel<DadosCamiao>(`/discharges/${camiaoId}`).catch(() => null);
  if (!camiao) notFound();

  return (
    <>
      <PageHeader title="Editar camião" subtitle={camiao.matricula} back={voltarHref} />
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 md:px-8 md:pt-10">
        <FormEditarCamiao camiao={camiao} voltarHref={voltarHref} />
      </div>
    </>
  );
}
EOF

echo "Criados:"
echo "  $COMP/ObservacoesCampo.tsx"
echo "  $COMP/FormEditarCamiao.tsx"
echo "  $PAGINA/page.tsx"
