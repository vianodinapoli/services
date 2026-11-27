'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();
  const naPaginaLogin = pathname.startsWith('/login');

  useEffect(() => {
    if (!naPaginaLogin) {
      // navegação completa, para passar pela rota que limpa a sessão
      window.location.replace('/api/laravel/auth/limpar');
    }
  }, [naPaginaLogin]);

  if (!naPaginaLogin) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ opacity: 0.7 }}>A voltar ao login…</p>
      </div>
    );
  }

  // se até o login falhar, mostra o aviso com botão
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div>
        <div style={{ fontSize: 56 }}>📡</div>
        <h1 style={{ fontSize: 26, margin: '12px 0 8px' }}>Sem ligação ao servidor</h1>
        <p style={{ opacity: 0.7, marginBottom: 24 }}>Verifique o Wi-Fi e tente novamente.</p>
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
