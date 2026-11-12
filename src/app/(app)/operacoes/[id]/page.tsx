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
  'h-12 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-red-200';

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

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Link
          href={`/operacoes/${op.id}/novo`}
          className="flex h-16 items-center justify-center gap-2 rounded-xl bg-accent text-lg font-semibold text-white shadow-sm active:opacity-90"
        >
          <Icon name="plus" />
          Registar novo camião
        </Link>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#e9ecef] bg-white p-4">
            <div className="text-xs text-gray-500">Recebido</div>
            <div className="text-lg font-bold text-slate-800">{fmt(op.recebido_ton, 1)} t</div>
            <div className="text-xs text-gray-400">de {fmt(op.esperado_ton, 1)} t ({pct}%)</div>
          </div>
          <div className="rounded-xl border border-[#e9ecef] bg-white p-4">
            <div className="text-xs text-gray-500">Camiões</div>
            <div className="text-lg font-bold text-slate-800">{op.camioes_count}</div>
          </div>
          <div className="rounded-xl border border-[#e9ecef] bg-white p-4">
            <div className="text-xs text-gray-500">Por confirmar</div>
            <div className={`text-lg font-bold ${op.pendentes_count > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{op.pendentes_count}</div>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-gray-500">Plano por produto</h2>
          {op.items.map((it) => {
            const p = it.plano > 0 ? Math.min(100, Math.round((it.registado / it.plano) * 100)) : 0;
            return (
              <div key={it.id} className="rounded-xl border border-[#e9ecef] bg-white p-4">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold text-slate-800">{it.nome}</span>
                  <span className="text-sm text-slate-600">
                    {fmt(it.registado)} / {fmt(it.plano)} {it.unidade_label}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-md bg-[#f1f3f5]">
                  <div className="h-full rounded-md bg-gradient-to-r from-[#1a56db] to-[#0dcaf0]" style={{ width: `${p}%` }} />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Saldo por lançar: {fmt(it.saldo)} {it.unidade_label}
                </p>
              </div>
            );
          })}
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-gray-500">
            Camiões lançados ({contagens.todos})
          </h2>

          <div className="flex flex-wrap gap-2">
            {abas.map((a) => {
              const ativa = (sp.st ?? '') === a.valor;
              return (
                <Link
                  key={a.valor || 'todos'}
                  href={href({ st: a.valor || undefined, pagina: undefined })}
                  className={`flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium ${
                    ativa ? 'border-accent bg-accent text-white' : 'border-gray-300 bg-white text-gray-700 active:bg-gray-100'
                  }`}
                >
                  {a.rotulo}
                  <span className={`rounded-full px-2 text-xs ${ativa ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>{a.n}</span>
                </Link>
              );
            })}
          </div>

          <form method="get" action={base} className="space-y-3 rounded-xl border border-[#e9ecef] bg-white p-4">
            {sp.st && <input type="hidden" name="st" value={sp.st} />}
            <div className="flex gap-2">
              <input
                name="q"
                defaultValue={sp.q}
                placeholder="Pesquisar matrícula, motorista, guia ou transportadora"
                className={campo}
              />
              <button className="h-12 shrink-0 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white active:opacity-90">
                Pesquisar
              </button>
            </div>

            <details open={filtrosAvancados} className="group">
              <summary className="flex h-11 cursor-pointer list-none items-center text-sm font-medium text-gray-600">
                Mais filtros
                <span className="ml-2 text-xs text-gray-400 group-open:hidden">(transportadora, atrelado, datas)</span>
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Transportadora</span>
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
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Atrelado</span>
                  <select name="at" defaultValue={sp.at ?? ''} className={campo}>
                    <option value="">Todos</option>
                    <option value="normal">Normal</option>
                    <option value="link">Link</option>
                    <option value="nd">Não definido</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Por página</span>
                  <select name="pp" defaultValue={sp.pp ?? '15'} className={campo}>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="50">50</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">De</span>
                  <input type="date" name="de" defaultValue={sp.de} className={campo} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Até</span>
                  <input type="date" name="ate" defaultValue={sp.ate} className={campo} />
                </label>
                <div className="flex items-end">
                  <button className="h-12 w-full rounded-lg border border-slate-900 text-sm font-semibold text-slate-900 active:bg-gray-100">
                    Aplicar filtros
                  </button>
                </div>
              </div>
            </details>

            {filtrado && (
              <Link href={base} className="inline-flex h-10 items-center text-sm font-medium text-accent underline">
                Limpar todos os filtros
              </Link>
            )}
          </form>

          <p className="text-sm text-gray-500">
            {meta.total === 0
              ? filtrado
                ? 'Nenhum camião corresponde aos filtros.'
                : 'Ainda não há camiões registados.'
              : `A mostrar ${meta.de}-${meta.ate} de ${meta.total}${filtrado ? ' (filtrado)' : ''}`}
          </p>

          <ul className="space-y-3">
            {lista.data.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl border border-[#e9ecef] bg-white p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-slate-800">{d.matricula}</span>
                    <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${STATUS_COLOR[d.status]}`}>
                      {STATUS_LABEL[d.status]}
                    </span>
                  </div>
                  <p className="truncate text-sm text-slate-700">
                    {d.motorista} · {d.transportadora}
                  </p>
                  <p className="text-xs text-gray-500">
                    Guia {d.numero_guia} · {d.data}
                    {d.hora_saida_porto ? ` ${d.hora_saida_porto}` : ''}
                    {d.tipo_atrelado ? ` · atrelado ${d.tipo_atrelado}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {d.total_sacos} sacos · estimado {fmt(d.peso_total_estimado / 1000)} t
                  </p>
                </div>
                <Link
                  href={`/operacoes/${op.id}/camioes/${d.id}`}
                  aria-label={`Ver ticket do camião ${d.matricula}`}
                  title="Ver ticket"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 active:bg-gray-100"
                >
                  <Icon name="eye" className="h-6 w-6" />
                </Link>
              </li>
            ))}
          </ul>

          {meta.ultima > 1 && (
            <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {meta.pagina > 1 ? (
                <Link href={href({ pagina: String(meta.pagina - 1) })} className="flex h-12 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium active:bg-gray-100">
                  Anterior
                </Link>
              ) : (
                <span className="flex h-12 items-center rounded-lg border border-gray-200 px-4 text-sm text-gray-300">Anterior</span>
              )}

              {paginas(meta.pagina, meta.ultima).map((n, i) =>
                n === '...' ? (
                  <span key={`e${i}`} className="px-1 text-gray-400">
                    ...
                  </span>
                ) : (
                  <Link
                    key={n}
                    href={href({ pagina: n === 1 ? undefined : String(n) })}
                    aria-current={n === meta.pagina ? 'page' : undefined}
                    className={`flex h-12 min-w-12 items-center justify-center rounded-lg border px-3 text-sm font-medium ${
                      n === meta.pagina ? 'border-accent bg-accent text-white' : 'border-gray-300 bg-white active:bg-gray-100'
                    }`}
                  >
                    {n}
                  </Link>
                ),
              )}

              {meta.pagina < meta.ultima ? (
                <Link href={href({ pagina: String(meta.pagina + 1) })} className="flex h-12 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium active:bg-gray-100">
                  Seguinte
                </Link>
              ) : (
                <span className="flex h-12 items-center rounded-lg border border-gray-200 px-4 text-sm text-gray-300">Seguinte</span>
              )}
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
