import Link from 'next/link';
import { laravel } from '@/lib/laravel';
import PageHeader from '@/components/PageHeader';
import ImprimirBotao from '@/components/ImprimirBotao';
import { Icon } from '@/components/icons';
import { fmt, STATUS_LABEL, type DischargeDetail } from '@/lib/laravel-types';

function Linha({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px] text-[12px]">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-900">{children}</span>
    </div>
  );
}

function Divisor({ titulo }: { titulo?: string }) {
  return (
    <div className="my-2.5 border-t border-dashed border-gray-400 pt-1.5">
      {titulo && <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-gray-500">{titulo}</div>}
    </div>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">
      <Icon name="alert" className="h-3 w-3" />
      {children}
    </span>
  );
}

export default async function CamiaoPage({ params }: { params: Promise<{ id: string; did: string }> }) {
  const { id, did } = await params;
  const d = await laravel<DischargeDetail>(`/discharges/${did}`);
  const provisorio = d.status !== 'confirmed';

  return (
    <>
      <PageHeader title="Ticket" subtitle={d.matricula} back={`/operacoes/${id}`} />

      <div className="flex justify-center px-4 py-6">
        <article className="ticket w-full max-w-[340px] rounded-lg border border-gray-300 bg-white px-5 py-5 shadow-sm">
          <header className="text-center">
            <div className="font-display text-[13px] font-bold tracking-wide text-gray-900">SGL - CREATIV DEMO</div>
            <div className="mt-0.5 text-[11px] font-bold uppercase tracking-[2px] text-gray-700">
              {provisorio ? 'Ticket provisório' : 'Ticket de descarga'}
            </div>
            {d.navio && <div className="mt-1 text-[12px] font-semibold text-gray-900">{d.navio}</div>}
            <div className="mt-1.5 inline-block rounded border border-gray-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-700">
              {STATUS_LABEL[d.status]}
            </div>
          </header>

          <Divisor titulo="Identificação" />
          <Linha label="Data">{d.data}</Linha>
          <Linha label="Guia">{d.numero_guia}</Linha>
          <Linha label="Saída do porto">{d.hora_saida_porto ?? '-'}</Linha>
          <Linha label="Registado por">{d.registado_por ?? '-'}</Linha>

          <Divisor titulo="Transporte" />
          <Linha label="Motorista">{d.motorista}</Linha>
          <Linha label="Matrícula">
            <span className="rounded bg-gray-700 px-1.5 py-0.5 font-mono text-[11px] tracking-widest text-white">{d.matricula}</span>
          </Linha>
          <Linha label="Transportadora">
            {d.transportadora}
            {d.transportadora_extra && (
              <>
                <br />
                <Aviso>Fora da lista da operação</Aviso>
              </>
            )}
          </Linha>
          <Linha label="Atrelado">
            {d.tipo_atrelado ? <span className="uppercase">{d.tipo_atrelado}</span> : 'Não definido'}
            {d.atrelado_aviso && (
              <>
                <br />
                <Aviso>{d.atrelado_aviso}</Aviso>
              </>
            )}
          </Linha>

          <Divisor titulo="Carga registada no porto" />
          {d.items.map((it) => (
            <div key={it.id} className="py-[3px] text-[12px]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-gray-900">{it.nome}</span>
                <span className="font-semibold text-gray-900">
                  {fmt(it.quantidade)} {it.unidade_label}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>{it.unidade === 'saco' ? `x ${fmt(it.kg_unidade)} kg` : ''}</span>
                <span>{fmt(it.peso_kg)} kg</span>
              </div>
            </div>
          ))}
          <div className="mt-1.5 flex items-baseline justify-between border-t border-gray-300 pt-1.5 text-[13px] font-bold text-gray-900">
            <span>Total estimado</span>
            <span>
              {d.total_sacos > 0 ? `${fmt(d.total_sacos)} sacos / ` : ''}
              {fmt(d.peso_total_estimado)} kg
            </span>
          </div>

          {d.balanca && (
            <>
              <Divisor titulo="Pesagem na balança" />
              <Linha label="Chegada">{d.balanca.hora_chegada ?? '-'}</Linha>
              <Linha label="Peso cheio">{d.balanca.peso_bruto !== null ? `${fmt(d.balanca.peso_bruto)} kg` : '-'}</Linha>
              <Linha label="Peso vazio">{d.balanca.tara !== null ? `${fmt(d.balanca.tara)} kg` : '-'}</Linha>
              <Linha label="Peso líquido">{d.balanca.peso_liquido !== null ? `${fmt(d.balanca.peso_liquido)} kg` : '-'}</Linha>
              {d.balanca.divergencia && <Aviso>Divergência porto / balança</Aviso>}
            </>
          )}

          <Divisor titulo="Assinatura do motorista" />
          {d.assinatura ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.assinatura.imagem} alt="Assinatura do motorista" className="h-16 w-full rounded border border-gray-200 bg-white object-contain" />
              <p className="mt-1 text-center text-[10px] text-gray-500">
                {d.assinatura.nome}
                {d.assinatura.em ? ` - ${d.assinatura.em}` : ''}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-gray-500">Sem assinatura registada.</p>
          )}

          {provisorio && (
            <p className="mt-3 border-t border-dashed border-gray-400 pt-2 text-center text-[10px] leading-snug text-gray-500">
              Documento provisório. Sujeito a confirmação na balança.
            </p>
          )}
        </article>
      </div>

      <div className="no-print mx-auto flex max-w-[340px] items-center justify-between gap-3 px-4 pb-8">
        <Link
          href={`/operacoes/${id}`}
          className="flex h-12 flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 active:bg-gray-100"
        >
          Fechar
        </Link>
        <ImprimirBotao />
      </div>
    </>
  );
}
