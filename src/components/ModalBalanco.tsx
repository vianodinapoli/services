'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export default function ModalBalanco({
  fecharHref,
  excelHref,
  children,
}: {
  fecharHref: string;
  excelHref?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const fechar = () => router.push(fecharHref, { scroll: false });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(fecharHref, { scroll: false });
    };
    document.addEventListener('keydown', onKey);
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = antes;
    };
  }, [fecharHref, router]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Balanço de confirmados"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 md:items-center md:p-6"
      onClick={fechar}
    >
      {/* Telemóvel: folha de baixo, largura total.
          Tablet e monitor: diálogo centrado, 94% do ecrã até 72rem (1152px). */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full flex-col overflow-hidden rounded-t-3xl bg-slate-100 shadow-2xl md:w-[94vw] md:max-w-6xl md:rounded-3xl"
        style={{ maxHeight: '92vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Barra fora da área do screenshot */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <span className="text-sm font-semibold text-slate-500">Pré-visualização do balanço</span>
          <div className="flex items-center gap-2">
            {excelHref && (
              <a
                href={excelHref}
                download
                className="flex h-11 items-center rounded-xl bg-emerald-600 px-5 text-base font-semibold text-white hover:bg-emerald-700 active:opacity-90"
              >
                Excel
              </a>
            )}
            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar"
              className="flex h-11 items-center rounded-xl border border-slate-300 px-5 text-base font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 md:p-6">{children}</div>
      </div>
    </div>
  );
}
