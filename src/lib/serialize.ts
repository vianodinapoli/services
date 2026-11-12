import type { Contentor, ContentoresData, Discharge, Operation } from './types';
import type { ContentorRow, DischargeRow, OperationRow } from './db';
import { ESTADOS, LIMITE_ATRELADO_T, LIMITE_DIAS, TIPOS } from './constants';

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const LABEL = { pending: 'Pendente', in_transit: 'Em trânsito', weighing: 'A pesar', confirmed: 'Confirmado' } as const;
const pad = (n: number) => String(n).padStart(2, '0');

/* ── Contentores ── */
export function diasNoParque(c: ContentorRow): number | null {
  if (!c.dataEntrada) return null;
  const ini = new Date(c.dataEntrada.slice(0, 10) + 'T00:00:00').getTime();
  const fim = c.dataSaida ? new Date(c.dataSaida.slice(0, 10) + 'T00:00:00').getTime() : Date.now();
  return Math.max(0, Math.floor((fim - ini) / 86400000));
}
export const toContentor = (c: ContentorRow): Contentor => ({ ...c, diasNoParque: diasNoParque(c) });

export function contentoresData(rows: ContentorRow[]): ContentoresData {
  const list = rows.map(toContentor);
  const ativo = (c: Contentor) => !['em_transito', 'saiu'].includes(c.estado);
  const noParque = list.filter(ativo);

  const meses: string[] = [], entradasMensais: number[] = [];
  const hoje = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push(d.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' }).replace('.', ''));
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    entradasMensais.push(list.filter((c) => c.dataEntrada?.startsWith(key)).length);
  }

  const porEstadoMap: Record<string, number> = {};
  list.forEach((c) => { const n = ESTADOS[c.estado] ?? c.estado; porEstadoMap[n] = (porEstadoMap[n] ?? 0) + 1; });
  const topMap: Record<string, number> = {};
  noParque.forEach((c) => { if (c.cliente) topMap[c.cliente] = (topMap[c.cliente] ?? 0) + 1; });

  return {
    contentores: list,
    kpis: {
      total: list.length, noParque: noParque.length,
      emTransito: list.filter((c) => c.estado === 'em_transito').length,
      carregados: list.filter((c) => c.estado === 'carregado').length,
      saiu: list.filter((c) => c.estado === 'saiu').length,
      atrasados: noParque.filter((c) => (c.diasNoParque ?? 0) > LIMITE_DIAS).length,
      limite: LIMITE_DIAS,
      peso: noParque.reduce((s, c) => s + (c.pesoKg ?? 0), 0) / 1000,
    },
    meses, entradasMensais,
    porEstado: Object.entries(porEstadoMap).map(([nome, total]) => ({ nome, total })),
    topClientes: Object.entries(topMap).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total).slice(0, 8),
    estados: ESTADOS, tipos: TIPOS,
  };
}

/* ── Descargas ── */
export function toDischarge(d: DischargeRow, op: OperationRow): Discharge {
  let estimado = 0, sacos = 0, sacosConf = 0;
  const items = d.items.map((i) => {
    const p = op.planItems.find((x) => x.id === i.operationItemId);
    if (p?.unidade === 'saco') { estimado += i.quantidade * (p.pesoUnitarioKg ?? 0); sacos += i.quantidade; sacosConf += i.quantidadeConfirmada ?? i.quantidade; }
    else if (p) estimado += i.quantidade * 1000;
    return { operationItemId: i.operationItemId, nome: p?.nome ?? '?', unidade: p?.unidade ?? ('saco' as const), quantidade: i.quantidade, quantidadeConfirmada: i.quantidadeConfirmada };
  });
  const liquido = d.pesoBruto !== null && d.tara !== null ? d.pesoBruto - d.tara : null;
  let tempo: number | null = null;
  if (d.horaSaidaPorto && d.horaChegadaBalanca) {
    const [h1, m1] = d.horaSaidaPorto.split(':').map(Number), [h2, m2] = d.horaChegadaBalanca.split(':').map(Number);
    const diff = h2 * 60 + m2 - (h1 * 60 + m1);
    tempo = diff >= 0 ? diff : null;
  }
  const acima = estimado / 1000 > LIMITE_ATRELADO_T;
  return {
    id: d.id, data: d.data, numeroGuia: d.numeroGuia, motorista: d.motorista, matricula: d.matricula,
    transportadora: d.transportadora, assinado: d.assinado, tipoAtrelado: d.tipoAtrelado,
    atreladoInconsistente: d.tipoAtrelado ? (acima ? d.tipoAtrelado === 'normal' : d.tipoAtrelado === 'link') : false,
    status: d.status, statusLabel: LABEL[d.status],
    horaSaidaPorto: d.horaSaidaPorto, horaChegadaBalanca: d.horaChegadaBalanca,
    pesoBruto: d.pesoBruto, tara: d.tara, pesoLiquido: liquido !== null && liquido > 0 ? liquido : null,
    pesoTotalEstimado: estimado, tempoTransporte: tempo, totalSacos: sacos, sacosConfirmados: sacosConf,
    hasDivergence: items.some((i) => i.quantidadeConfirmada !== null && Math.abs(i.quantidadeConfirmada - i.quantidade) > 0.0005),
    observacoes: d.observacoes, items,
  };
}

/* ── Operação ── */
export function toOperation(op: OperationRow, ds: DischargeRow[]): Operation {
  const esperada = op.planItems.reduce((s, p) => s + (p.unidade === 'saco' ? (p.quantidade * (p.pesoUnitarioKg ?? 0)) / 1000 : p.quantidade), 0);
  const recebido = ds.filter((d) => d.status === 'confirmed' && d.pesoBruto !== null && d.tara !== null)
    .reduce((s, d) => s + Math.max(0, (d.pesoBruto as number) - (d.tara as number)), 0) / 1000;
  return {
    id: op.id, navio: op.navio, empresa: op.empresa, bl: op.bl, factura: op.factura,
    dataChegada: op.dataChegada, startedAt: op.startedAt, archivedAt: op.archivedAt, archived: !!op.archivedAt,
    quantidadeEsperada: r3(esperada), recebidoTon: r3(recebido), faltaTon: r3(esperada - recebido),
    progresso: esperada > 0 ? Math.round((recebido / esperada) * 100) : 0,
    metadata: op.metadata, observacoes: op.observacoes, transportadoras: op.transportadoras,
    transportadorasExtra: op.transportadoras.filter((t) => t.extra).map((t) => t.nome.toLowerCase()),
    planItems: op.planItems.map((p) => ({
      id: p.id, nome: p.nome, quantidade: p.quantidade, unidade: p.unidade, pesoUnitarioKg: p.pesoUnitarioKg,
      registado: r3(ds.flatMap((d) => d.items).filter((i) => i.operationItemId === p.id).reduce((s, i) => s + i.quantidade, 0)),
      confirmado: r3(ds.filter((d) => d.status === 'confirmed').flatMap((d) => d.items).filter((i) => i.operationItemId === p.id).reduce((s, i) => s + (i.quantidadeConfirmada ?? 0), 0)),
    })),
  };
}
