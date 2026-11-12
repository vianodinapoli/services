import { Discharge, DischargeStatus } from './types';

export const SLA_AMARELO = 80;    // minutos
export const SLA_VERMELHO = 120;

export const PALETTE = [
  { bg: '#e8f0fe', bd: '#c3d9fa', tx: '#1a56db' },
  { bg: '#fde8e8', bd: '#f8c4c4', tx: '#dc3545' },
  { bg: '#e6f4ec', bd: '#b7dfc7', tx: '#198754' },
  { bg: '#fff3cd', bd: '#ffe08a', tx: '#b35c00' },
  { bg: '#f3e8ff', bd: '#d9bcff', tx: '#6f42c1' },
  { bg: '#e0f7fc', bd: '#9fe3f0', tx: '#0aa2c0' },
];

const nf3 = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 3 });
export const fmt = (n: number | string | null | undefined) => nf3.format(Number(n ?? 0));
export const fmt1 = (n: number) => new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
export const fmt0 = (n: number) => new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(n);
export const fmtData = (iso: string) => iso.split('-').reverse().join('/');

/* ── Alerta porto → balança ── */
export type Sla = '' | 'ok' | 'warn' | 'danger';

export function desdeSaida(d: Discharge): Date | null {
  if (!['pending', 'in_transit'].includes(d.status) || !d.horaSaidaPorto) return null;
  return new Date(`${d.data}T${d.horaSaidaPorto.slice(0, 5)}:00`);
}
export function slaMinutos(d: Discharge, now: number): number | null {
  const desde = desdeSaida(d);
  return desde ? Math.max(0, Math.floor((now - desde.getTime()) / 60000)) : null;
}
export function slaNivel(min: number | null): Sla {
  if (min === null) return '';
  return min >= SLA_VERMELHO ? 'danger' : min >= SLA_AMARELO ? 'warn' : 'ok';
}

/* ── Balança ── */
export function labelBalanca(d: Discharge) {
  if (d.status === 'weighing') return d.pesoBruto !== null ? 'Pesar vazio' : 'Pesar cheio';
  return 'Balança';
}
export function tempoTransporte(saida: string | null, chegada: string) {
  if (!saida || !chegada) return null;
  const [hd, md] = saida.split(':').map(Number);
  const [ha, ma] = chegada.split(':').map(Number);
  const diff = ha * 60 + ma - (hd * 60 + md);
  return diff >= 0 ? diff : null;
}
export function passosPesagem(bruto: string, tara: string) {
  const b = bruto.trim() !== '', t = tara.trim() !== '';
  const n = (b ? 1 : 0) + (t ? 1 : 0);
  const texto =
    n === 0 ? 'Registe pelo menos um peso (cheio ou vazio)'
    : n === 2 ? 'Pesagem completa: ao guardar, a descarga fica confirmada'
    : b ? 'Peso cheio registado. Falta pesar o camião vazio (ao voltar)'
    : 'Peso vazio registado. Falta pesar o camião cheio';
  return { b, t, n, texto };
}
export function validarPesos(bruto: string, tara: string): string | null {
  const sb = bruto.trim(), st = tara.trim();
  if (!sb && !st) return 'Registe pelo menos um peso (cheio ou vazio).';
  if (sb && st && parseFloat(sb) <= parseFloat(st)) return 'O peso cheio tem de ser maior que o peso vazio.';
  return null;
}

/* ── Filtros (aplicados a todas as linhas, não só à página visível) ── */
export interface Filters { de: string; ate: string; tr: string; st: '' | DischargeStatus; tc: string; dv: '' | 'sim' | 'nao'; at: '' | 'normal' | 'link' | 'nd' }
export const EMPTY_FILTERS: Filters = { de: '', ate: '', tr: '', st: '', tc: '', dv: '', at: '' };

export function applyFilters(list: Discharge[], f: Filters) {
  return list.filter((d) => {
    const prods = d.items.map((i) => i.nome.toLowerCase());
    if (f.de && d.data < f.de) return false;
    if (f.ate && d.data > f.ate) return false;
    if (f.tr && !d.transportadora.toLowerCase().includes(f.tr.toLowerCase())) return false;
    if (f.st && d.status !== f.st) return false;
    if (f.tc === 'misto' && prods.length < 2) return false;
    if (f.tc && f.tc !== 'misto' && !(prods.length === 1 && prods[0] === f.tc)) return false;
    if (f.dv && (d.hasDivergence ? 'sim' : 'nao') !== f.dv) return false;
    if (f.at && (d.tipoAtrelado ?? 'nd') !== f.at) return false;
    return true;
  });
}
