import { NextResponse } from 'next/server';

export type Rec = Record<string, any>;
export type Ctx = { params: Promise<{ id: string }> };

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const invalid = (errors: string[]) => NextResponse.json({ message: errors[0] ?? 'Dados inválidos.', errors: { geral: errors } }, { status: 422 });
export const notFound = () => NextResponse.json({ message: 'Não encontrado.' }, { status: 404 });
export const body = async (req: Request): Promise<Rec> => { try { return (await req.json()) as Rec; } catch { return {}; } };
export const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
/** número, null se vazio, NaN se inválido */
export const num = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : NaN);
/** data YYYY-MM-DD, null se vazia, undefined se inválida */
export const dt = (v: unknown): string | null | undefined => { const s = str(v); if (!s) return null; return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : undefined; };
export const hhmm = (v: unknown): string | null | undefined => { const s = str(v); if (!s) return null; return /^\d{2}:\d{2}/.test(s) ? s.slice(0, 5) : undefined; };
