import { fmt, type RelatorioConfirmados } from '@/lib/laravel-types';

/** '2026-11-20T12:30' -> '20/11/2026 12:30' */
function dataHora(v: string) {
  const [d, h = ''] = v.split('T');
  const [a, m, dia] = d.split('-');
  return `${dia}/${m}/${a} ${h.slice(0, 5)}`;
}

function Linha({
  rotulo,
  valor,
  forte,
  tom = 'normal',
}: {
  rotulo: string;
  valor: string | number | null | undefined;
  forte?: boolean;
  tom?: 'normal' | 'alerta' | 'ok';
}) {
  const cor = tom === 'alerta' ? 'text-red-600' : tom === 'ok' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-sm text-slate-600">{rotulo}</span>
      <span
        className={`whitespace-nowrap tabular-nums ${forte ? 'text-base font-bold' : 'text-sm font-semibold'} ${cor}`}
      >
        {valor ?? '—'}
      </span>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <h3 className="border-b border-slate-200 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {titulo}
      </h3>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  );
}

const ton = (v?: number | null) => (v == null ? null : `${fmt(v, 1)} t`);

/**
 * Responsivo pela largura do próprio cartão (não do ecrã):
 * a grelha cria as colunas que cabem, cada uma com pelo menos 220px.
 */
export default function BalancoConfirmados({
  relatorio,
  navio,
  empresa,
  de,
  ate,
  geradoEm,
}: {
  relatorio: RelatorioConfirmados;
  navio: string;
  empresa?: string | null;
  de: string;
  ate: string;
  geradoEm: string;
}) {
  const r = relatorio;
  const atrasados = r.atrasados ?? null;
  const divergencias = r.divergencias ?? null;
  const semAlertas = atrasados === 0 && divergencias === 0;

  return (
    <article
      id="balanco-confirmados"
      className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-300 bg-slate-50 shadow-sm"
    >
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 bg-slate-900 px-4 py-3 text-white">
        <div className="min-w-0">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-300">
            Balanço de confirmados
          </h3>
          <p className="mt-0.5 text-xl font-bold leading-tight">{navio}</p>
          {empresa && <p className="text-sm text-slate-300">{empresa}</p>}
        </div>
        <p className="text-sm font-semibold text-slate-100">
          <span className="whitespace-nowrap">{dataHora(de)}</span>
          <span className="px-1.5 text-slate-400">→</span>
          <span className="whitespace-nowrap">{dataHora(ate)}</span>
        </p>
      </header>

      <div
        className="grid gap-3 p-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        <Bloco titulo="Resumo (camiões)">
          <Linha rotulo="Carregados" valor={r.carregados} />
          <Linha rotulo="Em trânsito" valor={r.em_transito} />
          <Linha rotulo="A pesar" valor={r.a_pesar} />
          <Linha rotulo="Confirmados" valor={r.camioes} forte />
        </Bloco>

        <Bloco titulo="Carga">
          <Linha rotulo="Esperada" valor={ton(r.esperada_ton)} />
          <Linha rotulo="Confirmada" valor={ton(r.toneladas)} forte />
          <Linha rotulo="Em trânsito" valor={ton(r.em_transito_ton)} />
        </Bloco>

        {r.produtos && r.produtos.length > 0 && (
          <Bloco titulo={r.produtos.length > 1 ? 'Tipos de carga' : 'Tipo de carga'}>
            {r.produtos.map((p) => (
              <Linha
                key={p.nome}
                rotulo={p.nome}
                valor={`${fmt(p.quantidade)} ${p.unidade_label}`}
                forte
              />
            ))}
          </Bloco>
        )}

        <Bloco titulo="Alertas">
          {semAlertas ? (
            <Linha rotulo="Sem atrasados nem divergências" valor="OK" tom="ok" />
          ) : (
            <>
              <Linha
                rotulo="Camiões atrasados"
                valor={atrasados}
                forte
                tom={atrasados && atrasados > 0 ? 'alerta' : 'normal'}
              />
              <Linha
                rotulo="Camiões com divergência"
                valor={divergencias}
                forte
                tom={divergencias && divergencias > 0 ? 'alerta' : 'normal'}
              />
            </>
          )}
        </Bloco>
      </div>

      <footer className="border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
        Gerado em {geradoEm}
      </footer>
    </article>
  );
}