export type DischargeStatus = 'pending' | 'in_transit' | 'weighing' | 'confirmed';
export type Unidade = 'saco' | 'tonelada';

export interface PlanItem {
  id: number; nome: string; quantidade: number; unidade: Unidade;
  pesoUnitarioKg: number | null; registado: number; confirmado: number;
}
export interface DischargeItem {
  operationItemId: number; nome: string; unidade: Unidade;
  quantidade: number; quantidadeConfirmada: number | null;
}
export interface Discharge {
  id: number; data: string;                // YYYY-MM-DD
  numeroGuia: string; motorista: string; matricula: string; transportadora: string;
  assinado: boolean; tipoAtrelado: 'normal' | 'link' | null; atreladoInconsistente: boolean;
  status: DischargeStatus; statusLabel: string;
  horaSaidaPorto: string | null;           // HH:mm[:ss]
  horaChegadaBalanca: string | null;
  pesoBruto: number | null; tara: number | null; pesoLiquido: number | null;
  pesoTotalEstimado: number; tempoTransporte: number | null;
  totalSacos: number; sacosConfirmados: number; hasDivergence: boolean;
  observacoes: string | null; items: DischargeItem[];
}
export interface Operation {
  id: number; navio: string; empresa: string; bl: string | null; factura: string | null;
  dataChegada: string | null; startedAt: string | null; archivedAt: string | null; archived: boolean;
  quantidadeEsperada: number; recebidoTon: number; faltaTon: number; progresso: number;
  metadata: Record<string, string>; observacoes: string | null;
  transportadoras: { nome: string; extra?: boolean }[];
  transportadorasExtra: string[];          // nomes em minúsculas fora da lista prevista
  planItems: PlanItem[];
}

export interface Contentor {
  id: number; numero: string; tipo: string; estado: string;
  armador: string | null; cliente: string | null; navio: string | null;
  bl: string | null; selo: string | null; pesoKg: number | null;
  localizacao: string | null; dataEntrada: string | null; dataSaida: string | null;
  observacoes: string | null; diasNoParque: number | null;
}
export interface ContentoresData {
  contentores: Contentor[];
  kpis: { total: number; noParque: number; emTransito: number; carregados: number; saiu: number; atrasados: number; limite: number; peso: number };
  meses: string[]; entradasMensais: number[];
  porEstado: { nome: string; total: number }[];
  topClientes: { nome: string; total: number }[];
  estados: Record<string, string>;         // chave → rótulo
  tipos: string[];
}
