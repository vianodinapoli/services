'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Icon } from './icons';

export default function FlashToast() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const ok = sp.get('ok');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ok) {
      setMsg(ok);
      router.replace(path, { scroll: false });
    }
  }, [ok, path, router]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(370px,calc(100vw-3rem))] animate-[toast-in_.35s_ease-out] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
          <Icon name="check" className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[13px] font-semibold text-slate-900">Sucesso</div>
          <div className="text-[12.5px] leading-snug text-slate-500">{msg}</div>
        </div>
        <button onClick={() => setMsg(null)} aria-label="Fechar" className="text-slate-300 hover:text-slate-600">
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
      <div className="h-[3px] bg-green-600 animate-[toast-bar_4s_linear_forwards]" />
    </div>
  );
}
