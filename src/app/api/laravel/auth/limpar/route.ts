import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const jar = await cookies();
  jar.delete('token');
  jar.delete('user');
  return NextResponse.redirect(new URL('/login?erro=servidor', req.url));
}
