import type { ContentorRow, DB, DischargeRow, OperationRow } from './db';
import { ESTADOS, TIPOS } from './constants';
import { Rec, dt, hhmm, num, str } from './http';

export function validateContentor(b: Rec, db: DB, ignoreId?: number) {
  const errors: string[] = [];
  const numero = (str(b.numero) ?? '').toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z]{4}\d{7}$/.test(numero)) errors.push('O número do contentor deve ter 4 letras e 7 dígitos (ISO 6346).');
  else if (db.contentores.some((c) => c.numero === numero && c.id !== ignoreId)) errors.push('Já existe um contentor com este número.');
  const tipo = str(b.tipo) ?? '';
  if (!TIPOS.includes(tipo)) errors.push('Tipo inválido.');
  const estado = str(b.estado) ?? '';
  if (!(estado in ESTADOS)) errors.push('Estado inválido.');
  const pesoKg = num(b.pesoKg);
  if (Number.isNaN(pesoKg) || (pesoKg !== null && pesoKg < 0)) errors.push('Peso inválido.');
  const dataEntrada = dt(b.dataEntrada), dataSaida = dt(b.dataSaida);
  if (dataEntrada === undefined || dataSaida === undefined) errors.push('Data inválida.');
  else if (dataEntrada && dataSaida && dataSaida < dataEntrada) errors.push('A data de saída não pode ser anterior à entrada.');
  const value: Omit<ContentorRow, 'id'> = {
    numero, tipo, estado, armador: str(b.armador), cliente: str(b.cliente), navio: str(b.navio), bl: str(b.bl), selo: str(b.selo),
    pesoKg: pesoKg === null || Number.isNaN(pesoKg) ? null : pesoKg, localizacao: str(b.localizacao),
    dataEntrada: dataEntrada ?? null, dataSaida: dataSaida ?? null, observacoes: str(b.observacoes),
  };
  return { errors, value };
}

export function validateOperation(b: Rec) {
  const errors: string[] = [];
  const navio = str(b.navio), empresa = str(b.empresa);
  if (!navio) errors.push('Indique o nome do navio.');
  if (!empresa) errors.push('Indique a empresa.');
  const dataChegada = dt(b.dataChegada);
  if (dataChegada === undefined) errors.push('Data de chegada inválida.');
  const transp = (Array.isArray(b.transportadoras) ? b.transportadoras : []).map(str).filter(Boolean) as string[];
  const items: { id: number | null; nome: string; quantidade: number; unidade: 'saco' | 'tonelada'; pesoUnitarioKg: number | null }[] = [];
  (Array.isArray(b.planItems) ? b.planItems : []).forEach((p: Rec, i: number) => {
    const nome = str(p.nome), q = num(p.quantidade), peso = num(p.pesoUnitarioKg);
    const unidade = p.unidade === 'tonelada' ? 'tonelada' : 'saco';
    if (!nome) return errors.push(`Produto ${i + 1}: indique o nome.`) as unknown as void;
    if (q === null || Number.isNaN(q) || q <= 0) return errors.push(`${nome}: quantidade inválida.`) as unknown as void;
    if (unidade === 'saco' && (peso === null || Number.isNaN(peso) || peso <= 0)) return errors.push(`${nome}: indique o peso do saco (kg).`) as unknown as void;
    items.push({ id: Number(p.id) || null, nome, quantidade: q, unidade, pesoUnitarioKg: unidade === 'saco' ? (peso as number) : null });
  });
  if (!items.length && !errors.length) errors.push('Adicione pelo menos um produto ao plano.');
  return {
    errors, transp, items,
    value: { navio: navio ?? '', empresa: empresa ?? '', bl: str(b.bl), factura: str(b.factura), dataChegada: dataChegada ?? null, observacoes: str(b.observacoes) },
  };
}

export function validateDischarge(b: Rec, op: OperationRow) {
  const errors: string[] = [];
  const data = dt(b.data);
  if (!data) errors.push('Indique a data da descarga.');
  const motorista = str(b.motorista), matricula = str(b.matricula), transportadora = str(b.transportadora);
  if (!motorista) errors.push('Indique o motorista.');
  if (!matricula) errors.push('Indique a matrícula.');
  if (!transportadora) errors.push('Indique a transportadora.');
  const saida = hhmm(b.horaSaidaPorto);
  if (saida === undefined) errors.push('Hora de saída inválida.');
  const items: { operationItemId: number; quantidade: number }[] = [];
  (Array.isArray(b.items) ? b.items : []).forEach((i: Rec) => {
    const id = Number(i.operationItemId), q = num(i.quantidade);
    const p = op.planItems.find((x) => x.id === id);
    if (!p || q === null || Number.isNaN(q) || q <= 0) return;
    if (p.unidade === 'saco' && !Number.isInteger(q)) errors.push(`${p.nome}: o nº de sacos tem de ser inteiro.`);
    items.push({ operationItemId: id, quantidade: q });
  });
  if (!items.length) errors.push('Indique a quantidade de pelo menos um produto.');
  const tipoAtrelado = b.tipoAtrelado === 'normal' || b.tipoAtrelado === 'link' ? (b.tipoAtrelado as 'normal' | 'link') : null;
  return {
    errors, items,
    value: {
      data: data ?? '', numeroGuia: str(b.numeroGuia), motorista: motorista ?? '', matricula: matricula ?? '',
      transportadora: transportadora ?? '', assinado: !!b.assinado, tipoAtrelado,
      horaSaidaPorto: saida ?? null, observacoes: str(b.observacoes),
    },
  };
}

export function garantirTransportadora(op: OperationRow, nome: string) {
  if (!op.transportadoras.some((t) => t.nome.toLowerCase() === nome.toLowerCase())) op.transportadoras.push({ nome, extra: true });
}
export type { DischargeRow };
