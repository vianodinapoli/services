'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Actualiza a lista a cada 15 s, só com o separador visível, sem modal aberto
 * e sem o cursor num campo de texto (não estraga a pesquisa nem os filtros).
 */
export default function AtualizarAuto({ cadaMs = 15000 }: { cadaMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (document.querySelector('[role="dialog"]')) return;
      const el = document.activeElement;
      if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
      router.refresh();
    };
    const t = setInterval(tick, cadaMs);
    const aoVoltar = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [router, cadaMs]);

  return null;
}
