'use client';

import { useEffect, useState } from 'react';
import { pesquisarMatriculas, type Sugestao } from '@/lib/cartaNova';

export default function MatriculaInput({
  operationId,
  value,
  onChange,
  onPick,
  className,
}: {
  operationId: number;
  value: string;
  onChange: (v: string) => void;
  onPick: (s: Sugestao) => void;
  className?: string;
}) {
  const [lista, setLista] = useState<Sugestao[]>([]);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (value.replace(/[^A-Za-z0-9]/g, '').length < 2) {
      setLista([]);
      return;
    }
    const t = setTimeout(() => {
      pesquisarMatriculas(operationId, value)
        .then(setLista)
        .catch(() => setLista([]));
    }, 250);
    return () => clearTimeout(t);
  }, [operationId, value]);

  return (
    <div className="relative">
      <input
        name="matricula"
        required
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        autoCapitalize="characters"
        autoComplete="off"
        className={className}
      />
      {aberto && lista.length > 0 && (
        <ul className="absolute left-0 z-20 mt-1 max-h-72 min-w-[20rem] overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg">
          {lista.map((s, i) => (
            <li key={`${s.matricula}-${s.nome_completo}-${i}`}>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  onPick(s);
                  setAberto(false);
                }}
                className="block w-full border-b border-gray-100 px-4 py-3 text-left last:border-0 active:bg-gray-100"
              >
                <span className="block text-base font-semibold">{s.matricula}</span>
                <span className="block text-sm text-gray-600">
                  {s.nome_completo} · carta {s.carta_conducao} · {s.do_numero}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
