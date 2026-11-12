import { mutate, readDb } from '@/lib/db';
import { body, invalid, ok } from '@/lib/http';
import { contentoresData, toContentor } from '@/lib/serialize';
import { validateContentor } from '@/lib/validate';

export async function GET() { return ok(contentoresData((await readDb()).contentores)); }

export async function POST(req: Request) {
  const b = await body(req);
  return mutate((db) => {
    const v = validateContentor(b, db);
    if (v.errors.length) return invalid(v.errors);
    const row = { id: ++db.seq.contentor, ...v.value };
    db.contentores.push(row);
    return ok(toContentor(row), 201);
  });
}
