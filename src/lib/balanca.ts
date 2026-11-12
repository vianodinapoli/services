// Leitura da balança por porta serial (Web Serial API — Chrome/Edge, só em HTTPS ou localhost)
export interface LerPesoOpts {
  baudRate?: number; parity?: 'none' | 'even' | 'odd'; dataBits?: number; stopBits?: number;
  onStatus?: (msg: string) => void; timeoutMs?: number;
}

let port: any = null;

export const Balanca = {
  async lerPeso(o: LerPesoOpts = {}): Promise<number> {
    const serial = (navigator as any).serial;
    if (!serial) throw new Error('Este navegador não suporta porta serial. Use Chrome ou Edge.');

    o.onStatus?.('A escolher a porta...');
    if (!port) port = await serial.requestPort();
    await port.open({
      baudRate: o.baudRate ?? 9600, parity: o.parity ?? 'none',
      dataBits: o.dataBits ?? 8, stopBits: o.stopBits ?? 1,
    });

    const decoder = new TextDecoderStream();
    const closed = port.readable.pipeTo(decoder.writable).catch(() => {});
    const reader = decoder.readable.getReader();
    const limite = Date.now() + (o.timeoutMs ?? 10000);

    let buffer = '';
    let ultimo: number | null = null;
    let iguais = 0;
    try {
      o.onStatus?.('A aguardar leitura estável...');
      while (Date.now() < limite) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const linhas = buffer.split(/[\r\n]+/);
        buffer = linhas.pop() ?? '';
        for (const linha of linhas) {
          const m = linha.match(/(\d+(?:[.,]\d+)?)/);
          if (!m) continue;
          const peso = parseFloat(m[1].replace(',', '.'));
          iguais = peso === ultimo ? iguais + 1 : 0;
          ultimo = peso;
          if (iguais >= 2) return peso; // 3 leituras iguais seguidas = peso estável
        }
      }
      throw new Error('Tempo esgotado sem leitura estável. Verifique a ligação e o baud rate.');
    } finally {
      await reader.cancel().catch(() => {});
      await closed;
      await port.close().catch(() => {});
    }
  },
  cancelar() { /* a leitura termina sozinha no timeout */ },
};
