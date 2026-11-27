/**
 * Fila offline (IndexedDB) para lançamentos do tablet.
 * Cada lançamento recebe um UUID no cliente; o servidor usa-o para nunca duplicar.
 * Só é apagado da fila depois de o servidor confirmar.
 */

const DB_NAME = 'fem-offline';
const STORE = 'fila';
const CANAL = 'fem-fila';

export type EstadoFila = 'pendente' | 'erro';
export type Resultado = 'ok' | 'offline' | 'sessao' | 'rejeitado';

export interface ItemFila {
  uuid: string;
  criadoEm: string;
  operationId: number;
  resumo: string;
  payload: Record<string, unknown>;
  estado: EstadoFila;
  tentativas: number;
  erro?: string;
}

interface RespostaEnvio {
  r: Resultado;
  erros?: Record<string, string[]>;
  msg?: string;
}

/* ── IndexedDB ── */
let dbp: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const rq = indexedDB.open(DB_NAME, 1);
      rq.onupgradeneeded = () => {
        if (!rq.result.objectStoreNames.contains(STORE)) rq.result.createObjectStore(STORE, { keyPath: 'uuid' });
      };
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
  }
  return dbp;
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction(STORE, mode);
    const rq = fn(t.objectStore(STORE));
    t.oncomplete = () => res(rq.result);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  });
}

function avisar() {
  window.dispatchEvent(new Event('fila-mudou'));
  try { new BroadcastChannel(CANAL).postMessage('mudou'); } catch { /* sem suporte */ }
}

export function ouvirOutrosSeparadores(cb: () => void): () => void {
  try {
    const bc = new BroadcastChannel(CANAL);
    bc.onmessage = cb;
    return () => bc.close();
  } catch { return () => {}; }
}

export async function listar(): Promise<ItemFila[]> {
  const todos = await run<ItemFila[]>('readonly', (s) => s.getAll());
  return todos.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
}
const guardar = async (i: ItemFila) => { await run('readwrite', (s) => s.put(i)); avisar(); };
export const remover = async (uuid: string) => { await run('readwrite', (s) => s.delete(uuid)); avisar(); };

/* ── Envio ── */
const GATEWAY_EM_BAIXO = [408, 429, 502, 503, 504, 521, 522, 523, 524, 530]; // túnel/servidor em baixo

async function enviar(item: ItemFila): Promise<RespostaEnvio> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch('/api/laravel/discharges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item.payload, client_uuid: item.uuid }),
      signal: ctrl.signal,
    });
    if (res.ok) return { r: 'ok' };
    if (res.status === 401) return { r: 'sessao' };
    if (GATEWAY_EM_BAIXO.includes(res.status)) return { r: 'offline' };
    const j = await res.json().catch(() => ({}));
    const msg = (j as { message?: string }).message ?? `Erro ${res.status} do servidor.`;
    return { r: 'rejeitado', msg, erros: (j as { errors?: Record<string, string[]> }).errors ?? { geral: [msg] } };
  } catch {
    return { r: 'offline' };
  } finally {
    clearTimeout(timer);
  }
}

const aEnviar = new Set<string>();

/** Esvazia a fila por ordem. Pára no primeiro pedido que falhe por falta de ligação. */
export async function sincronizar(): Promise<'vazio' | 'ok' | 'offline' | 'sessao'> {
  let estado: 'vazio' | 'ok' | 'offline' | 'sessao' = 'vazio';

  const correr = async () => {
    const pendentes = (await listar()).filter((i) => i.estado === 'pendente');
    for (const it of pendentes) {
      if (aEnviar.has(it.uuid)) continue;
      aEnviar.add(it.uuid);
      try {
        const r = await enviar(it);
        if (r.r === 'ok') { await remover(it.uuid); estado = 'ok'; }
        else if (r.r === 'rejeitado') { await guardar({ ...it, estado: 'erro', erro: r.msg, tentativas: it.tentativas + 1 }); }
        else { await guardar({ ...it, tentativas: it.tentativas + 1 }); estado = r.r; break; }
      } finally {
        aEnviar.delete(it.uuid);
      }
    }
  };

  if (navigator.locks) {
    await navigator.locks.request('fem-sync', { ifAvailable: true }, async (lock) => { if (lock) await correr(); });
  } else {
    await correr();
  }
  return estado;
}

const novoUuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

/**
 * Guarda primeiro no tablet e tenta enviar logo.
 * ok/rejeitado -> sai da fila (o operador ainda está no formulário e corrige).
 * offline/sessao -> fica na fila e é enviado mais tarde.
 */
export async function registarDescarga(
  payload: Record<string, unknown>,
  operationId: number,
  resumo: string,
): Promise<RespostaEnvio & { uuid: string }> {
  const item: ItemFila = {
    uuid: novoUuid(), criadoEm: new Date().toISOString(), operationId, resumo,
    payload, estado: 'pendente', tentativas: 0,
  };
  await guardar(item);
  aEnviar.add(item.uuid);
  try {
    const r = await enviar(item);
    if (r.r === 'ok' || r.r === 'rejeitado') await remover(item.uuid);
    return { ...r, uuid: item.uuid };
  } finally {
    aEnviar.delete(item.uuid);
  }
}

export async function tentarDeNovo(uuid: string) {
  const it = (await listar()).find((i) => i.uuid === uuid);
  if (it) await guardar({ ...it, estado: 'pendente', erro: undefined });
}

export async function pedirArmazenamentoPersistente() {
  try { await navigator.storage?.persist?.(); } catch { /* ignora */ }
}
