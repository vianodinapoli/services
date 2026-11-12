import { mutate } from '@/lib/db';
import { body, invalid, notFound, ok } from '@/lib/http';
import { garantirTransportadora, validateDischarge } from '@/lib/validate';

export async function POST(req: Request) {
  const b = await body(req);
  return mutate((db) => {
    const op = db.operations.find((o) => o.id === Number(b.operationId));
    if (!op) return notFound();
    if (op.archivedAt) return invalid(['Esta operação está arquivada.']);
    const v = validateDischarge(b, op);
    if (v.errors.length) return invalid(v.errors);

    const id = ++db.seq.discharge;
    const guia = v.value.numeroGuia ?? `G-${String(id).padStart(4, '0')}`;
    if (db.discharges.some((d) => d.operationId === op.id && d.numeroGuia === guia)) return invalid([`A guia ${guia} já existe nesta operação.`]);
    garantirTransportadora(op, v.value.transportadora);
    db.discharges.push({
      id, operationId: op.id, ...v.value, numeroGuia: guia, horaChegadaBalanca: null, pesoBruto: null, tara: null,
      status: v.value.horaSaidaPorto ? 'in_transit' : 'pending',
      items: v.items.map((i) => ({ ...i, quantidadeConfirmada: null })),
    });
    return ok({ id }, 201);
  });
}
