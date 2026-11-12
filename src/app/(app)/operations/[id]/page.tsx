import { notFound } from 'next/navigation';
import OperationView from '@/components/OperationView';
import { readDb } from '@/lib/db';
import { toDischarge, toOperation } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const op = db.operations.find((o) => o.id === Number(id));
  if (!op) notFound();
  const ds = db.discharges.filter((d) => d.operationId === op.id);
  return <OperationView operation={toOperation(op, ds)} discharges={ds.map((d) => toDischarge(d, op))} />;
}
