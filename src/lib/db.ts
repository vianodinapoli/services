import { promises as fs } from 'fs';
import path from 'path';
import type { Contentor, DischargeStatus } from './types';
import { seed } from './seed';

export type ContentorRow = Omit<Contentor, 'diasNoParque'>;
export interface PlanItemRow { id: number; nome: string; quantidade: number; unidade: 'saco' | 'tonelada'; pesoUnitarioKg: number | null }
export interface OperationRow {
  id: number; navio: string; empresa: string; bl: string | null; factura: string | null;
  dataChegada: string | null; startedAt: string | null; archivedAt: string | null;
  metadata: Record<string, string>; observacoes: string | null;
  transportadoras: { nome: string; extra?: boolean }[]; planItems: PlanItemRow[];
}
export interface DischargeItemRow { operationItemId: number; quantidade: number; quantidadeConfirmada: number | null }
export interface DischargeRow {
  id: number; operationId: number; data: string; numeroGuia: string; motorista: string; matricula: string;
  transportadora: string; assinado: boolean; tipoAtrelado: 'normal' | 'link' | null;
  horaSaidaPorto: string | null; horaChegadaBalanca: string | null;
  pesoBruto: number | null; tara: number | null; observacoes: string | null;
  status: DischargeStatus; items: DischargeItemRow[];
}
export interface DB {
  seq: { contentor: number; operation: number; item: number; discharge: number };
  contentores: ContentorRow[]; operations: OperationRow[]; discharges: DischargeRow[];
}

const FILE = path.join(process.cwd(), 'data', 'db.json');
let fila: Promise<unknown> = Promise.resolve();

async function save(db: DB) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
}
async function load(): Promise<DB> {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')) as DB; }
  catch { const db = seed(); await save(db); return db; }
}

export const readDb = () => load();

/** Lê, altera e grava, em fila (evita duas escritas ao mesmo tempo). */
export function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = fila.then(async () => { const db = await load(); const r = await fn(db); await save(db); return r; });
  fila = run.catch(() => {});
  return run;
}
