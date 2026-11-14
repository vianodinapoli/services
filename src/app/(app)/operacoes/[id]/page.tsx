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

/** Camião com um reboque (atrelado normal) ou com dois reboques (atrelado link). */
function IconeCamiao({ tipo, tamanho = 20 }: { tipo?: string | null; tamanho?: number }) {
  const link = tipo === 'link';
  const cor = link ? 'text-red-600' : tipo === 'normal' ? 'text-blue-700' : 'text-slate-400';
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

  const abas = [
    { valor: '', rotulo: 'Todos', n: contagens.todos },
    { valor: 'in_transit', rotulo: 'Em trânsito', n: contagens.in_transit },
    { valor: 'weighing', rotulo: 'A pesar', n: contagens.weighing },
    { valor: 'confirmed', rotulo: 'Confirmados', n: contagens.confirmed },
  ];

  const por = (meta as any).por_pagina ?? lista.data.length;
  const de = (meta.pagina - 1) * por + 1;
  const ate = (meta.pagina - 1) * por + lista.data.length;

  return (
    <>
      <PageHeader title={op.navio} subtitle={op.empresa} back="/operacoes" />
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div className="space-y-8 px-4 md:px-6 xl:px-8">
        <Link
          href={`${base}/camioes/novo`}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-6 text-base font-semibold text-white shadow-sm hover:opacity-95 active:opacity-90"
        >
          <Icon name="plus" />
          Registar novo camião
        </Link>

        {/* Resumo */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`${cartao} p-6`}>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recebido</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{fmt(op.recebido_ton, 1)} t</span>
              <span className="text-sm font-semibold text-slate-500">{pct}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-[#1a56db] to-[#0dcaf0]" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 text-xs text-slate-500">de {fmt(op.esperado_ton, 1)} t esperadas</div>
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
                    <span className="text-sm font-semibold text-slate-700">
                      {fmt(it.registado)} / {fmt(it.plano)} {it.unidade_label}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
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
          <h2 className={tituloSecao}>Camiões</h2>

          <div className="flex flex-wrap gap-2">
            {abas.map((a) => {
              const ativa = (sp.st ?? '') === a.valor;
              return (
                <Link
                  key={a.valor || 'todos'}
                  href={href({ st: a.valor || undefined, pagina: undefined })}
                  className={`flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition ${
                    ativa
                      ? 'border-accent bg-accent text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {a.rotulo}
                  <span className={`text-xs ${ativa ? 'text-white/80' : 'text-slate-500'}`}>{a.n}</span>
                </Link>
              );
            })}
          </div>

          <form method="get" action={base} className="space-y-4">
            {sp.st && <input type="hidden" name="st" value={sp.st} />}
            <div className="flex gap-3">
              <input
                type="search"
                name="q"
                defaultValue={sp.q}
                placeholder="Pesquisar matrícula, motorista ou guia"
                className={campo}
              />
              <button className="h-12 shrink-0 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800 active:opacity-90">
                Pesquisar
              </button>
            </div>

            <details className="group rounded-xl border border-slate-200 bg-white p-4" open={filtrosAvancados}>
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                Mais filtros
                <span className="ml-2 text-xs font-normal text-slate-500 group-open:hidden">
                  (transportadora, atrelado, datas)
                </span>
              </summary>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
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
              : `A mostrar ${de}–${ate} de ${meta.total}`}
          </p>

          {/* Legenda dos ícones */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-2">
              <IconeCamiao tipo="normal" tamanho={18} />
              Atrelado normal
            </span>
            <span className="flex items-center gap-2">
              <IconeCamiao tipo="link" tamanho={18} />
              Atrelado link
            </span>
          </div>

          {/* Telemóvel: cartões */}
          <ul className="space-y-3 md:hidden">
            {lista.data.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                    <IconeCamiao tipo={d.tipo_atrelado} tamanho={28} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
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

                <dl className="grid grid-cols-2 gap-3">
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
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Atrelado</dt>
                    <dd className="mt-1 text-[15px] font-semibold capitalize text-slate-900">
                      {d.tipo_atrelado ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Sacos</dt>
                    <dd className="mt-1 text-[15px] font-semibold text-slate-900">{d.total_sacos}</dd>
                  </div>
                </dl>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900">
                      {fmt(d.peso_total_estimado, 1)} t
                    </div>
                    <div className="text-xs font-medium text-slate-500">estimado</div>
                  </div>
                  <Link
                    href={`/operacoes/${op.id}/camioes/${d.id}`}
                    aria-label={`Ver ticket do camião ${d.matricula}`}
                    title="Ver ticket"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <Icon name="eye" className="h-6 w-6" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {/* Tablet e ecrã grande: tabela (cabe sempre no cartão, sem rolar) */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full table-fixed text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr className="h-10">
                  <th className="w-[30%] px-3 xl:w-[24%] xl:px-4">Matrícula</th>
                  <th className="w-[26%] px-3 xl:w-[22%] xl:px-4">Motorista · transportadora</th>
                  <th className="w-[14%] px-3 xl:w-[11%] xl:px-4">Guia</th>
                  <th className="hidden w-[15%] px-3 lg:table-cell xl:px-4">Data e hora</th>
                  <th className="hidden w-[8%] px-3 xl:table-cell xl:px-4">Atrelado</th>
                  <th className="w-[9%] px-3 text-right xl:w-[7%] xl:px-4">Sacos</th>
                  <th className="w-[11%] px-3 text-right xl:w-[9%] xl:px-4">Estimado</th>
                  <th className="w-20 px-3 text-center xl:px-4">
                    <span className="sr-only">Ver</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lista.data.map((d) => (
                  <tr key={d.id} className="h-16 hover:bg-slate-50">
                    <td className="px-3 xl:px-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex w-10 shrink-0 justify-center">
                          <IconeCamiao tipo={d.tipo_atrelado} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-900">{d.matricula}</div>
                          <span
                            className={`mt-0.5 inline-block rounded-full px-2 text-[10px] font-semibold leading-5 ${STATUS_COLOR[d.status]}`}
                          >
                            {STATUS_LABEL[d.status]}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 text-slate-600 xl:px-4">
                      <div className="truncate" title={`${d.motorista} · ${d.transportadora}`}>
                        {d.motorista} · {d.transportadora}
                      </div>
                    </td>
                    <td className="px-3 font-semibold text-slate-900 xl:px-4">
                      <div className="truncate">{d.numero_guia}</div>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 text-slate-600 lg:table-cell xl:px-4">
                      {d.data}
                      {d.hora_saida_porto ? ` ${d.hora_saida_porto}` : ''}
                    </td>
                    <td className="hidden px-3 capitalize text-slate-700 xl:table-cell xl:px-4">
                      {d.tipo_atrelado ?? '—'}
                    </td>
                    <td className="px-3 text-right font-semibold text-slate-900 xl:px-4">{d.total_sacos}</td>
                    <td className="whitespace-nowrap px-3 text-right font-semibold text-slate-900 xl:px-4">
                      {fmt(d.peso_total_estimado, 1)} t
                    </td>
                    <td className="px-3 text-center xl:px-4">
                      <Link
                        href={`/operacoes/${op.id}/camioes/${d.id}`}
                        aria-label={`Ver ticket do camião ${d.matricula}`}
                        title="Ver ticket"
                        className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        <Icon name="eye" className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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