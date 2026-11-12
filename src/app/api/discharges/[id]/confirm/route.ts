import { mutate } from '@/lib/db';
import { Ctx, body, hhmm, invalid, notFound, num, ok, str } from '@/lib/http';

export async function PATCH(req: Request, { params }: Ctx) {
  const id = Number((await params).id), b = await body(req);
  return mutate((db) => {
    const d = db.discharges.find((x) => x.id === id);
    if (!d) return notFound();
    const hora = hhmm(b.horaChegadaBalanca), bruto = num(b.pesoBruto), tara = num(b.tara);
    const erros: string[] = [];
    if (!hora) erros.push('Indique a hora de chegada à balança.');
    if (Number.isNaN(bruto) || Number.isNaN(tara) || (bruto !== null && bruto < 0) || (tara !== null && tara < 0)) erros.push('Peso inválido.');
    if (bruto === null && tara === null) erros.push('Registe pelo menos um peso (cheio ou vazio).');
    if (bruto !== null && tara !== null && bruto <= tara) erros.push('O peso cheio tem de ser maior que o peso vazio.');
    const conf: Record<string, unknown> = typeof b.confirmados === 'object' && b.confirmados ? b.confirmados : {};
    for (const i of d.items) {
      const v = num(conf[String(i.operationItemId)]);
      if (v !== null && (Number.isNaN(v) || v < 0)) erros.push('Quantidade confirmada inválida.');
    }
    if (erros.length) return invalid(erros);

    d.horaChegadaBalanca = hora ?? null; d.pesoBruto = bruto; d.tara = tara; d.observacoes = str(b.observacoes);
    for (const i of d.items) { const v = num(conf[String(i.operationItemId)]); if (v !== null) i.quantidadeConfirmada = v; }
    d.status = bruto !== null && tara !== null ? 'confirmed' : 'weighing';
    return ok({ id, status: d.status });
  });
}
