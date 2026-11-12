import { mutate } from '@/lib/db';
import { Ctx, notFound, ok } from '@/lib/http';

export async function PATCH(_: Request, { params }: Ctx) {
  const id = Number((await params).id);

  return mutate((db) => {
    const op = db.operations.find((o) => o.id === id);
    if (!op) return notFound();

    op.archivedAt = null;

    return ok({ ok: true });
  });
}