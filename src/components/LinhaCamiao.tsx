'use client';

import { useEffect, useRef, useState, useTransition, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DetalheCamiao from '@/components/DetalheCamiao';
import FeitoAnimado from '@/components/FeitoAnimado';
import { fmt, STATUS_COLOR, STATUS_LABEL, type DischargeList } from '@/lib/laravel-types';
import { horaMaputo } from '@/lib/tempos';

type Camiao = DischargeList['data'][number];

/** O deslize só vale depois de passar 35% da largura da linha (mínimo 110 px): evita toques por engano. */
const LIMIAR_MIN = 110;
const LIMIAR_REL = 0.35;

/** Cores do atraso: iguais às do sinal da central (nivelAtraso do Laravel). */
const COR_ATRASO: Record<string, { bg: string; rotulo: string }> = {
  ok: { bg: 'bg-emerald-500', rotulo: 'Dentro do prazo' },
  warn: { bg: 'bg-orange-500', rotulo: 'Atenção ao prazo' },
  danger: { bg: 'bg-red-600', rotulo: 'Atrasado' },
};

export default function LinhaCamiao({
  camiao: d,
  operacaoId,
  icone,
  podeEditar = false,
  editarHref,
}: {
  camiao: Camiao;
  operacaoId: number;
  icone: ReactNode;
  /** true só para o role "gestor" (decidido no servidor, em page.tsx). */
  podeEditar?: boolean;
  editarHref?: string;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dx, setDx] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const [passou, setPassou] = useState(false);
  const dxRef = useRef(0);
  const inicio = useRef<{ x: number; y: number; id: number; largura: number; ativo: boolean } | null>(null);

  const ocupado = enviando || pendente || feito;
  // Só um camião "Carregado" pode ser deslizado (2.º agente: saiu do porto).
  // A chegada à balança e a saída da descarga são automáticas, feitas pela pesagem.
  const carregado = d.status === 'loaded';
  const podeDeslizar = carregado && !ocupado;

  // Quando o estado muda (depois de actualizar a lista), a linha volta à posição normal.
  useEffect(() => {
    dxRef.current = 0;
    setDx(0);
    setPassou(false);
    setErro(null);
  }, [d.status]);

  function repor() {
    dxRef.current = 0;
    setDx(0);
    setPassou(false);
  }

  async function registarSaidaPorto() {
    if (ocupado) return;
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch(`/api/laravel/discharges/${d.id}/saiu-porto`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErro(j?.errors?.status?.[0] ?? j?.message ?? `Erro ${res.status} ao registar a saída do porto.`);
        repor();
        // 422 = já tinha sido registado noutro tablet: actualiza a linha
        if (res.status === 422) iniciar(() => router.refresh());
        return;
      }
      // Sucesso: mostra a animação "Em trânsito!" e só actualiza a lista quando ela acabar
      repor();
      setFeito(true);
    } catch {
      setErro('Sem ligação ao servidor. Verifique a rede e tente novamente.');
      repor();
    } finally {
      setEnviando(false);
    }
  }

  function aoPressionar(e: ReactPointerEvent<HTMLDivElement>) {
    if (!podeDeslizar) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    inicio.current = { x: e.clientX, y: e.clientY, id: e.pointerId, largura: e.currentTarget.offsetWidth, ativo: false };
  }

  function aoMover(e: ReactPointerEvent<HTMLDivElement>) {
    const i = inicio.current;
    if (!i || e.pointerId !== i.id) return;
    const mx = e.clientX - i.x;
    const my = e.clientY - i.y;

    if (!i.ativo) {
      if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
      // Movimento vertical ou para a esquerda: não é um deslize, deixa a página rolar.
      if (Math.abs(my) > Math.abs(mx) || mx < 0) {
        inicio.current = null;
        return;
      }
      i.ativo = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setArrastando(true);
    }

    const v = Math.max(0, Math.min(mx, i.largura));
    dxRef.current = v;
    setDx(v);
    setPassou(v >= Math.max(LIMIAR_MIN, i.largura * LIMIAR_REL));
  }

  function aoSoltar() {
    const i = inicio.current;
    inicio.current = null;
    if (!i || !i.ativo) return;
    setArrastando(false);
    if (dxRef.current >= Math.max(LIMIAR_MIN, i.largura * LIMIAR_REL)) {
      void registarSaidaPorto();
    } else {
      repor();
    }
  }

  function aoCancelar() {
    inicio.current = null;
    setArrastando(false);
    repor();
  }

  const horaBase = horaMaputo(d.carregado_em) ?? d.hora_saida_porto;

  // Tipo de atrelado (só mostrado como etiqueta no telemóvel)
  const tipoLabel = d.tipo_atrelado ? (d.tipo_atrelado === 'link' ? 'Link' : 'Normal') : '';

  // Atraso até à balança (calculado no Laravel: nivelAtraso). Carregado ainda não tem atraso.
  const {
    nivel_atraso: nivel,
    atraso_minutos: minAtraso,
    atraso_motivo: motivoAtraso,
  } = d as Camiao & {
    nivel_atraso?: string | null;
    atraso_minutos?: number | null;
    atraso_motivo?: string | null;
  };
  const corAtraso = nivel ? COR_ATRASO[nivel] : undefined;
  const textoAtraso = corAtraso
    ? `${corAtraso.rotulo}${minAtraso ? ` (${minAtraso} min)` : ''}${motivoAtraso ? `: ${motivoAtraso}` : ''}`
    : '';

  return (
    <li className="relative overflow-hidden rounded-xl">
      {carregado && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center rounded-xl bg-emerald-600 px-5 text-base font-bold text-white"
        >
          {ocupado ? 'A registar…' : passou ? 'Solte para confirmar: saiu do porto' : 'Saiu do porto'}
        </div>
      )}

      <div
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoCancelar}
        style={{
          transform: `translateX(${dx}px)`,
          transition: arrastando ? 'none' : 'transform 200ms ease',
          touchAction: podeDeslizar ? 'pan-y' : undefined,
        }}
        className={`relative flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm md:flex-nowrap md:gap-4 md:px-4 md:py-2 ${
          podeDeslizar ? 'select-none' : ''
        } ${ocupado ? 'opacity-70' : ''}`}
      >
        {/* Ícone do camião (+ etiqueta Link/Normal só no telemóvel) */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 md:w-14">{icone}</div>
          {tipoLabel && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:hidden">
              {tipoLabel}
            </span>
          )}
        </div>

        {/* Identificação */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="whitespace-nowrap text-xl font-bold tracking-tight text-slate-900 md:text-lg">
              {d.matricula}
            </span>
            <span
              className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[d.status]}`}
            >
              {STATUS_LABEL[d.status]}
            </span>
            {corAtraso && (
              <span className="flex items-center gap-1.5 whitespace-nowrap" title={textoAtraso}>
                <span
                  role="img"
                  aria-label={textoAtraso}
                  className={`h-4 w-4 rounded-full shadow ring-2 ring-white md:h-3.5 md:w-3.5 ${corAtraso.bg}`}
                />
                {minAtraso != null && minAtraso > 0 && (
                  <span className="text-sm font-semibold text-slate-600 md:text-xs">{minAtraso} min</span>
                )}
              </span>
            )}
          </div>

          {/* Telemóvel: motorista e transportadora, cada um na sua linha */}
          <div className="mt-1 md:hidden">
            <p className="truncate text-[15px] font-semibold text-slate-800">{d.motorista}</p>
            <p className="truncate text-sm text-slate-500">{d.transportadora}</p>
          </div>

          {/* Tablet e computador: tudo numa linha */}
          <p className="hidden truncate text-sm text-slate-600 md:block">
            {d.motorista} · {d.transportadora}
          </p>

          {carregado && (
            <p className="mt-1 text-xs font-semibold text-emerald-700 md:mt-0.5">
              Deslize para a direita: saiu do porto →
            </p>
          )}
        </div>

        {/* Colunas de tablet e computador */}
        <div className="hidden w-28 shrink-0 md:block">
          <div className="text-xs font-medium text-slate-500">Guia</div>
          <div className="truncate text-sm font-semibold text-slate-900">{d.numero_guia}</div>
        </div>

        <div className="hidden w-36 shrink-0 lg:block">
          <div className="text-xs font-medium text-slate-500">Data e hora</div>
          <div className="whitespace-nowrap text-sm font-semibold text-slate-900">
            {d.data}
            {horaBase ? ` ${horaBase}` : ''}
          </div>
        </div>

        <div className="hidden w-16 shrink-0 text-right md:block">
          <div className="text-xs font-medium text-slate-500">Sacos</div>
          <div className="text-sm font-semibold text-slate-900">{d.total_sacos}</div>
        </div>

        <div className="hidden w-28 shrink-0 text-right md:block">
          <div className="text-lg font-bold tracking-tight text-slate-900">{fmt(d.peso_total_estimado, 0)} kg</div>
          <div className="text-xs font-medium text-slate-500">Estimado</div>
        </div>

        {/* Botões: empilhados no telemóvel, lado a lado no tablet */}
        <div className="flex shrink-0 flex-col gap-2 md:flex-row md:gap-4">
          {/* Editar: só gestor */}
          {podeEditar && editarHref && (
            <Link
              href={editarHref}
              scroll={false}
              aria-label={`Editar camião ${d.matricula}`}
              title="Editar registo"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 md:h-12 md:w-12"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </Link>
          )}

          <DetalheCamiao
            camiao={d}
            href={`/operacoes/${operacaoId}/camioes/${d.id}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 md:h-12 md:w-12"
          />
        </div>

        {/* Telemóvel: faixa de baixo com Guia, Hora e Sacos */}
        <dl className="order-last grid w-full grid-cols-3 gap-2 border-t border-slate-100 pt-2 md:hidden">
          <div className="min-w-0">
            <dt className="text-[11px] font-medium text-slate-500">Guia</dt>
            <dd className="truncate text-[15px] font-bold text-slate-900">{d.numero_guia}</dd>
          </div>
          <div className="min-w-0 text-center">
            <dt className="text-[11px] font-medium text-slate-500">Hora</dt>
            <dd className="text-[15px] font-bold text-slate-900">{horaBase ?? '—'}</dd>
          </div>
          <div className="min-w-0 text-right">
            <dt className="text-[11px] font-medium text-slate-500">Sacos</dt>
            <dd className="text-[15px] font-bold text-slate-900">{d.total_sacos}</dd>
          </div>
        </dl>
      </div>

      {erro && (
        <p role="alert" className="rounded-b-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
          {erro}
        </p>
      )}

      {/* Animação no centro do ecrã (portal: escapa ao overflow-hidden e ao translateX da linha) */}
      {feito &&
        typeof document !== 'undefined' &&
        createPortal(
          <FeitoAnimado
            titulo="Em trânsito!"
            subtitulo={`${d.matricula} saiu do porto`}
            onFim={() => {
              setFeito(false);
              iniciar(() => router.refresh());
            }}
          />,
          document.body,
        )}
    </li>
  );
}