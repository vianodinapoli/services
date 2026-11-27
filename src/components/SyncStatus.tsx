'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  listar, remover, sincronizar, tentarDeNovo, ouvirOutrosSeparadores,
  pedirArmazenamentoPersistente, type ItemFila,
} from '@/lib/offline';

const INTERVALO_MS = 15000;

export default function SyncStatus() {
  const [itens, setItens] = useState<ItemFila[]>([]);
  const [rede, setRede] = useState(true);
  const [sessao, setSessao] = useState(false);
  const [a_enviar, setAEnviar] = useState(false);

  const refrescar = useCallback(async () => { try { setItens(await listar()); } catch { /* sem IndexedDB */ } }, []);

  const sync = useCallback(async () => {
    setAEnviar(true);
    try {
      const r = await sincronizar();
      setSessao(r === 'sessao');
    } finally {
      setAEnviar(false);
      refrescar();
    }
  }, [refrescar]);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    pedirArmazenamentoPersistente();
    setRede(navigator.onLine);
    refrescar();
    sync();

    const onNet = () => { setRede(navigator.onLine); if (navigator.onLine) sync(); };
    const onVis = () => { if (document.visibilityState === 'visible') sync(); };
    window.addEventListener('online', onNet);
    window.addEventListener('offline', onNet);
    window.addEventListener('fila-mudou', refrescar);
    document.addEventListener('visibilitychange', onVis);
    const fechar = ouvirOutrosSeparadores(refrescar);
    const timer = setInterval(sync, INTERVALO_MS);

    return () => {
      window.removeEventListener('online', onNet);
      window.removeEventListener('offline', onNet);
      window.removeEventListener('fila-mudou', refrescar);
      document.removeEventListener('visibilitychange', onVis);
      fechar();
      clearInterval(timer);
    };
  }, [refrescar, sync]);

  // Avisa antes de fechar o separador com registos por enviar
  useEffect(() => {
    if (itens.length === 0) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [itens.length]);

  const pendentes = itens.filter((i) => i.estado === 'pendente');
  const erros = itens.filter((i) => i.estado === 'erro');
  if (itens.length === 0) return null;

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${rede ? 'bg-amber-400' : 'bg-red-500'}`} />
          {pendentes.length > 0 && `${pendentes.length} por enviar`}
          {pendentes.length > 0 && erros.length > 0 && ' · '}
          {erros.length > 0 && `${erros.length} com erro`}
          {!rede && ' · sem rede'}
        </span>
        <div className="flex items-center gap-2">
          {sessao && <Link href="/login" className="rounded-lg bg-amber-500 px-3 py-2 font-semibold text-black">Sessão expirada: entrar</Link>}
          <button onClick={sync} disabled={a_enviar} className="rounded-lg bg-white px-3 py-2 font-semibold text-gray-900 disabled:opacity-50">
            {a_enviar ? 'A enviar...' : 'Sincronizar agora'}
          </button>
        </div>
      </div>

      {erros.length > 0 && (
        <ul className="mx-auto mt-3 max-w-3xl space-y-2">
          {erros.map((i) => (
            <li key={i.uuid} className="rounded-lg bg-red-950 p-3">
              <div className="font-semibold">{i.resumo}</div>
              <div className="text-red-200">{i.erro}</div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => tentarDeNovo(i.uuid).then(sync)} className="rounded bg-white px-3 py-1.5 font-semibold text-gray-900">Tentar de novo</button>
                <button
                  onClick={() => { if (confirm('Descartar este registo? Não poderá ser recuperado.')) remover(i.uuid); }}
                  className="rounded border border-red-400 px-3 py-1.5"
                >
                  Descartar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
