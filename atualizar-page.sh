#!/usr/bin/env bash
# Substitui a página da operação. Corra na raiz do projeto Next.js:  bash atualizar-page.sh
# (usa ./src se existir src/app; senão usa ./)
set -euo pipefail

RAIZ="${1:-$([ -d src/app ] && echo src || echo .)}"
DESTINO="$RAIZ/app/operacoes/[id]/page.tsx"

mkdir -p "$(dirname "$DESTINO")"
[ -f "$DESTINO" ] && cp "$DESTINO" "$DESTINO.bak"

cat > "$DESTINO" <<'EOF'
import { Suspense } from 'react';
import Link from 'next/link';
import { laravel } from '@/lib/laravel';
import PageHeader from '@/components/PageHeader';
import FlashToast from '@/components/FlashToast';
import AtualizarAuto from '@/components/AtualizarAuto';
import LinhaCamiao from '@/components/LinhaCamiao';
import { Icon } from '@/components/icons';
import ModalBalanco from '@/components/ModalBalanco';
import BalancoConfirmados from '@/components/BalancoConfirmados';
import {
  fmt,
  type DischargeList,
  type Operation,
  type RelatorioConfirmados,
} from '@/lib/laravel-types';

type SP = Record<string, string | undefined>;
// rd e rf (relatório) ficam de fora de propósito: não devem ir para a lista.
const CHAVES = ['q', 'st', 'tr', 'at', 'de', 'ate', 'pp'];

/* ---------- Sistema de estilos (paleta FEM: slate + accent; verde/âmbar só para estado) ---------- */

const focoVisivel =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 focus-visible:border-accent';

const campo =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm placeholder:text-slate-400 ' +
  `transition-colors hover:border-slate-300 focus:border-accent focus:outline-none focus:ring-4 focus:ring-red-100 md:h-14`;

const rotuloCampo = 'mb-1.5 block text-sm font-medium text-slate-600';

const cartao = 'rounded-2xl border border-slate-200 bg-white shadow-sm';

const botaoEscuro =
  `h-12 shrink-0 rounded-xl bg-accent px-6 text-base font-semibold text-white transition hover:opacity-90 active:scale-[0.98] md:h-14 md:px-8 ${focoVisivel}`;

const botaoPagina =
  `flex h-12 items-center rounded-xl border border-slate-200 bg-white px-5 text-base font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] md:h-14 md:px-7 ${focoVisivel}`;

const botaoPaginaOff =
  'flex h-12 items-center rounded-xl border border-slate-200 bg-slate-100 px-5 text-base text-slate-300 md:h-14 md:px-7';

const semBarra = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

function Titulo({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="font-display flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
        <span className="h-6 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        {children}
      </h2>
      {aside}
    </div>
  );
}

