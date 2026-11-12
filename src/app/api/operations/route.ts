import { OperationRow, mutate } from '@/lib/db';
import { body, invalid, ok } from '@/lib/http';
import { validateOperation } from '@/lib/validate';

export async function POST(req: Request) {
  const b = await body(req);
  return mutate((db) => {
    const v = validateOperation(b);
    if (v.errors.length) return invalid(v.errors);
    const row: OperationRow = {
      id: ++db.seq.operation, ...v.value, startedAt: new Date().toISOString(), archivedAt: null, metadata: {},
      transportadoras: v.transp.map((nome) => ({ nome })),
      planItems: v.items.map((p) => ({ id: ++db.seq.item, nome: p.nome, quantidade: p.quantidade, unidade: p.unidade, pesoUnitarioKg: p.pesoUnitarioKg })),
    };
    db.operations.push(row);
    return ok({ id: row.id }, 201);
  });
}
