'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoRefresh({ segundos = 20 }: { segundos?: number }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') iniciar(() => router.refresh());
    }, segundos * 1000);
    return () => clearInterval(t);
  }, [router, segundos]);

  return (
    <button
      type="button"
      onClick={() => iniciar(() => router.refresh())}
      disabled={pendente}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${pendente ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`}
      />
      {pendente ? 'A atualizar…' : 'Atualizar'}
    </button>
  );
}