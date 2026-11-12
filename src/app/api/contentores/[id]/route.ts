import { mutate } from '@/lib/db';
import { Ctx, body, invalid, notFound, ok } from '@/lib/http';
import { toContentor } from '@/lib/serialize';
import { validateContentor } from '@/lib/validate';

export async function PUT(req: Request, { params }: Ctx) {
  const id = Number((await params).id), b = await body(req);
  return mutate((db) => {
    const i = db.contentores.findIndex((c) => c.id === id);
    if (i < 0) return notFound();
    const v = validateContentor(b, db, id);
    if (v.errors.length) return invalid(v.errors);
    db.contentores[i] = { id, ...v.value };
    return ok(toContentor(db.contentores[i]));
  });
}
export async function DELETE(_: Request, { params }: Ctx) {
  const id = Number((await params).id);
  return mutate((db) => {
    const n = db.contentores.length;
    db.contentores = db.contentores.filter((c) => c.id !== id);
    return n === db.contentores.length ? notFound() : ok({ ok: true });
  });
}
