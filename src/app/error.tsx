'use client';

import { useEffect } from 'react';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // tenta recuperar sozinho a cada 10 s
  useEffect(() => {
    const id = setInterval(() => reset(), 10000);
    return () => clearInterval(id);
  }, [reset]);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 56 }}>📡</div>
        <h1 style={{ fontSize: 26, margin: '12px 0 8px' }}>Sem ligação ao servidor</h1>
        <p style={{ opacity: 0.7, marginBottom: 24, maxWidth: 420 }}>
          Não foi possível contactar o sistema. Verifique o Wi-Fi e tente novamente.
          Se continuar, contacte o suporte.
        </p>
        <button
          onClick={() => reset()}
          style={{ padding: '16px 32px', fontSize: 20, borderRadius: 12, border: 0, background: '#16a34a', color: '#fff' }}
        >
          Tentar de novo
        </button>
      </div>
    </div>
  );
}