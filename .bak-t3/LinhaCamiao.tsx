'use client';

import { useEffect, useRef, useState, useTransition, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import DetalheCamiao from '@/components/DetalheCamiao';
import { fmt, STATUS_COLOR, STATUS_LABEL, type DischargeList } from '@/lib/laravel-types';
import { horaMaputo } from '@/lib/tempos';

type Camiao = DischargeList['data'][number];
type Etapa = 'saiu-porto' | 'chegou-balanca' | 'saiu-descarga';

/** O deslize só vale depois de passar 35% da largura da linha (mínimo 110 px): evita toques por engano. */
const LIMIAR_MIN = 110;
const LIMIAR_REL = 0.35;

export default function LinhaCamiao({
  camiao: d,
  operacaoId,
  icone,
}: {
  camiao: Camiao;
  operacaoId: number;
  icone: ReactNode;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dx, setDx] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const [passou, setPassou] = useState(false);
  const dxRef = useRef(0);
  const inicio = useRef<{ x: number; y: number; id: number; largura: number; ativo: boolean } | null>(null);

  const ocupado = enviando || pendente;
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

  async function enviar(etapa: Etapa) {
    if (ocupado) return;
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch(`/api/laravel/discharges/${d.id}/${etapa}`, { method: 'POST' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErro(j?.errors?.status?.[0] ?? j?.message ?? `Erro ${res.status} ao registar a etapa.`);
        repor();
        return;
      }
      iniciar(() => router.refresh());
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
      void enviar('saiu-porto');
    } else {
      repor();
    }
  }

  function aoCancelar() {
    inicio.current = null;
    setArrastando(false);
    repor();
  }

  const acao: { etapa: Etapa; rotulo: string } | null =
    d.status === 'in_transit'
      ? { etapa: 'chegou-balanca', rotulo: 'Chegou à balança' }
      : d.status === 'confirmed'
        ? { etapa: 'saiu-descarga', rotulo: 'Saída da descarga' }
        : null;

  const marcos = [
    { rotulo: 'Carregado', hora: horaMaputo(d.carregado_em) },
    { rotulo: 'Saiu do porto', hora: horaMaputo(d.saiu_porto_em) },
    { rotulo: 'A pesar', hora: horaMaputo(d.chegou_balanca_em) },
    { rotulo: 'Terminado', hora: horaMaputo(d.saiu_descarga_em) },
  ].filter((m) => m.hora);

  const horaBase = horaMaputo(d.carregado_em) ?? d.hora_saida_porto;

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
        className={`relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm md:gap-4 md:px-4 ${
          podeDeslizar ? 'select-none' : ''
        } ${ocupado ? 'opacity-70' : ''}`}
      >
        <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100">{icone}</div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900">{d.matricula}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[d.status]}`}>
              {STATUS_LABEL[d.status]}
            </span>
          </div>
          <p className="truncate text-sm text-slate-600">
            {d.motorista} · {d.transportadora}
            <span className="md:hidden"> · Guia {d.numero_guia}</span>
          </p>
          {marcos.length > 0 && (
            <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
              {marcos.map((m) => (
                <span key={m.rotulo}>
                  {m.rotulo} <span className="font-semibold text-slate-700">{m.hora}</span>
                </span>
              ))}
            </p>
          )}
          {carregado && (
            <p className="mt-0.5 text-xs font-semibold text-emerald-700">Deslize para a direita: saiu do porto →</p>
          )}
        </div>

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

        <div className="hidden w-16 shrink-0 text-right sm:block">
          <div className="text-xs font-medium text-slate-500">Sacos</div>
          <div className="text-sm font-semibold text-slate-900">{d.total_sacos}</div>
        </div>

        <div className="w-20 shrink-0 text-right md:w-24">
          <div className="text-lg font-bold tracking-tight text-slate-900">{fmt(d.peso_total_estimado, 1)} t</div>
          <div className="text-xs font-medium text-slate-500">estimado</div>
        </div>

        {acao && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void enviar(acao.etapa)}
            className="h-12 shrink-0 whitespace-nowrap rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 active:opacity-90 disabled:opacity-50"
          >
            {ocupado ? 'A registar…' : acao.rotulo}
          </button>
        )}

        <DetalheCamiao
          camiao={d}
          href={`/operacoes/${operacaoId}/camioes/${d.id}`}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100"
        />
      </div>

      {erro && (
        <p role="alert" className="rounded-b-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
          {erro}
        </p>
      )}
    </li>
  );
}
