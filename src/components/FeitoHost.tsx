'use client';

import { useEffect, useState } from 'react';
import FeitoAnimado from '@/components/FeitoAnimado';
import type { FeitoMsg } from '@/lib/feito';

/**
 * Fica no layout da app (nunca é desmontado quando a lista actualiza).
 * Qualquer componente chama mostrarFeito({...}) e a animação aparece aqui.
 */
export default function FeitoHost() {
  const [msg, setMsg] = useState<(FeitoMsg & { k: number }) | null>(null);

  useEffect(() => {
    const ouvir = (e: Event) => {
      const detalhe = (e as CustomEvent<FeitoMsg>).detail ?? {};
      setMsg({ ...detalhe, k: Date.now() });
    };
    window.addEventListener('feito:mostrar', ouvir);
    return () => window.removeEventListener('feito:mostrar', ouvir);
  }, []);

  if (!msg) return null;

  return <FeitoAnimado key={msg.k} titulo={msg.titulo} subtitulo={msg.subtitulo} onFim={() => setMsg(null)} />;
}
