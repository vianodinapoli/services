import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readDb } from '@/lib/db';
import { toDischarge } from '@/lib/serialize';
import { fmt, fmt0, fmtData } from '@/lib/logic';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const row = db.discharges.find((x) => x.id === Number(id));
  const op = row && db.operations.find((o) => o.id === row.operationId);
  if (!row || !op) notFound();
  const d = toDischarge(row, op);
  const campos: [string, string][] = [
    ['Guia', d.numeroGuia], ['Data', fmtData(d.data)], ['Estado', d.statusLabel], ['Motorista', d.motorista],
    ['Matrícula', d.matricula], ['Transportadora', d.transportadora], ['Atrelado', d.tipoAtrelado ?? '—'],
    ['Saída do porto', d.horaSaidaPorto?.slice(0, 5) ?? '—'], ['Chegada à balança', d.horaChegadaBalanca?.slice(0, 5) ?? '—'],
    ['Tempo de transporte', d.tempoTransporte !== null ? `${d.tempoTransporte} min` : '—'],
    ['Peso cheio', d.pesoBruto !== null ? `${fmt0(d.pesoBruto)} kg` : '—'], ['Peso vazio', d.tara !== null ? `${fmt0(d.tara)} kg` : '—'],
    ['Peso líquido', d.pesoLiquido !== null ? `${fmt0(d.pesoLiquido)} kg` : '—'], ['Observações', d.observacoes ?? '—'],
  ];
  return (
    <div className="mx-auto max-w-3xl p-4">
      <Link href={`/operations/${op.id}`} className="text-xs text-slate-400">← {op.navio}</Link>
      <div className="mb-3 mt-1 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Descarga #{d.id}</h1>
        <div className="flex gap-2 text-xs font-bold">
          <Link href={`/discharges/${d.id}/ticket`} target="_blank" className="rounded-lg border px-3 py-1.5">Ticket</Link>
          {!op.archivedAt && <Link href={`/discharges/${d.id}/edit`} className="rounded-lg bg-amber-500 px-3 py-1.5 text-white">Editar</Link>}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        {campos.map(([k, v]) => (<div key={k}><dt className="text-[11px] font-semibold uppercase text-slate-400">{k}</dt><dd>{v}</dd></div>))}
      </dl>
      <table className="mt-3 w-full rounded-xl border border-slate-200 bg-white text-sm">
        <thead><tr className="text-left text-[11px] uppercase text-slate-400"><th className="p-2">Produto</th><th className="p-2 text-right">Registado</th><th className="p-2 text-right">Confirmado</th></tr></thead>
        <tbody>{d.items.map((i) => (
          <tr key={i.operationItemId} className="border-t border-slate-100">
            <td className="p-2">{i.nome}</td><td className="p-2 text-right">{fmt(i.quantidade)} {i.unidade === 'saco' ? 'sacos' : 't'}</td>
            <td className="p-2 text-right">{i.quantidadeConfirmada !== null ? fmt(i.quantidadeConfirmada) : '—'}</td>
          </tr>))}</tbody>
      </table>
    </div>
  );
}
