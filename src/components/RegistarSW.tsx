'use client';

import { useEffect } from 'react';

export default function RegistarSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Em desenvolvimento não regista (a cache de ficheiros estragaria o hot reload)
    // e remove qualquer service worker que tenha ficado de testes anteriores.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}