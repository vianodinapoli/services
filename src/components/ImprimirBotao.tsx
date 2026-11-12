'use client';

import { Icon } from './icons';

export default function ImprimirBotao() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-800 bg-white text-sm font-semibold text-gray-900 active:bg-gray-100"
    >
      <Icon name="print" className="h-4 w-4" />
      Imprimir
    </button>
  );
}