function IconeLupa() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/** Camião com um reboque (atrelado normal) ou com dois reboques (atrelado link). */
function IconeCamiao({ tipo, tamanho = 20 }: { tipo?: string | null; tamanho?: number }) {
  const link = tipo === 'link';
  const cor = link ? 'text-accent' : tipo === 'normal' ? 'text-slate-700' : 'text-slate-400';
  const texto = link ? 'Atrelado link' : tipo === 'normal' ? 'Atrelado normal' : 'Atrelado não definido';
  const largura = link ? Math.round((tamanho * 38) / 24) : tamanho;

  return (
    <svg
      role="img"
      aria-label={texto}
      width={largura}
      height={tamanho}
      viewBox={link ? '0 0 38 24' : '0 0 24 24'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${cor}`}
    >
      <title>{texto}</title>
      {link ? (
        <>
          <path d="M12 18V6a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M8 18h4" />
          <path d="M12 12h3" />
          <path d="M15 18h7" />
          <path d="M22 18h5" />
          <path d="M27 18h1" />
          <path d="M32 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 30.52 8H28" />
          <path d="M28 8v10" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <circle cx="30" cy="18" r="2" />
        </>
      ) : (
        <>
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
          <circle cx="17" cy="18" r="2" />
          <circle cx="7" cy="18" r="2" />
        </>
      )}
    </svg>
  );
}

const numero = 'font-sans font-bold tabular-nums tracking-tight';

/** Só o role "gestor" pode editar registos. Em caso de erro, assume que NÃO pode. */
async function souGestor(): Promise<boolean> {
  try {
    const u = await laravel<{ role?: string }>('/auth/me'); // ajuste o endpoint se o seu for outro
    return (u.role ?? '').trim().toLowerCase() === 'gestor';
  } catch {
    return false;
  }
}

function paginas(atual: number, ultima: number): (number | '...')[] {
  const out: (number | '...')[] = [];
  const ini = Math.max(1, atual - 1);
  const fim = Math.min(ultima, atual + 1);
  if (ini > 1) out.push(1);
  if (ini > 2) out.push('...');
  for (let i = ini; i <= fim; i++) out.push(i);
  if (fim < ultima - 1) out.push('...');
  if (fim < ultima) out.push(ultima);
  return out;
}

export default async function OperacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const pagina = Math.max(1, parseInt(sp.pagina ?? '1', 10) || 1);

  const api = new URLSearchParams();
  CHAVES.forEach((k) => {
    if (sp[k]) api.set(k, sp[k] as string);
  });
  api.set('pagina', String(pagina));

  const relatorioPedido = !!(sp.rd && sp.rf);
  const intervaloInvalido = relatorioPedido && new Date(sp.rf!) < new Date(sp.rd!);
  let erroRelatorio: string | null = intervaloInvalido
    ? 'A hora final tem de ser igual ou posterior à hora inicial.'
    : null;

  const [op, lista, relatorio, podeEditar] = await Promise.all([
    laravel<Operation>(`/operations/${id}`),
    laravel<DischargeList>(`/operations/${id}/discharges?${api.toString()}`),
    relatorioPedido && !intervaloInvalido
      ? laravel<RelatorioConfirmados>(
          `/operations/${id}/reports/confirmed?${new URLSearchParams({ de: sp.rd!, ate: sp.rf! }).toString()}`,
        ).catch((e: Error) => {
          erroRelatorio = `Não foi possível gerar o relatório (${e.message}).`;
          return null;
        })
      : Promise.resolve(null),
    souGestor(),
  ]);

  const base = `/operacoes/${id}`;
  const href = (over: SP) => {
    const p = new URLSearchParams();
    Object.entries({ ...sp, ...over }).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  const pct = op.esperado_ton > 0 ? Math.min(100, Math.round((op.recebido_ton / op.esperado_ton) * 1000) / 10) : 0;
  const faltam = Math.max(0, op.esperado_ton - op.recebido_ton);
  const { meta, contagens } = lista;
  const filtrosAvancados = !!(sp.tr || sp.at || sp.de || sp.ate);
  const filtrado = !!(sp.q || sp.st || filtrosAvancados);

  const abas = [
    { valor: '', rotulo: 'Todos', n: contagens.todos },
    { valor: 'por_confirmar', rotulo: 'Por confirmar', n: contagens.por_confirmar },
    { valor: 'loaded', rotulo: 'Carregados', n: contagens.loaded },
    { valor: 'in_transit', rotulo: 'Em trânsito', n: contagens.in_transit },
    { valor: 'weighing', rotulo: 'A pesar', n: contagens.weighing },
    { valor: 'confirmed', rotulo: 'Confirmados', n: contagens.confirmed },
  ];

  const por = (meta as any).por_pagina ?? lista.data.length;
  const de = (meta.pagina - 1) * por + 1;
  const ate = (meta.pagina - 1) * por + lista.data.length;

  // Hora de geração do balanço, sempre em hora de Maputo (o servidor pode estar em UTC).
  const geradoEm = new Date().toLocaleString('pt-PT', {
    timeZone: 'Africa/Maputo',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const pendentes = op.pendentes_count > 0;

  return (
    <>
      <PageHeader title={op.navio} subtitle={op.empresa} back="/operacoes" />
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
      <AtualizarAuto />

      {/* Botão suspenso: abre o formulário em modal */}
      <Link
        href={`${base}/novo`}
        scroll={false}
        aria-label="Registar novo camião"
        className={`fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-accent px-5 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:opacity-95 active:scale-95 sm:px-6 md:bottom-8 md:right-8 md:h-16 md:px-8 md:text-lg ${focoVisivel}`}
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <Icon name="plus" />
        <span className="hidden sm:inline">Registar novo camião</span>
      </Link>

      <div className="mx-auto w-full max-w-[1600px] space-y-10 px-4 pb-32 pt-6 md:space-y-12 md:px-8 md:pt-10 xl:px-10">
        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className={`${cartao} col-span-2 p-4 md:p-5`}>
            <div className="text-sm font-medium text-slate-600 md:text-base">Recebido</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className={`${numero} text-3xl text-slate-900 md:text-4xl`}>{fmt(op.recebido_ton, 1)} t</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-slate-700">
                {pct}%
              </span>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso da operação"
            >
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm tabular-nums text-slate-600">
              <span>de {fmt(op.esperado_ton, 1)} t esperadas</span>
              <span>faltam {fmt(faltam, 1)} t</span>
            </div>
          </div>

          <div className={`${cartao} flex flex-col justify-between p-4 md:p-5`}>
            <div className="text-sm font-medium text-slate-600 md:text-base">Por confirmar</div>
            <div className={`${numero} mt-1 text-3xl md:text-4xl ${pendentes ? 'text-amber-600' : 'text-slate-900'}`}>
              {op.pendentes_count}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${pendentes ? 'bg-amber-500' : 'bg-emerald-500'}`}
                aria-hidden="true"
              />
              {pendentes ? 'A aguardar confirmação' : 'Tudo confirmado'}
            </div>
          </div>

          <div className={`${cartao} flex flex-col justify-between p-4 md:p-5`}>
            <div className="text-sm font-medium text-slate-600 md:text-base">Confirmados</div>
            <div className={`${numero} mt-1 text-3xl text-slate-900 md:text-4xl`}>{contagens.confirmed}</div>
            <div className="mt-2 text-sm text-slate-600">
              de {contagens.todos} {contagens.todos === 1 ? 'camião' : 'camiões'}
            </div>
          </div>
        </div>

        {/* Plano por produto */}
        <section className="space-y-4">
          <Titulo>Plano por produto</Titulo>
          <div
            className={`-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:snap-none md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3 2xl:grid-cols-4 ${semBarra}`}
          >
            {op.items.map((it) => {
              const p = it.plano > 0 ? Math.min(100, Math.round((it.registado / it.plano) * 1000) / 10) : 0;
              const barra = it.registado > 0 ? Math.max(p, 1.5) : 0; // sempre visível quando há registo
              return (
                <div
                  key={it.id}
                  className={`${cartao} min-w-[240px] shrink-0 snap-start p-4 md:min-w-0 md:p-5`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-base font-semibold leading-snug text-slate-900">{it.nome}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-700">
                      {p}%
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
                    <span className="text-2xl font-bold tracking-tight text-slate-900">{fmt(it.registado)}</span>
                    <span className="text-base text-slate-500">
                      / {fmt(it.plano)} {it.unidade_label}
                    </span>
                  </div>
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={p}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progresso de ${it.nome}`}
                  >
                    <div className="h-full rounded-full bg-accent" style={{ width: `${barra}%` }} />
                  </div>
                  <p className="mt-2 text-sm tabular-nums text-slate-600">
                    Saldo: {fmt(it.saldo)} {it.unidade_label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Relatório de confirmados */}
        <section className="space-y-4">
          <Titulo>Relatório de confirmados</Titulo>
          <div className={`${cartao} p-5 md:p-8`}>
            <form
              method="get"
              action={base}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
            >
              {CHAVES.map((k) => sp[k] && <input key={k} type="hidden" name={k} value={sp[k]} />)}
              <label className="block">
                <span className={rotuloCampo}>Desde</span>
                <input type="datetime-local" name="rd" defaultValue={sp.rd} required className={campo} />
              </label>
              <label className="block">
                <span className={rotuloCampo}>Até</span>
                <input type="datetime-local" name="rf" defaultValue={sp.rf} required className={campo} />
              </label>
              <button className={`${botaoEscuro} sm:col-span-2 lg:col-span-1`}>Ver relatório</button>
            </form>

            {erroRelatorio && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-base text-red-700"
              >
                {erroRelatorio}
              </p>
            )}

            {relatorio && (
              <ModalBalanco
                fecharHref={href({ rd: undefined, rf: undefined })}
                excelHref={`/api/laravel/operations/${id}/reports/confirmed?de=${encodeURIComponent(sp.rd!)}&ate=${encodeURIComponent(sp.rf!)}&formato=xlsx`}
              >
                <BalancoConfirmados
                  relatorio={relatorio}
                  navio={op.navio}
                  empresa={op.empresa}
                  de={sp.rd!}
                  ate={sp.rf!}
                  geradoEm={geradoEm}
                />
              </ModalBalanco>
            )}
          </div>
        </section>

        {/* Camiões */}
        <section className="space-y-5">
          <Titulo>Camiões</Titulo>

          {/* Separadores: numa linha com scroll no telemóvel, quebram linha a partir do tablet */}
          <nav
            aria-label="Filtrar por estado"
            className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 ${semBarra}`}
          >
            {abas.map((a) => {
              const ativa = (sp.st ?? '') === a.valor;
              return (
                <Link
                  key={a.valor || 'todos'}
                  href={href({ st: a.valor || undefined, pagina: undefined })}
                  aria-current={ativa ? 'page' : undefined}
                  className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-base font-medium transition active:scale-[0.97] md:h-12 md:px-5 ${focoVisivel} ${
                    ativa
                      ? 'border-accent bg-accent text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
                  }`}
                >
                  {a.rotulo}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                      ativa ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {a.n}
                  </span>
                </Link>
              );
            })}
          </nav>

          <form method="get" action={base} className="space-y-4">
            {sp.st && <input type="hidden" name="st" value={sp.st} />}
            {sp.rd && <input type="hidden" name="rd" value={sp.rd} />}
            {sp.rf && <input type="hidden" name="rf" value={sp.rf} />}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <IconeLupa />
                <input
                  type="search"
                  name="q"
                  defaultValue={sp.q}
                  placeholder="Pesquisar matrícula, motorista ou guia"
                  aria-label="Pesquisar camiões"
                  className={`${campo} pl-12`}
                />
              </div>
              <button className={botaoEscuro}>Pesquisar</button>
            </div>

            <details className={`group ${cartao} px-4 py-2 md:px-5`} open={filtrosAvancados}>
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-base font-medium text-slate-700 [&::-webkit-details-marker]:hidden">
                <span>
                  Mais filtros
                  <span className="ml-2 hidden text-sm font-normal text-slate-500 group-open:hidden sm:inline">
                    Transportadora, atrelado e datas
                  </span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pb-3 pt-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
                <label className="block">
                  <span className={rotuloCampo}>Transportadora</span>
                  <select name="tr" defaultValue={sp.tr ?? ''} className={campo}>
                    <option value="">Todas</option>
                    {lista.transportadoras.map((t) => (
                      <option key={String(t)} value={String(t)}>
                        {String(t)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={rotuloCampo}>Atrelado</span>
                  <select name="at" defaultValue={sp.at ?? ''} className={campo}>
                    <option value="">Todos</option>
                    <option value="normal">Normal</option>
                    <option value="link">Link</option>
                  </select>
                </label>
                <label className="block">
                  <span className={rotuloCampo}>De</span>
                  <input type="date" name="de" defaultValue={sp.de} className={campo} />
                </label>
                <label className="block">
                  <span className={rotuloCampo}>Até</span>
                  <input type="date" name="ate" defaultValue={sp.ate} className={campo} />
                </label>
              </div>
            </details>

            {filtrado && (
              <Link
                href={base}
                className={`inline-flex h-11 items-center rounded-full border border-slate-200 bg-white px-5 text-base font-medium text-accent shadow-sm transition hover:bg-slate-50 active:scale-[0.98] ${focoVisivel}`}
              >
                Limpar filtros
              </Link>
            )}
          </form>

          {/* Contagem e legenda dos ícones */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-base tabular-nums text-slate-600" aria-live="polite">
              {meta.total === 0
                ? filtrado
                  ? 'Nenhum camião corresponde aos filtros.'
                  : 'Ainda não há camiões registados.'
                : `A mostrar ${de}–${ate} de ${meta.total}`}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
              <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <IconeCamiao tipo="normal" tamanho={20} />
                Atrelado normal
              </span>
              <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <IconeCamiao tipo="link" tamanho={20} />
                Atrelado link
              </span>
            </div>
          </div>

          {/* Camiões: uma linha por camião, empilhadas */}
          <ul className="space-y-3">
            {lista.data.map((d) => (
              <LinhaCamiao
                key={d.id}
                camiao={d}
                operacaoId={op.id}
                podeEditar={podeEditar}
                editarHref={`${base}/camioes/${d.id}/editar`}
                icone={<IconeCamiao tipo={d.tipo_atrelado} tamanho={26} />}
              />
            ))}
          </ul>

          {/* Paginação */}
          {meta.ultima > 1 && (
            <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-2 pt-4 sm:gap-3">
              {meta.pagina > 1 ? (
                <Link href={href({ pagina: String(meta.pagina - 1) })} className={botaoPagina}>
                  Anterior
                </Link>
              ) : (
                <span className={botaoPaginaOff} aria-disabled="true">
                  Anterior
                </span>
              )}

              {/* Telemóvel: só "x / y". A partir de sm: números. */}
              <span className="px-2 text-base font-medium tabular-nums text-slate-600 sm:hidden">
                {meta.pagina} / {meta.ultima}
              </span>

              <div className="hidden items-center gap-2 sm:flex sm:gap-3">
                {paginas(meta.pagina, meta.ultima).map((n, i) =>
                  n === '...' ? (
                    <span key={`e${i}`} className="px-1 text-slate-400" aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <Link
                      key={n}
                      href={href({ pagina: n === 1 ? undefined : String(n) })}
                      aria-current={n === meta.pagina ? 'page' : undefined}
                      className={`flex h-12 min-w-12 items-center justify-center rounded-xl border px-3 text-base font-medium tabular-nums transition active:scale-[0.97] md:h-14 md:min-w-14 ${focoVisivel} ${
                        n === meta.pagina
                          ? 'border-accent bg-accent text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
                      }`}
                    >
                      {n}
                    </Link>
                  ),
                )}
              </div>

              {meta.pagina < meta.ultima ? (
                <Link href={href({ pagina: String(meta.pagina + 1) })} className={botaoPagina}>
                  Seguinte
                </Link>
              ) : (
                <span className={botaoPaginaOff} aria-disabled="true">
                  Seguinte
                </span>
              )}
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
EOF

echo "Atualizado: $DESTINO (cópia de segurança em $DESTINO.bak)"
