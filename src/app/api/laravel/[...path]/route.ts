import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const offline = () =>
  NextResponse.json(
    { offline: true, message: 'Servidor indisponível. Tente novamente dentro de instantes.' },
    { status: 503 },
  );

// Códigos que o túnel (Cloudflare/Funnel/Tailscale) devolve quando o Laravel está em baixo
const SERVIDOR_EM_BAIXO = [502, 503, 504, 521, 522, 523, 524, 530];

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const token = (await cookies()).get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const base = process.env.LARAVEL_API_URL;
  if (!base) return offline();

  const hasBody = !['GET', 'HEAD'].includes(req.method);

  try {
    const res = await fetch(`${base}/${path.join('/')}${req.nextUrl.search}`, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(hasBody && { 'Content-Type': 'application/json' }),
      },
      body: hasBody ? await req.text() : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000), // não ficar pendurado
    });

    if (SERVIDOR_EM_BAIXO.includes(res.status)) return offline();

    return new NextResponse(res.body, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
    });
  } catch {
    return offline();
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
