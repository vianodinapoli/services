export type FeitoMsg = { titulo?: string; subtitulo?: string };

/** Mostra a animação "Feito!" no centro do ecrã, a partir de qualquer sítio da app. */
export function mostrarFeito(msg: FeitoMsg = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<FeitoMsg>('feito:mostrar', { detail: msg }));
}
