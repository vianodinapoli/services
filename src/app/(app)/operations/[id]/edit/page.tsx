import { notFound } from 'next/navigation';
import OperationForm from '@/components/OperationForm';
import { readDb } from '@/lib/db';
import { toOperation } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const op = db.operations.find((o) => o.id === Number(id));
  if (!op) notFound();
  return <OperationForm operation={toOperation(op, db.discharges.filter((d) => d.operationId === op.id))} />;
}
