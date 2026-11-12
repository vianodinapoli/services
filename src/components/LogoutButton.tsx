'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function sair() {
    await fetch('/api/laravel/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button onClick={sair} className="h-12 rounded-lg border px-5 text-base font-medium">
      Sair
    </button>
  );
}
