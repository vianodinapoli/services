import Link from 'next/link';
import { readDb } from '@/lib/db';
import { toOperation } from '@/lib/serialize';
import { fmt1 } from '@/lib/logic';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ arquivo?: string }> }) {
  const arquivo = !!(await searchParams).arquivo;
  const db = await readDb();
  const ops = db.operations
    .filter((o) => !!o.archivedAt === arquivo)
    .map((o) => ({ o, ds: db.discharges.filter((d) => d.operationId === o.id) }))
    .reverse();

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Descargas de navio</h1>
          <div className="mt-1 flex gap-3 text-sm">
            <Link href="/operations" className={arquivo ? 'text-slate-400' : 'font-bold text-blue-600'}>Em curso</Link>
            <Link href="/operations?arquivo=1" className={arquivo ? 'font-bold text-blue-600' : 'text-slate-400'}>Arquivo</Link>
          </div>
        </div>
        {!arquivo && <Link href="/operations/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">+ Nova operação</Link>}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {ops.map(({ o, ds }) => {
          const op = toOperation(o, ds);
          return (
            <Link key={o.id} href={`/operations/${o.id}`} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300">
              <div className="font-bold text-slate-800">{o.navio}</div>
              <div className="text-xs text-slate-400">{o.empresa} · BL {o.bl || '—'}</div>
              <div className="mt-3 h-2 overflow-hidden rounded bg-slate-100">
                <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, op.progresso)}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>{fmt1(op.recebidoTon)} / {fmt1(op.quantidadeEsperada)} t ({op.progresso}%)</span>
                <span>{ds.length} camiões</span>
              </div>
            </Link>
          );
        })}
        {ops.length === 0 && <p className="text-sm text-slate-400">{arquivo ? 'Sem operações arquivadas.' : 'Ainda não há operações. Crie a primeira.'}</p>}
      </div>
    </div>
  );
}
