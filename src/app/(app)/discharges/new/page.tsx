import { notFound } from 'next/navigation';
import DischargeForm from '@/components/DischargeForm';
import { readDb } from '@/lib/db';
import { toOperation } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ operation_id?: string }> }) {
  const { operation_id } = await searchParams;
  const db = await readDb();
  const op = db.operations.find((o) => o.id === Number(operation_id));
  if (!op) notFound();
  return <DischargeForm operation={toOperation(op, db.discharges.filter((d) => d.operationId === op.id))} />;
}
