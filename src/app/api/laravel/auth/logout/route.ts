import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const jar = await cookies();
  const token = jar.get('token')?.value;

  if (token) {
    await fetch(`${process.env.LARAVEL_API_URL}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    }).catch(() => {});
  }

  jar.delete('token');
  jar.delete('user');
  return NextResponse.json({ ok: true });
}
