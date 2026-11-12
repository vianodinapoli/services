import { notFound } from 'next/navigation';
import PrintButton from '@/components/PrintButton';
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
  const linha = (k: string, v: string) => (<div className="flex justify-between border-b border-dashed py-1"><span className="text-slate-500">{k}</span><b>{v}</b></div>);
  return (
    <div className="mx-auto max-w-md bg-white p-6 text-sm">
      <div className="mb-3 text-center">
        <div className="text-lg font-extrabold">TICKET DE DESCARGA {d.status !== 'confirmed' && '(PROVISÓRIO)'}</div>
        <div className="text-xs text-slate-500">{op.empresa} · {op.navio}</div>
      </div>
      {linha('Ticket', `T-${String(d.id).padStart(5, '0')}`)}{linha('Guia', d.numeroGuia)}{linha('Data', fmtData(d.data))}
      {linha('Motorista', d.motorista)}{linha('Matrícula', d.matricula)}{linha('Transportadora', d.transportadora)}
      {d.items.map((i) => linha(i.nome, `${fmt(i.quantidade)} ${i.unidade === 'saco' ? 'sacos' : 't'}`))}
      {linha('Peso cheio (kg)', d.pesoBruto !== null ? fmt0(d.pesoBruto) : '—')}
      {linha('Peso vazio (kg)', d.tara !== null ? fmt0(d.tara) : '—')}
      {linha('Peso líquido (kg)', d.pesoLiquido !== null ? fmt0(d.pesoLiquido) : '—')}
      <div className="mt-10 flex justify-between text-xs text-slate-500"><span className="border-t pt-1">Balanceiro</span><span className="border-t pt-1">Motorista</span></div>
      <PrintButton />
    </div>
  );
}
