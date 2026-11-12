'use client';
export default function PrintButton() {
  return <button onClick={() => window.print()} className="mt-6 w-full rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white print:hidden">Imprimir</button>;
}
