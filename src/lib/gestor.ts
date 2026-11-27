import { cookies } from 'next/headers';

/** "Super Admin", "super-admin", "super_admin"… ficam todos iguais: "superadmin". */
const normalizar = (v: unknown) => String(v ?? '').toLowerCase().replace(/[\s_-]+/g, '').trim();

const PODEM_EDITAR = ['gestor', 'superadmin'];

/** Roles da sessão, lidos do mesmo cookie "user" que a Sidebar usa. */
export async function lerRoles(): Promise<string[]> {
  const raw = (await cookies()).get('user')?.value;
  if (!raw) return [];

  const tentativas = [raw, (() => { try { return decodeURIComponent(raw); } catch { return raw; } })()];
  for (const v of tentativas) {
    try {
      const u = JSON.parse(v);
      const lista = [u.role, ...(Array.isArray(u.roles) ? u.roles : [])]
        .map((r) => (typeof r === 'object' && r ? (r.name ?? r.nome ?? '') : r))
        .map((r) => String(r ?? '').trim())
        .filter(Boolean);
      return Array.from(new Set(lista));
    } catch {}
  }
  return [];
}

/** Pode editar quem tiver o role "gestor" ou "super admin". (O Laravel volta a validar.) */
export async function souGestor(): Promise<boolean> {
  return (await lerRoles()).some((r) => PODEM_EDITAR.includes(normalizar(r)));
}
