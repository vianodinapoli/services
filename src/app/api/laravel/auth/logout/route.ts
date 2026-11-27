import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const jar = await cookies();
  const token = jar.get('token')?.value;
  const base = process.env.LARAVEL_API_URL;

  if (token && base) {
    await fetch(`${base}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000), // sair não deve esperar pelo servidor
    }).catch(() => {});
  }

  jar.delete('token');
  jar.delete('user');
  return NextResponse.json({ ok: true });
}