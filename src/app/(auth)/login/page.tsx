'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader, Spinner } from '@/components/loaders';

const input =
  'h-14 w-full rounded-lg border border-gray-300 bg-white px-4 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-red-200';

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
        setRedirecting(true); // mantém busy ligado: o loader fica até a página mudar
        router.push('/operacoes');
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => ({}));
      setErro(data?.errors?.email?.[0] ?? data?.message ?? 'Não foi possível entrar.');
    } catch {
      setErro('Sem ligação ao servidor. Verifique a rede e tente novamente.');
    }

    setBusy(false); // só chega aqui se o login falhou
  }

  return (
    <main className="flex min-h-screen">
      <section className="relative hidden flex-1 flex-col justify-between bg-sb p-12 text-white lg:flex">
        <div>
          <div className="font-display text-2xl font-bold tracking-wide">SGL - CREATIV DEMO</div>
          <div className="mt-1 text-xs uppercase tracking-[2px] text-gray-500">Sistema de Gestão</div>
        </div>
        <div>
          <div className="mb-5 h-1 w-14 rounded bg-accent" />
          <h2 className="font-display text-4xl font-extrabold leading-tight">Descarga de navios</h2>
          <p className="mt-3 max-w-md text-gray-400">Registo de camiões no porto, com assinatura do motorista e controlo do plano da operação.</p>
        </div>
        <div className="text-xs text-gray-600">Acesso reservado a utilizadores autorizados</div>
      </section>

      <section className="flex flex-1 items-center justify-center bg-content p-6">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-5 rounded-2xl border border-[#e9ecef] bg-white p-8 shadow-sm">
          <div>
            <div className="mb-3 h-1 w-10 rounded bg-accent lg:hidden" />
            <h1 className="font-display text-2xl font-bold text-gray-900">Entrar</h1>
            <p className="mt-1 text-sm text-gray-500">Use a sua conta do sistema para registar camiões.</p>
          </div>

          {erro && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Email</span>
            <input name="email" type="email" required autoComplete="username" disabled={busy} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Palavra-passe</span>
            <input name="password" type="password" required autoComplete="current-password" disabled={busy} className={input} />
          </label>

          <button
            disabled={busy}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-accent text-lg font-semibold text-white shadow-sm disabled:opacity-70"
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