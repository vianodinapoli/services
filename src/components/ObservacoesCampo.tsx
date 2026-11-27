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
