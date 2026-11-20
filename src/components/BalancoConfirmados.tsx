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
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-slate-600">{rotulo}</span>
      <span className={`tabular-nums ${forte ? 'text-base font-bold' : 'text-sm font-semibold'} ${cor}`}>
        {valor ?? '—'}
      </span>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-200 px-3 py-2">
      <h3 className="pb-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{titulo}</h3>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  );
}

const ton = (v?: number | null) => (v == null ? null : `${fmt(v, 1)} t`);

/**
 * Cartão único e estreito, feito para tirar screenshot e enviar para o grupo de operações.
 * Os campos novos vêm do endpoint /operations/{id}/reports/confirmed.
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
      className="mx-auto w-full max-w-[360px] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm"
    >
      <header className="bg-slate-900 px-3 py-2.5 text-white">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide">Balanço de confirmados</h3>
        <p className="mt-0.5 text-sm font-semibold">{navio}</p>
        {empresa && <p className="text-xs text-slate-300">{empresa}</p>}
        <p className="mt-1 text-xs text-slate-200">
          {dataHora(de)} até {dataHora(ate)}
        </p>
      </header>

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

      <Bloco titulo="Descarga">
        <Linha rotulo="Camiões descarregados" valor={r.descarregados} forte />
      </Bloco>

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

      <footer className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Gerado em {geradoEm}
      </footer>
    </article>
  );
}