import { Suspense } from 'react';
import Link from 'next/link';
import { laravel } from '@/lib/laravel';
import PageHeader from '@/components/PageHeader';
import FlashToast from '@/components/FlashToast';
import { Icon } from '@/components/icons';
import { fmt, STATUS_COLOR, STATUS_LABEL, type DischargeList, type Operation } from '@/lib/laravel-types';

type SP = Record<string, string | undefined>;
const CHAVES = ['q', 'st', 'tr', 'at', 'de', 'ate', 'pp'];

const campo =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-red-200';

const rotuloCampo = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500';

const cartao = 'rounded-2xl border border-slate-200 bg-white shadow-sm';

const tituloSecao = 'font-display text-sm font-bold uppercase tracking-wider text-slate-500';

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
    if (sp[k]) api.set(k, sp[k]!);
  });
  api.set('page', String(pagina));

  const [op, lista] = await Promise.all([
    laravel<Operation>(`/operations/${id}`),
    laravel<DischargeList>(`/operations/${id}/discharges?${api.toString()}`),
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
  const { meta, contagens } = lista;
  const filtrosAvancados = !!(sp.tr || sp.at || sp.de || sp.ate);
  const filtrado = !!(sp.q || sp.st || filtrosAvancados);

  const abas: { valor: string; rotulo: string; n: number }[] = [
    { valor: '', rotulo: 'Todos', n: contagens.todos },
    { valor: 'por_confirmar', rotulo: 'Por confirmar', n: contagens.por_confirmar },
    { valor: 'weighing', rotulo: 'A pesar', n: contagens.weighing },
    { valor: 'confirmed', rotulo: 'Confirmados', n: contagens.confirmed },
  ];

  return (
    <>
      <PageHeader title={op.navio} subtitle={op.empresa} back="/operacoes" />
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
        {/* Ação principal */}
        <Link
          href={`/operacoes/${op.id}/novo`}
          className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-accent text-lg font-semibold text-white shadow-md transition hover:opacity-95 active:opacity-90"
        >
          <Icon name="plus" />
          Registar novo camião
        </Link>

        {/* Resumo */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={`${cartao} p-6`}>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recebido</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{fmt(op.recebido_ton, 1)} t</span>
              <span className="text-sm font-semibold text-sky-700">{pct}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-[#1a56db] to-[#0dcaf0]" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 text-xs text-slate-500">de {fmt(op.esperado_ton, 1)} t esperadas</div>
          </div>

          <div className={`${cartao} p-6`}>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Camiões</div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{op.camioes_count}</div>
            <div className="mt-3 text-xs text-slate-500">registados nesta operação</div>
          </div>

          <div className={`${cartao} p-6`}>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Por confirmar</div>
            <div
              className={`mt-2 text-3xl font-bold tracking-tight ${op.pendentes_count > 0 ? 'text-amber-600' : 'text-slate-900'}`}
            >
              {op.pendentes_count}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {op.pendentes_count > 0 ? 'a aguardar confirmação' : 'tudo confirmado'}
            </div>
          </div>
        </div>

        {/* Plano por produto */}
        <section className="space-y-4">
          <h2 className={tituloSecao}>Plano por produto</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {op.items.map((it) => {
              const p = it.plano > 0 ? Math.min(100, Math.round((it.registado / it.plano) * 100)) : 0;
              return (
                <div key={it.id} className={`${cartao} p-5`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-base font-bold text-slate-900">{it.nome}</span>
                    <span className="shrink-0 rounded-full bg-sky-100 px-3 py-0.5 text-xs font-semibold text-sky-800">{p}%</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {fmt(it.registado)} / {fmt(it.plano)} {it.unidade_label}
                  </p>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1a56db] to-[#0dcaf0]"
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Saldo por lançar: {fmt(it.saldo)} {it.unidade_label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Camiões */}
        <section className="space-y-4">
          <h2 className={tituloSecao}>Camiões lançados ({contagens.todos})</h2>

          {/* Abas */}
          <div className="flex flex-wrap gap-2">
            {abas.map((a) => {
              const ativa = (sp.st ?? '') === a.valor;
              return (
                <Link
                  key={a.valor || 'todos'}
                  href={href({ st: a.valor || undefined, pagina: undefined })}
                  className={`flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition ${
                    ativa
                      ? 'border-accent bg-accent text-white shadow-sm'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                  }`}
                >
                  {a.rotulo}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${ativa ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {a.n}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Pesquisa e filtros */}
          <form method="get" action={base} className={`${cartao} space-y-3 p-5`}>
            {sp.st && <input type="hidden" name="st" value={sp.st} />}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                name="q"
                defaultValue={sp.q}
                placeholder="Pesquisar matrícula, motorista, guia ou transportadora"
                className={campo}
              />
              <button className="h-12 shrink-0 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800 active:opacity-90">
                Pesquisar
              </button>
            </div>

            <details open={filtrosAvancados} className="group">
              <summary className="flex h-11 cursor-pointer list-none items-center text-sm font-semibold text-slate-700">
                Mais filtros
                <span className="ml-2 text-xs font-normal text-slate-500 group-open:hidden">
                  (transportadora, atrelado, datas)
                </span>
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-3">
                <label className="block">
                  <span className={rotuloCampo}>Transportadora</span>
                  <select name="tr" defaultValue={sp.tr ?? ''} className={campo}>
                    <option value="">Todas</option>
                    {lista.transportadoras.map((t) => (
                      <option key={t} value={t}>
                        {t}
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
                    <option value="nd">Não definido</option>
                  </select>
                </label>
                <label className="block">
                  <span className={rotuloCampo}>Por página</span>
                  <select name="pp" defaultValue={sp.pp ?? '15'} className={campo}>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="50">50</option>
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
                <div className="flex items-end">
                  <button className="h-12 w-full rounded-xl border border-slate-900 text-sm font-semibold text-slate-900 hover:bg-slate-50 active:bg-slate-100">
                    Aplicar filtros
                  </button>
                </div>
              </div>
            </details>

            {filtrado && (
              <Link href={base} className="inline-flex h-10 items-center text-sm font-semibold text-accent underline">
                Limpar todos os filtros
              </Link>
            )}
          </form>

          <p className="text-sm text-slate-600">
            {meta.total === 0
              ? filtrado
                ? 'Nenhum camião corresponde aos filtros.'
                : 'Ainda não há camiões registados.'
              : `A mostrar ${meta.de}-${meta.ate} de ${meta.total}${filtrado ? ' (filtrado)' : ''}`}
          </p>

          {/* Lista de camiões */}
          <ul className="space-y-3">
            {lista.data.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:flex-row md:items-center md:gap-8 md:px-8 md:py-6"
              >
                {/* Identificação */}
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 sm:flex">
                    <svg
                      aria-hidden="true"
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                      <path d="M15 18H9" />
                      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                      <circle cx="17" cy="18" r="2" />
                      <circle cx="7" cy="18" r="2" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xl font-bold tracking-tight text-slate-900">{d.matricula}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[d.status]}`}>
                        {STATUS_LABEL[d.status]}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[15px] text-slate-600">
                      {d.motorista} · {d.transportadora}
                    </p>
                  </div>
                </div>

                <div className="hidden h-16 w-px bg-slate-200 md:block" />

                {/* Dados da guia */}
                <dl className="flex flex-wrap gap-x-10 gap-y-3 md:flex-1">
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Guia</dt>
                    <dd className="mt-1 text-[15px] font-semibold text-slate-900">{d.numero_guia}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Data e hora</dt>
                    <dd className="mt-1 text-[15px] font-semibold text-slate-900">
                      {d.data}
                      {d.hora_saida_porto ? ` ${d.hora_saida_porto}` : ''}
                    </dd>
                  </div>
                  {d.tipo_atrelado && (
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Atrelado</dt>
                      <dd className="mt-1 text-[15px] font-semibold capitalize text-slate-900">{d.tipo_atrelado}</dd>
                    </div>
                  )}
                </dl>

                <div className="hidden h-16 w-px bg-slate-200 md:block" />

                {/* Quantidades */}
                <div className="flex gap-9">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900">{d.total_sacos}</div>
                    <div className="mt-1 text-xs font-medium text-slate-500">sacos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900">
                      {fmt(d.peso_total_estimado / 1000)} t
                    </div>
                    <div className="mt-1 text-xs font-medium text-slate-500">estimado</div>
                  </div>
                </div>

                {/* Ação */}
                <Link
                  href={`/operacoes/${op.id}/camioes/${d.id}`}
                  aria-label={`Ver ticket do camião ${d.matricula}`}
                  title="Ver ticket"
                  className="flex h-14 w-14 shrink-0 items-center justify-center self-end rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 md:self-auto"
                >
                  <Icon name="eye" className="h-6 w-6" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Paginação */}
          {meta.ultima > 1 && (
            <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {meta.pagina > 1 ? (
                <Link
                  href={href({ pagina: String(meta.pagina - 1) })}
                  className="flex h-12 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                >
                  Anterior
                </Link>
              ) : (
                <span className="flex h-12 items-center rounded-xl border border-slate-200 px-5 text-sm text-slate-300">
                  Anterior
                </span>
              )}

              {paginas(meta.pagina, meta.ultima).map((n, i) =>
                n === '...' ? (
                  <span key={`e${i}`} className="px-1 text-slate-400">
                    ...
                  </span>
                ) : (
                  <Link
                    key={n}
                    href={href({ pagina: n === 1 ? undefined : String(n) })}
                    aria-current={n === meta.pagina ? 'page' : undefined}
                    className={`flex h-12 min-w-12 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${
                      n === meta.pagina
                        ? 'border-accent bg-accent text-white shadow-sm'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                    }`}
                  >
                    {n}
                  </Link>
                ),
              )}

              {meta.pagina < meta.ultima ? (
                <Link
                  href={href({ pagina: String(meta.pagina + 1) })}
                  className="flex h-12 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                >
                  Seguinte
                </Link>
              ) : (
                <span className="flex h-12 items-center rounded-xl border border-slate-200 px-5 text-sm text-slate-300">
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