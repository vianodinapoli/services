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

const campo =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-red-200';

const rotuloCampo = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500';

const cartao = 'rounded-2xl border border-slate-200 bg-white shadow-sm';

const tituloSecao = 'font-display text-sm font-bold uppercase tracking-wider textconst tituloSecao = 'font-display text-sm font-bold u number): (number | '...')[] {
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
    if (sp[k]) api.set(k    if (sp[k]) api.set(k    if (sp[k]) api.set(k    if (sp[k]) api.set(k    if (sp[k]) api.set
                                                                         /operations/${id}/discharges?${api.toString()}`),
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
  const filt  const filt  const filt  const filt  const| sp.ate);
             ado    !(sp.q || sp.st || filtrosAvancados);             ado    !(s: string; r             ado    !(sp.q ||=              ado    !(sp.q || sos             ado    !(sp.q || sp.st || filtrosAvancados);       Por              ado    !(sp.q || sp.stmar },
    { valor: 'weighing', rotulo: 'A pesar', n: contagens.weighing },
    { valor: 'confirmed', rotulo: 'Confirmados', n: contagens.confirmed },
  ];

  return (
    <>
      <PageHeader title={op.navio} subtitle={op.empresa} back="/operacoes" />
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>

      <div clas      <div clas      <div clas     p-      <div clas      <div clas      <div clas     p-      <        <div clas      <di/$      }/      <div clas      <dime="      <div clas      <div clas      r gap-3       <div clas      <div clas      <div clas     p-      <div clas      <div clas      <div clas     p-      <         >
          <Icon name="plus" />
          Registar novo camião
        </Link>

        {/* Resum        {/* Resum        {/* Resum        {/* Resum        {/* Resum        {/* Resum        {/* Resum        {/* Resum        {/* Resum        {/* Resum        {/* Resum        {/* Resum        {/* Resum        {/* Resum        {/* Resum        {/* Resumx items-baseline gap-2">
              <span className="text-3xl font-bold trac              <span className="text-3xl font-bold trac              <span   <span      Name="text-s              <span className="text-3xl font-bold trac              <span cldi              <span className="hi              <span csl              <s        <div className="h-full rounded-full bg-gradient-to-r from-[#1a56db] to-[#0dcaf0]" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 text-xs text-slate-500">de {fmt(op.esperado_ton, 1)} t esperadas</div>
          </div>

          <div className={`${cartao} p-6`}>
            <div className="text-xs f            <div className="tng            <div className="ts</                             <div className="text-xs f            <div className="tng            <div className="ts</                             <div className="text-xs f            <div className="tng            <div className="ts</                             <div className="text-xs f            <div classNaold uppercase tracking-wide text-slate-500">Por confirmar</div>
            <div
              className={`mt-2 text-3xl font-bold tracking-tight ${op.pendentes_count > 0 ? 'text-amber-600' : 'text-slate-900'}`}
            >
              {op.pendentes_count}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {op.pendentes_count > 0 ? 'a aguardar confirmação' : 'tudo confirmado'}
                  
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
                                  e="                                  e="                                  e="                                  e="                                sN                               0">
                                                                           }
                                                                           }
         un         un      -1         un              <div
                                "h-fu                                "h-fu-[#1a56db] to-[#0dcaf0]"
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
        <section className="sp        <section className="sp        <section className="sp        <section className="          <section className="sp        <section className="sp        <section className="sp        <section className="          <section className="sp        <section className="sp        <section className="sp      {        <section className="sp        <section className="sp        <sectio          <section className="sp        <section className="sp        <sect| 'todos'}
                  href={href({ st: a.valor || undefined, pagina: undefined })}
                  className={`flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition ${
                       va                       ?                        va                       ?                                    va                       ?                       iv                                                      >
                  {a.ro                                                       {a.e={`                  {a.ro                                                       {a.e={`                  {a.ro                                                       {a.e={`                  {a.ro                                                       {a.e={`                  {a.ro                                                       {a.e={`                  {a.ro                                                       {a.e={`                  {a.ro                                                ro                  {a.ro                                                      e=                  {a.ro                                                       {a.e={`                  {a.ro          ={campo}
              />
              <button className="h-12 shrink-0 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800 active:opacity-90">
                Pesquisar
              </button>
            </div>


           </div>
ton>
r
sName="h-12 shrink-0 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800 active:opacity-90">
xt-sm font-semibold text-slate-700">
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
                                                                                                                                                                                                          <label className="block">
                           ssName={rotuloCampo}>Atrelado</span>
                  <select name="at" defaultValue={sp.at ?? ''} className={campo}>
                                             ption                           on value="normal">Normal</option>
                    <option value="link">Link</option>
                                                       pti                      </                        <                                                       pti                c                                      an>
                                                       pti          ss                                                       ptiption>
                                                                                                                        </select>
                </label>
                <label className="block">
                  <span className={rotuloCampo}>De</span>
                  <input type="date" name="de" defaultValue={sp.de} className={campo} />
                </label>
                <label className="block">
                  <span className={rotuloCampo}>Até</span>
                  <input typ                  <input typ                  <input typ                  <input typ                  <input cl                  <input typ                  <input la                  <input typ                  <input typ                  <input typ                  <input typ                  <input cl                  <input typ                  <input la                  <iniv>
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
                                                                                          há                     '
                                       {meta                                       {meta                                                       {meta                                       {meta                                                       {meta                                       {meta                                                       {meta                                       {meta                                                       {meta                                       {meta           �o                     <div className="flex min-w-0 flex-1 items-center ga                                       {meta                                       {meta                             te                                                                           dd                                                          {meta   eight="30"
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
                      </span                      </span                                      </span          [1                      </span                                      </span                                                             </span                      </span                                    b                      </span              {/                      </span                      </span                                      </span          [1 <d                      </span                      <-med                      </span                      </d                       <5px] font-semibold text-slate-900">{d.numero_guia}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">Data e hora</dt>
                    <dd className="mt-1 text-[15px] font-semibold text-slate-900">
                      {d.data}
                      {d.hora_saida_porto ? ` ${d.hora_saida_porto}` : ''}
                    </dd>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <div className="mt-1                  um text                                                                                             <div className="text-2xl font-bold tracking-tight text-slate-900">
                      {fmt(d.peso_total_es                      {fmt(d.peso_total_es                      {fmt(d.pass                     nt-medium text-slate-500">estimado</div>
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
                <Link                <Link                <Link                <Link                <Link                <Link                <Link                <Link                <Link         fo                <Link  70                <Linkcti                <Link                          <L                    <Link                <Link                <Li        <span className="flex h-12 items-center rounded-xl border border                <Link              300">
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
                                           ==                                           ==                                           ==                                                  ex h-12 min-w-12 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${
                      n === meta.pagina
                        ? 'border-accent bg-accent text-white shadow-sm'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                    }`}
                  >
                    {n}
                  </Link>
                ),
              )}

              {meta.pagina < meta.ul              {meta.pagin<L              {meta   hr              {na: String(meta.pagina + 1) })}
                  className="flex h-12 items-center rounded-xl bor                  className="flex h-12 items-center rounded-xl bor -700 hover:bg-slate-50 activ                  classN                    cl                    clas                    classNam ) : (
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
