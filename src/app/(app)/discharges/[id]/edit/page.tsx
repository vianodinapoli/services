import { notFound } from 'next/navigation';
import DischargeForm from '@/components/DischargeForm';
import { readDb } from '@/lib/db';
import { toDischarge, toOperation } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const d = db.discharges.find((x) => x.id === Number(id));
  const op = d && db.operations.find((o) => o.id === d.operationId);
  if (!d || !op) notFound();
  return <DischargeForm operation={toOperation(op, db.discharges.filter((x) => x.operationId === op.id))} discharge={toDischarge(d, op)} />;
}
