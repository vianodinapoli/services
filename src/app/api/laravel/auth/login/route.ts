import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const offline = () =>
  NextResponse.json(
    { offline: true, message: 'Servidor indisponível. Tente novamente dentro de instantes.' },
    { status: 503 },
  );

const TIMEOUT_MS = Number(process.env.LARAVEL_TIMEOUT_MS ?? 10000);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Pedido inválido.' }, { status: 400 });
  }

  const base = process.env.LARAVEL_API_URL;
  if (!base) {
    console.error('[login] LARAVEL_API_URL não definida no .env.local');
    return offline();
  }

  const url = `${base}/login`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...body, device_name: 'tablet-porto' }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    console.error(`[login] falha de rede/timeout (${TIMEOUT_MS}ms) em ${url}:`, err);
    return offline();
  }

  // Funnel/Tailscale responde 502/503/504 quando o Laravel está em baixo
  if ([502, 503, 504].includes(res.status)) {
    console.error(`[login] gateway ${res.status} em ${url}`);
    return offline();
  }

  const raw = await res.text();
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error(`[login] resposta não-JSON de ${url} (HTTP ${res.status}):`, raw.slice(0, 500) || '(corpo vazio)');
    return offline();
  }

  if (!res.ok) {
    if (res.status >= 500) console.error(`[login] erro ${res.status} do Laravel:`, data);
    return NextResponse.json(data, { status: res.status });
  }

  if (!data.token) {
    console.error('[login] resposta OK mas sem token:', data);
    return offline();
  }

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