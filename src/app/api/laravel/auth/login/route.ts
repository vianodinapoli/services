import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const offline = () =>
  NextResponse.json(
    { offline: true, message: 'Servidor indisponível. Tente novamente dentro de instantes.' },
    { status: 503 },
  );

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Pedido inválido.' }, { status: 400 });
  }

  const base = process.env.LARAVEL_API_URL;
  if (!base) return offline();

  let res: Response;
  try {
    res = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...body, device_name: 'tablet-porto' }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return offline();
  }

  // Funnel/Tailscale responde 502/503/504 quando o Laravel está em baixo
  if ([502, 503, 504].includes(res.status)) return offline();

  let data: any;
  try {
    data = await res.json();
  } catch {
    return offline(); // resposta não é JSON (ex.: página HTML de erro)
  }

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
    JSON.stringify({
      name: data.user?.name ?? '',
      role: Array.isArray(data.user?.roles) ? data.user.roles[0] ?? '' : '',
      roles: Array.isArray(data.user?.roles) ? data.user.roles : [],
    }),
    { ...opts, httpOnly: false },
  );

  return NextResponse.json({ user: data.user });
}