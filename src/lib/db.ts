import { promises as fs } from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';
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
const KEY = 'fem-descargas:db';

// Na Vercel (Upstash Redis) os dados ficam na nuvem; em local, sem variáveis, usa ficheiro.
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = REDIS_URL && REDIS_TOKEN
  ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN, cache: 'no-store' })
  : null;

let fila: Promise<unknown> = Promise.resolve();

function semArmazenamento(): never {
  throw new Error('Sem armazenamento: falta ligar o Upstash Redis ao projecto na Vercel (variáveis KV_REST_API_URL / KV_REST_API_TOKEN).');
}

async function save(db: DB) {
  if (redis) { await redis.set(KEY, db); return; }
  if (process.env.VERCEL) semArmazenamento();
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
}

async function load(): Promise<DB> {
  if (redis) {
    const existente = await redis.get<DB>(KEY);
    if (existente) return existente;
    const db = seed();
    await save(db);
    return db;
  }
  if (process.env.VERCEL) semArmazenamento();
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
