'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function Inner() {
  const bar = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pathname = usePathname();
  const search = useSearchParams();

  // Navegação terminou: completa e esconde a barra
  useEffect(() => {
    const b = bar.current;
    if (!b) return;
    b.style.width = '100%';
    timer.current = setTimeout(() => {
      b.style.opacity = '0';
      b.style.width = '0%';
    }, 250);
    return () => clearTimeout(timer.current);
  }, [pathname, search]);

  // Clique num link interno: inicia a barra
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      const url = new URL(a.href, location.href);
      const mudou = url.pathname + url.search !== location.pathname + location.search;
      if (url.origin !== location.origin || !mudou) return;
      const b = bar.current;
      if (!b) return;
      clearTimeout(timer.current);
      b.style.opacity = '1';
      b.style.width = '70%';
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div
      ref={bar}
      aria-hidden="true"
      className="fixed left-0 top-0 z-[60] h-[3px] w-0 bg-accent opacity-0 transition-[width,opacity] duration-300"
    />
  );
}

export default function NavProgress() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}