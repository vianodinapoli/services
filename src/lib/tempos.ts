const FUSO = 'Africa/Maputo';

function partes(iso: string | null | undefined, opcoes: Intl.DateTimeFormatOptions) {
  if (!iso) return null;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  const mapa: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat('pt-PT', { ...opcoes, hourCycle: 'h23', timeZone: FUSO }).formatToParts(t)) {
    mapa[p.type] = p.value;
  }
  return mapa;
}

/** "08:40" na hora de Maputo, ou null. */
export function horaMaputo(iso: string | null | undefined): string | null {
  const p = partes(iso, { hour: '2-digit', minute: '2-digit' });
  return p ? `${p.hour}:${p.minute}` : null;
}

/** "19/11 08:40" na hora de Maputo, ou null. */
export function dataHoraMaputo(iso: string | null | undefined): string | null {
  const p = partes(iso, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return p ? `${p.day}/${p.month} ${p.hour}:${p.minute}` : null;
}
