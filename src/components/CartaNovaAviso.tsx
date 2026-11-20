'use client';

import { useEffect, useState } from 'react';
import { verificarMatricula, type VerificarResp } from '@/lib/cartaNova';

export default function CartaNovaAviso({ operationId, matricula }: { operationId: number; matricula: string }) {
  const [res, setRes] = useState<VerificarResp | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    setRes(null);
    setErro(false);
    if (matricula.replace(/[^A-Za-z0-9]/g, '').length < 3) return;
    const t = setTimeout(() => {
      verificarMatricula(operationId, matricula).then(setRes).catch(() => setErro(true));
    }, 400);
    return () => clearTimeout(t);
  }, [operationId, matricula]);

  if (erro) {
    return (
      <div className="rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800">
        Não foi possível verificar a matrícula na carta nova. Confirme a ligação ou volte a iniciar sessão.
      </div>
    );
  }

  if (!res || !res.tem_lista) return null;

  if (!res.na_lista) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
        Matrícula <b>{res.matricula}</b> não está na lista - Contactar a central.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
      <b>{res.matricula}</b> está na lista. Confirme o motorista:
      <ul className="mt-1 list-disc pl-5">
        {res.motoristas.map((m, i) => (
          <li key={i}>
            {m.nome_completo} — carta {m.carta_conducao} ({m.do_numero})
          </li>
        ))}
      </ul>
    </div>
  );
}