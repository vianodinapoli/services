import { mutate } from '@/lib/db';
import { Ctx, body, invalid, notFound, ok } from '@/lib/http';
import { validateOperation } from '@/lib/validate';

export async function PUT(req: Request, { params }: Ctx) {
  const id = Number((await params).id), b = await body(req);
  return mutate((db) => {
    const op = db.operations.find((o) => o.id === id);
    if (!op) return notFound();
    const v = validateOperation(b);
    if (v.errors.length) return invalid(v.errors);

    const ds = db.discharges.filter((d) => d.operationId === id);
    const manter = new Set(v.items.map((p) => p.id).filter(Boolean));
    const emUso = op.planItems.filter((p) => !manter.has(p.id) && ds.some((d) => d.items.some((i) => i.operationItemId === p.id)));
    if (emUso.length) return invalid([`Não pode remover "${emUso[0].nome}": já tem descargas lançadas.`]);

    Object.assign(op, v.value);
    op.planItems = v.items.map((p) => ({
      id: p.id && op.planItems.some((x) => x.id === p.id) ? p.id : ++db.seq.item,
      nome: p.nome, quantidade: p.quantidade, unidade: p.unidade, pesoUnitarioKg: p.pesoUnitarioKg,
    }));
    const extras = op.transportadoras.filter((t) => t.extra && !v.transp.some((n) => n.toLowerCase() === t.nome.toLowerCase()));
    op.transportadoras = [...v.transp.map((nome) => ({ nome })), ...extras];
    return ok({ id });
  });
}
export async function DELETE(_: Request, { params }: Ctx) {
  const id = Number((await params).id);
  return mutate((db) => {
    if (!db.operations.some((o) => o.id === id)) return notFound();
    if (db.discharges.some((d) => d.operationId === id)) return invalid(['Só pode eliminar operações sem descargas. Arquive-a em vez disso.']);
    db.operations = db.operations.filter((o) => o.id !== id);
    return ok({ ok: true });
  });
}
