export type Item = {
  id: number;
  nome: string;
  unidade: 'saco' | 'tonelada';
  unidade_label: string;
  peso_unitario_kg: number;
  plano: number;
  registado: number;
  saldo: number;
};

export type StatusCamiao = 'pending' | 'loaded' | 'in_transit' | 'weighing' | 'confirmed' | 'finished';

export type Tempos = {
  carregado_em: string | null;
  saiu_porto_em: string | null;
  chegou_balanca_em: string | null;
  saiu_descarga_em: string | null;
};

export type Discharge = {
  id: number;
  data: string;
  hora_saida_porto: string | null;
  motorista: string;
  matricula: string;
  transportadora: string;
  numero_guia: string;
  tipo_atrelado: 'normal' | 'link' | null;
  status: StatusCamiao;
  total_sacos: number;
  peso_total_estimado: number;
} & Tempos;

export type Operation = {
  id: number;
  navio: string;
  empresa: string;
  bl: string | null;
  factura: string | null;
  data_chegada: string | null;
  status: string;
  esperado_ton: number;
  recebido_ton: number;
  camioes_count: number;
  pendentes_count: number;
  pendente_desde: number | null;
  transportadoras: string[];
  items: Item[];
  discharges?: Discharge[];
  locais?: { id: number; nome: string; tipo: 'armazem' | 'yard'; principal: boolean }[];
};

export const STATUS_LABEL: Record<StatusCamiao, string> = {
  pending: 'Pendente',
  loaded: 'Carregado',
  in_transit: 'Em trânsito',
  weighing: 'A pesar',
  confirmed: 'Confirmado',
  finished: 'Terminado',
};

export const STATUS_COLOR: Record<StatusCamiao, string> = {
  pending: 'bg-gray-100 text-gray-700',
  loaded: 'bg-violet-100 text-violet-700',
  in_transit: 'bg-[#e0f7fc] text-[#0aa2c0]',
  weighing: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-[#e6f4ec] text-[#198754]',
  finished: 'bg-slate-200 text-slate-700',
};

export const fmt = (n: number, dec = 3) => n.toLocaleString('pt-PT', { maximumFractionDigits: dec });

export type EtapaTempo = { em: string | null; por: string | null };

export type DischargeDetail = {
  id: number;
  operation_id: number;
  navio: string | null;
  status: StatusCamiao;
  data: string;
  numero_guia: string;
  hora_saida_porto: string | null;
  tempos: {
    carregado: EtapaTempo;
    saiu_porto: EtapaTempo;
    chegou_balanca: EtapaTempo;
    saiu_descarga: EtapaTempo;
  };
  registado_por: string | null;
  motorista: string;
  matricula: string;
  transportadora: string;
  transportadora_extra: boolean;
  tipo_atrelado: 'normal' | 'link' | null;
  atrelado_aviso: string | null;
  assinatura: { imagem: string; nome: string; em: string | null } | null;
  items: {
    id: number;
    nome: string;
    unidade: 'saco' | 'tonelada';
    unidade_label: string;
    quantidade: number;
    kg_unidade: number;
    peso_kg: number;
    quantidade_confirmada: number | null;
  }[];
  total_sacos: number;
  peso_total_estimado: number;
  balanca: {
    hora_chegada: string | null;
    peso_bruto: number | null;
    tara: number | null;
    peso_liquido: number | null;
    confirmado_por: string | null;
    divergencia: boolean;
  } | null;
};

export type DischargeList = {
  data: Discharge[];
  meta: { pagina: number; ultima: number; por_pagina: number; total: number; de: number | null; ate: number | null };
  contagens: {
    todos: number;
    por_confirmar: number;
    loaded: number;
    in_transit: number;
    weighing: number;
    confirmed: number;
    finished?: number;
  };
  transportadoras: string[];
};

export type RelatorioProduto = {
  nome: string;
  unidade_label: string;
  quantidade: number;
};

export type RelatorioConfirmados = {
  descarregados: string | number | null | undefined;
  camioes: number;
  sacos: number;
  toneladas: number;

  carregados?: number | null;
  em_transito?: number | null;
  a_pesar?: number | null;

  esperada_ton?: number | null;
  em_transito_ton?: number | null;

  atrasados?: number | null;
  divergencias?: number | null;

  // Tipo(s) de carga confirmados no intervalo, com a quantidade de cada um
  produtos?: RelatorioProduto[];
};