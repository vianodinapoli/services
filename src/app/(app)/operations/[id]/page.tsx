import { Suspense } from 'react';
import Link from 'next/link';
import { laravel } from '@/lib/laravel';
import PageHeader from '@/components/PageHeader';
import FlashToast from '@/components/FlashToast';
import AutoRefresh from '@/components/AutoRefresh';
import { Icon } from '@/components/icons';
import { fmt, STATUS_COLOR, STATUS_LABEL, type DischargeList, type Operation } from '@/lib/laravel-types';

type SP = Record<string, string | undefined>;
const CHAVES = ['q', 'st', 'tr', 'at', 'de', 'ate', 'pp'];

// Telemóvel (<768px): tamanhos originais, camiões em cartões
// Tablet e ecrã grande (≥768px): topo compacto e camiões em tabela de linhas finas
const campo =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-red-200 md:h-10 xl:h-12';

const rotuloCampo =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 md:mb-1 xl:mb-1.5';

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
        // ASSUMIDO: desenho reconstruído (o original estava corrompido)
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
  for (let n = ini; n <= fim; n++) out.push(n);
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
  const pagina = Math.max(1, Number(sp.pagina) || 1);

  const qs = new URLSearchParams();
  for (const k of CHAVES) {
    const v = sp[k];
    if (v) qs.set(k, v);
  }
  qs.set('pagina', String(pagina));

  const [op, lista] = await Promise.all([
    laravel<Operation>(`/operations/${id}`),
    // ASSUMIDO: endpoint da lista de descargas — ajuste se for outro
    laravel<DischargeList>(`/operations/${id}/discharges?${qs.toString()}`),
  ]);

  const meta = lista.meta;
  const base = `/operations/${id}`;

  // Constrói um link mantendo os filtros actuais e sobrepondo os indicados
  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const k of CHAVES) {
      if (sp[k]) p.set(k, sp[k] as string);
    }
    for (const [k, v] of Object.entries(over)) {
      if (v === undefined) p.delete(k);
      else p.set(k, v);
    }
    const s = p.toString();
    return s ? `${base}?${s}` : base;
  };

  // ASSUMIDO: opções do filtro de estado
  const estados = Object.entries(STATUS_LABEL);

  return (
    <>
      {/* ASSUMIDO: props do PageHeader — ajuste ao componente real */}
      <PageHeader title={(op as any).nome ?? `Operação ${id}`} />
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
      <AutoRefresh />

      <div className="space-y-6">
        {/* Filtros */}
        <section className={`${cartao} p-5 md:p-3 xl:p-5`}>
          <h2 className={`${tituloSecao} mb-4 md:mb-2 xl:mb-4`}>Filtros</h2>
          <form method="get" action={base} className="grid gap-4 md:grid-cols-4 md:gap-3 xl:gap-4">
            <div>
              <label htmlFor="q" className={rotuloCampo}>Pesquisa</label>
              <input id="q" name="q" defaultValue={sp.q} placeholder="Matrícula, motorista, guia" className={campo} />
            </div>
            <div>
              <label htmlFor="st" className={rotuloCampo}>Estado</label>
              <select id="st" name="st" defaultValue={sp.st ?? ''} className={campo}>
                <option value="">Todos</option>
                {estados.map(([k, v]) => (
                  <option key={k} value={k}>{String(v)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tr" className={rotuloCampo}>Transportadora</label>
              <input id="tr" name="tr" defaultValue={sp.tr} className={campo} />
            </div>
            <div>
              <label htmlFor="at" className={rotuloCampo}>Atrelado</label>
              <select id="at" name="at" defaultValue={sp.at ?? ''} className={campo}>
                <option value="">Todos</option>
                <option value="normal">Normal</option>
                <option value="link">Link</option>
              </select>
            </div>
            <div>
              <label htmlFor="de" className={rotuloCampo}>De</label>
              <input id="de" name="de" type="date" defaultValue={sp.de} className={campo} />
            </div>
            <div>
              <label htmlFor="ate" className={rotuloCampo}>Até</label>
              <input id="ate" name="ate" type="date" defaultValue={sp.ate} className={campo} />
            </div>
            <div>
              <label htmlFor="pp" className={rotuloCampo}>Por página</label>
              <select id="pp" name="pp" defaultValue={sp.pp ?? '20'} className={campo}>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="h-12 rounded-xl bg-accent px-5 text-sm font-semibold text-white md:h-10 xl:h-12"
              >
                Filtrar
              </button>
              <Link
                href={base}
                className="flex h-12 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:h-10 xl:h-12"
              >
                Limpar
              </Link>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <h2 className={tituloSecao}>Camiões ({meta.total})</h2>

          {/* Camiões no telemóvel: cartões */}
          <ul className="space-y-3 md:hidden">
            {lista.data.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 sm:flex">
                    <IconeCamiao tipo={d.tipo_atrelado} tamanho={30} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xl font-bold tracking-tight text-slate-900">{d.matricula}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[d.status]}`}>
                        {STATUS_LABEL[d.status]}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[15px] text-slate-600">
                      {/* ASSUMIDO: segundo campo depois do motorista */}
                      {d.motorista} · {(d as any).transportadora}
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-y-3">
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Guia</dt>
                    <dd className="mt-1 text-[15px] font-semibold text-slate-900">{d.numero_guia}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Atrelado</dt>
                    <dd className="mt-1 text-[15px] font-semibold capitalize text-slate-900">
                      {d.tipo_atrelado ?? '—'}
                    </dd>
                  </div>
                </dl>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-500">Sacos</div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900">{d.total_sacos}</div>
                  </div>
                  <Link
                    href={`${base}/${d.id}`}
                    aria-label="Ver"
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <Icon name="eye" className="h-6 w-6" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {/* Camiões no tablet e ecrã grande: tabela de linhas finas */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr className="h-10">
                  <th className="px-3 xl:px-4">Matrícula</th>
                  <th className="px-3 xl:px-4">Motorista</th>
                  <th className="px-3 xl:px-4">Guia</th>
                  <th className="px-3 xl:px-4">Atrelado</th>
                  <th className="px-3 text-right xl:px-4">Sacos</th>
                  <th className="w-10 px-3 xl:px-4">
                    <span className="sr-only">Ver</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lista.data.map((d) => (
                  <tr key={d.id} className="h-10 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-3 xl:px-4">
                      <div className="flex items-center gap-2">
                        <span className="flex w-9 shrink-0 justify-center">
                          <IconeCamiao tipo={d.tipo_atrelado} />
                        </span>
                        <span className="font-bold text-slate-900">{d.matricula}</span>
                        <span
                          className={`rounded-full px-2 text-[10px] font-semibold leading-5 ${STATUS_COLOR[d.status]}`}
                        >
                          {STATUS_LABEL[d.status]}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 text-slate-600 xl:px-4">
                      <div className="max-w-[160px] truncate lg:max-w-[240px] xl:max-w-none">{d.motorista}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 font-semibold text-slate-900 xl:px-4">
                      {d.numero_guia}
                    </td>
                    <td className="whitespace-nowrap px-3 capitalize text-slate-700 xl:px-4">
                      {d.tipo_atrelado ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 text-right font-semibold text-slate-900 xl:px-4">
                      {fmt(d.total_sacos)}
                    </td>
                    <td className="px-3 xl:px-4">
                      <Link
                        href={`${base}/${d.id}`}
                        aria-label="Ver"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                      >
                        <Icon name="eye" className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.ultima > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-2 pt-2">
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
                        ? 'border-accent bg-accent text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
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