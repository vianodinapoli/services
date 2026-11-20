'use client';

import { useEffect, useState } from 'react';

type EventoInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const CHAVE = 'instalar-app-dispensado';

function jaDispensado() {
  try {
    return !!localStorage.getItem(CHAVE);
  } catch {
    return false;
  }
}

function dispensar() {
  try {
    localStorage.setItem(CHAVE, String(Date.now()));
  } catch {}
}

export default function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [ios, setIos] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const instalada =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (instalada || jaDispensado()) return;

    // iPhone e iPad (o iPad novo apresenta-se como Mac com ecrã tátil)
    const ua = navigator.userAgent;
    const apple =
      /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
    if (apple) {
      setIos(true);
      setVisivel(true);
    }

    const aoPreparar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
      setVisivel(true);
    };
    const aoInstalar = () => setVisivel(false);

    window.addEventListener('beforeinstallprompt', aoPreparar);
    window.addEventListener('appinstalled', aoInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', aoPreparar);
      window.removeEventListener('appinstalled', aoInstalar);
    };
  }, []);

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === 'dismissed') dispensar();
    setEvento(null);
    setVisivel(false);
  }

  function fechar() {
    dispensar();
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar aplicação"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:bottom-6"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <p className="text-base font-bold text-slate-900">Instalar a aplicação</p>
      <p className="mt-1 text-sm text-slate-600">
        {ios && !evento
          ? 'Toque em Partilhar (o quadrado com a seta) e depois em "Adicionar ao ecrã principal".'
          : 'Abre em ecrã inteiro e fica no ecrã principal, como uma app.'}
      </p>
      <div className="mt-3 flex gap-2">
        {evento && (
          <button
            type="button"
            onClick={instalar}
            className="h-11 flex-1 rounded-xl bg-slate-900 px-5 text-base font-semibold text-white active:opacity-90"
          >
            Instalar
          </button>
        )}
        <button
          type="button"
          onClick={fechar}
          className="h-11 flex-1 rounded-xl border border-slate-300 px-5 text-base font-semibold text-slate-700 active:bg-slate-100"
        >
          {evento ? 'Agora não' : 'Entendi'}
        </button>
      </div>
    </div>
  );
}