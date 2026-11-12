import { mutate, readDb } from '@/lib/db';
import { Ctx, body, invalid, notFound, ok } from '@/lib/http';
import { toDischarge } from '@/lib/serialize';
import { garantirTransportadora, validateDischarge } from '@/lib/validate';

export async function GET(_: Request, { params }: Ctx) {
  const id = Number((await params).id), db = await readDb();
  const d = db.discharges.find((x) => x.id === id), op = d && db.operations.find((o) => o.id === d.operationId);
  return d && op ? ok(toDischarge(d, op)) : notFound();
}
export async function PUT(req: Request, { params }: Ctx) {
  const id = Number((await params).id), b = await body(req);
  return mutate((db) => {
    const d = db.discharges.find((x) => x.id === id), op = d && db.operations.find((o) => o.id === d.operationId);
    if (!d || !op) return notFound();
    const v = validateDischarge(b, op);
    if (v.errors.length) return invalid(v.errors);
    const guia = v.value.numeroGuia ?? d.numeroGuia;
    if (db.discharges.some((x) => x.id !== id && x.operationId === op.id && x.numeroGuia === guia)) return invalid([`A guia ${guia} já existe nesta operação.`]);
    garantirTransportadora(op, v.value.transportadora);
    Object.assign(d, v.value, { numeroGuia: guia });
    if (d.status === 'pending' || d.status === 'in_transit') d.status = d.horaSaidaPorto ? 'in_transit' : 'pending';
    d.items = v.items.map((i) => ({ ...i, quantidadeConfirmada: d.items.find((x) => x.operationItemId === i.operationItemId)?.quantidadeConfirmada ?? null }));
    return ok({ id });
  });
}
export async function DELETE(_: Request, { params }: Ctx) {
  const id = Number((await params).id);
  return mutate((db) => {
    const n = db.discharges.length;
    db.discharges = db.discharges.filter((d) => d.id !== id);
    return n === db.discharges.length ? notFound() : ok({ ok: true });
  });
}
