'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader, Spinner } from '@/components/loaders';

/** Cor de destaque. Para mudar a identidade, altere só estas linhas. */
const MARCA = {
  '--marca': '#C8281E',
  '--marca-escuro': '#8E1B14',
} as CSSProperties;

/** Textos sobre a foto. Cada item do nome é uma linha. Para mudar, altere só aqui. */
const NOME_SISTEMA = ['Sistema de', 'Gestão de', 'Descargas', 'e Terminais'];
const FUNCOES = [
  'Camiões em tempo real',
  
  'Controlo do plano da operação',
];

/** Crédito no fundo do painel. */
const CREDITO = 'Desenvolvido pela FEM';

const SHIP_IMG =
  'https://plus.unsplash.com/premium_photo-1661879449050-069f67e200bd?fm=jpg&q=70&w=2000&auto=format&fit=crop';

/** Campo grande para toque: só a linha de baixo, que fica colorida quando está activo. Mais baixo na horizontal. */
const campo =
  'h-16 w-full border-0 border-b-2 border-zinc-200 bg-transparent px-0 text-xl text-zinc-900 placeholder:text-zinc-300 ' +
  'transition-colors focus:border-[var(--marca)] focus:outline-none focus:ring-0 disabled:opacity-50 ' +
  'landscape:h-12 landscape:text-lg';

const rotulo = 'mb-1 block text-base font-medium text-zinc-500 landscape:mb-0 landscape:text-sm';

function IconeOlho({ aberto }: { aberto: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!aberto && <path d="m4 4 16 16" />}
    </svg>
  );
}

function IconeVisto() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-white" aria-hidden="true">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [verSenha, setVerSenha] = useState(false);

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
    <main
      style={MARCA}
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black p-6 landscape:h-dvh landscape:min-h-0 landscape:items-stretch landscape:justify-end landscape:p-0"
    >
      <style>{`
        @keyframes entrar { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes entrar-lado { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: none; } }
        .entrar { animation: entrar 480ms cubic-bezier(.2,.7,.2,1) both; }
        @media (orientation: landscape) { .entrar { animation-name: entrar-lado; } }
        @media (prefers-reduced-motion: reduce) { .entrar { animation: none; } }
      `}</style>

      {/* Foto do navio: fundo em ecrã inteiro, nas duas orientações */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SHIP_IMG} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/45 landscape:bg-gradient-to-t landscape:from-black/85 landscape:via-black/30 landscape:to-black/10" />

      {/* Texto sobre a foto (só na horizontal): alinhado à esquerda, em baixo */}
      <div className="absolute inset-y-0 left-0 right-[30rem] z-10 hidden flex-col items-start justify-end p-10 text-left text-white landscape:flex xl:p-14">
        <h2
          className="font-display font-extrabold leading-[0.95] tracking-tight"
          style={{ fontSize: 'clamp(2rem, 4vw, 4.5rem)' }}
        >
          {NOME_SISTEMA.map((linha) => (
            <span key={linha} className="block">
              {linha}
            </span>
          ))}
        </h2>
        <div className="mt-6 h-1.5 w-20 rounded-full bg-[var(--marca)]" />
        <ul className="mt-6 space-y-3 text-lg font-medium xl:text-xl">
          {FUNCOES.map((t) => (
            <li key={t} className="flex items-center gap-3">
              <IconeVisto />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Vertical: cartão centrado por cima da foto. Horizontal: painel encostado à direita, com a altura do ecrã e compacto. */}
      <form
        onSubmit={onSubmit}
        className="entrar relative z-10 flex w-full max-w-lg flex-col justify-center gap-8 overflow-y-auto rounded-[2rem] bg-white p-10 shadow-2xl sm:p-12 landscape:max-h-dvh landscape:max-w-[30rem] landscape:gap-4 landscape:rounded-none landscape:rounded-l-[2.5rem] landscape:px-12 landscape:py-6"
      >
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nitro-logo.png" alt="Nitro" className="h-20 w-auto object-contain landscape:h-12" />
          <h1 className="font-display mt-8 text-4xl font-extrabold tracking-tight text-zinc-950 landscape:mt-3 landscape:text-3xl">
            Entrar
          </h1>
          <p className="mt-2 text-lg text-zinc-500 landscape:mt-1 landscape:text-base">
            Use a sua conta para aceder ao sistema.
          </p>
        </div>

        {erro && (
          <p role="alert" className="border-l-4 border-[var(--marca)] bg-red-50 py-3 pl-4 pr-3 text-base font-medium text-red-900 landscape:py-2 landscape:text-sm">
            {erro}
          </p>
        )}

        <label className="block">
          <span className={rotulo}>Email</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            required
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={busy}
            placeholder="nome@empresa.co.mz"
            className={campo}
          />
        </label>

        <label className="block">
          <span className={rotulo}>Palavra-passe</span>
          <span className="relative block">
            <input
              name="password"
              type={verSenha ? 'text' : 'password'}
              required
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={busy}
              className={`${campo} pr-14`}
            />
            <button
              type="button"
              onClick={() => setVerSenha((v) => !v)}
              aria-label={verSenha ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
              className="absolute right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-400 active:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marca)]"
            >
              <IconeOlho aberto={verSenha} />
            </button>
          </span>
        </label>

        <button
          disabled={busy}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--marca)] text-xl font-semibold text-white transition-colors active:bg-[var(--marca-escuro)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--marca)]/30 disabled:opacity-70 landscape:h-14 landscape:text-lg"
        >
          {busy && <Spinner />}
          {busy ? 'A entrar...' : 'Entrar'}
        </button>

        <div className="space-y-1 text-center landscape:space-y-0.5">
          <p className="text-sm text-zinc-400 landscape:text-xs">Acesso reservado a utilizadores autorizados</p>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 landscape:text-[11px]">{CREDITO}</p>
        </div>
      </form>

      {redirecting && <PageLoader fullscreen text="A entrar" sub="A preparar o seu painel" />}
    </main>
  );
}