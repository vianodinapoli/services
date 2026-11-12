import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const jar = await cookies();
  jar.delete('token');
  jar.delete('user');
  return NextResponse.redirect(new URL('/login', req.url));
}
