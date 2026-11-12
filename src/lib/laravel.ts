import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function laravel<T>(path: string): Promise<T> {
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect('/login');

  const res = await fetch(`${process.env.LARAVEL_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });

  if (res.status === 401) redirect('/api/laravel/auth/expired');
  if (!res.ok) throw new Error(`Erro ${res.status} ao contactar o servidor.`);
  return res.json();
}
