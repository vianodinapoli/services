'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader, Spinner } from '@/components/loaders';

const input =
  'h-14 w-full rounded-lg border border-gray-300 bg-white px-4 text-base focus:border-nitro-500 focus:outline-none focus:ring-2 focus:ring-nitro-200';

const SHIP_IMG =
  'https://plus.unsplash.com/premium_photo-1661879449050-069f67e200bd?fm=jpg&q=70&w=2000&auto=format&fit=crop';

export default function LoginPage() {
  const router = useRouter();
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErro('');

    try {
      const res = await fetch('/api/laravel/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.get('email'), password: f.get('password') }),
      });

      if (res.ok) {
        setRedirecting(true);
        router.push('/operacoes');
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => ({}));
      setErro(data?.errors?.email?.[0] ?? data?.message ?? 'Não foi possível entrar.');
    } catch {
      setErro('Sem ligação ao servidor. Verifique a rede e tente novamente.');
    }

    setBusy(false);
  }

    return (
    <main className="relative flex min-h-screen overflow-hidden bg-nitro-950">
      {/* Navio no fundo, em toda a página */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SHIP_IMG} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* Véu verde: mais forte à esquerda (texto), mais leve à direita */}
      <div className="absolute inset-0 bg-gradient-to-r from-nitro-950/85 via-nitro-900/45 to-nitro-900/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-nitro-950/60 via-transparent to-transparent" />

      <section className="relative z-10 hidden flex-1 flex-col justify-between p-12 text-white lg:flex">
        <div className="flex items-center gap-4">
          <img src="/nitro-logo.png" alt="Nitro S.A" className="h-16 w-16 object-contain drop-shadow-lg" />
          <div>
            <div className="font-display text-2xl font-bold tracking-wide">SGT - GRUPO FEM</div>
            <div className="mt-1 text-xs uppercase tracking-[2px] text-nitro-200">APP - Sistema de Gestão de terminal</div>
          </div>
        </div>

        <div>
          <div className="mb-5 h-1 w-14 rounded bg-nitro-400" />
          <h2 className="font-display text-4xl font-extrabold leading-tight">Descarga de navios</h2>
          <ul className="mt-4 max-w-md space-y-2 text-nitro-100/90">
  {[
    'Registo de camiões em tempo real',
    'Assinatura digital do motorista',
    'Controlo do plano da operação',
  ].map((t) => (
    <li key={t} className="flex items-center gap-3">
      <span className="h-2 w-2 rounded-full bg-nitro-400" />
      {t}
    </li>
  ))}
</ul>
        </div>

        <div className="text-xs text-nitro-200/80">Acesso reservado a utilizadores autorizados</div>
      </section>

      <section className="relative z-10 flex flex-1 items-center justify-center p-6">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md space-y-5 rounded-2xl border border-white/40 bg-white/95 p-8 shadow-2xl backdrop-blur-sm"
        >
          <div>
            <img src="/nitro-logo.png" alt="Nitro S.A" className="mb-4 h-16 w-16 object-contain lg:hidden" />
            <div className="mb-3 hidden h-1 w-10 rounded bg-nitro-500 lg:block" />
            <h1 className="font-display text-2xl font-bold text-nitro-900">Entrar</h1>
            <p className="mt-1 text-sm text-gray-500">Use a sua conta do sistema para registar camiões.</p>
          </div>

          {erro && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-nitro-700">Email</span>
            <input name="email" type="email" required autoComplete="username" disabled={busy} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-nitro-700">Palavra-passe</span>
            <input name="password" type="password" required autoComplete="current-password" disabled={busy} className={input} />
          </label>

          <button
            disabled={busy}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-nitro-600 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-nitro-700 focus:outline-none focus:ring-2 focus:ring-nitro-300 disabled:opacity-70"
          >
            {busy ? (
              <>
                <Spinner /> A entrar...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </section>

      {redirecting && <PageLoader fullscreen text="A entrar" sub="A preparar o seu painel" />}
    </main>
  );
}