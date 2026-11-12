import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const token = (await cookies()).get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const hasBody = !['GET', 'HEAD'].includes(req.method);

  const res = await fetch(
    `${process.env.LARAVEL_API_URL}/${path.join('/')}${req.nextUrl.search}`,
    {
      method: req.method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(hasBody && { 'Content-Type': 'application/json' }),
      },
      body: hasBody ? await req.text() : undefined,
      cache: 'no-store',
    },
  );

  return new NextResponse(res.body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };
