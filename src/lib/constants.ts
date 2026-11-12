export const ESTADOS: Record<string, string> = {
  no_parque: 'No parque', em_transito: 'Em trânsito', descarregado: 'Descarregado',
  carregado: 'Carregado', vazio: 'Vazio', saiu: 'Saiu',
};
export const TIPOS = ['20GP', '40GP', '40HC', '20RF', '40RF'];
export const LIMITE_DIAS = 7;          // dias no parque antes de alertar
export const LIMITE_ATRELADO_T = 24;   // normal até 24 t, link acima
