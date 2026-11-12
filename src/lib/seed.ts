import type { ContentorRow, DB } from './db';

const pad = (n: number) => String(n).padStart(2, '0');
const dia = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hora = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function seed(): DB {
  const ago = (m: number) => new Date(Date.now() - m * 60000);
  const dias = (n: number) => dia(new Date(Date.now() - n * 86400000));
  const c = (id: number, numero: string, estado: string, cliente: string | null, n: number | null): ContentorRow => ({
    id, numero, tipo: '20GP', estado, armador: 'MSC', cliente, navio: 'MV Ocean Star', bl: `BL${id}00`, selo: `S${id}`,
    pesoKg: 24000, localizacao: `Bloco A · Fila ${id}`, dataEntrada: n === null ? null : dias(n), dataSaida: null, observacoes: null,
  });
  const base = { operationId: 1, assinado: false, horaChegadaBalanca: null, pesoBruto: null, tara: null, observacoes: null };

  return {
    seq: { contentor: 5, operation: 1, item: 2, discharge: 3 },
    contentores: [
      c(1, 'MSKU1234565', 'no_parque', 'Agro Sul', 3), c(2, 'TCLU7654321', 'no_parque', 'Agro Sul', 12),
      c(3, 'CMAU1112223', 'carregado', 'Moz Fertil', 5), c(4, 'MRKU9988776', 'em_transito', null, null),
      c(5, 'HLXU4455667', 'saiu', 'Moz Fertil', 20),
    ],
    operations: [{
      id: 1, navio: 'MV Ocean Star', empresa: 'FEM', bl: 'BL-778899', factura: 'FAT-0101-2026',
      dataChegada: dia(new Date()), startedAt: new Date().toISOString(), archivedAt: null,
      metadata: {}, observacoes: 'Operação de exemplo — pode apagar.',
      transportadoras: [{ nome: 'TransMoz' }, { nome: 'Cargas do Sul' }],
      planItems: [
        { id: 1, nome: 'Nitrato 50kg', quantidade: 3000, unidade: 'saco', pesoUnitarioKg: 50 },
        { id: 2, nome: 'Nitrato 25kg', quantidade: 2000, unidade: 'saco', pesoUnitarioKg: 25 },
      ],
    }],
    discharges: [
      { ...base, id: 1, data: dia(new Date()), numeroGuia: 'G-0001', motorista: 'João Macie', matricula: 'AFG 123 MC',
        transportadora: 'TransMoz', tipoAtrelado: 'normal', horaSaidaPorto: '07:10', horaChegadaBalanca: '08:05',
        pesoBruto: 52400, tara: 18200, status: 'confirmed', items: [{ operationItemId: 1, quantidade: 680, quantidadeConfirmada: 680 }] },
      { ...base, id: 2, data: dia(ago(95)), numeroGuia: 'G-0002', motorista: 'Armando Sitoe', matricula: 'AHD 789 MC',
        transportadora: 'Cargas do Sul', tipoAtrelado: 'link', horaSaidaPorto: hora(ago(95)), status: 'in_transit',
        items: [{ operationItemId: 1, quantidade: 680, quantidadeConfirmada: null }] },
      { ...base, id: 3, data: dia(ago(20)), numeroGuia: 'G-0003', motorista: 'Mário Tembe', matricula: 'AKL 654 MP',
        transportadora: 'TransMoz', tipoAtrelado: null, horaSaidaPorto: hora(ago(20)), status: 'in_transit',
        items: [{ operationItemId: 1, quantidade: 400, quantidadeConfirmada: null }, { operationItemId: 2, quantidade: 300, quantidadeConfirmada: null }] },
    ],
  };
}
