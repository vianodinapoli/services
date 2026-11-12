import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${process.env.LARAVEL_API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...body, device_name: 'tablet-porto' }),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const jar = await cookies();
  const opts = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 12,
  };

  jar.set('token', data.token, { ...opts, httpOnly: true });
  jar.set(
    'user',
    JSON.stringify({ name: data.user?.name ?? '', role: Array.isArray(data.user?.roles) ? data.user.roles[0] ?? '' : '' }),
    { ...opts, httpOnly: false },
  );

  return NextResponse.json({ user: data.user });
}
