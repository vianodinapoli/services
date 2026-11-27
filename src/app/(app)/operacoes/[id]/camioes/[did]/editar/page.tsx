import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { laravel } from '@/lib/laravel';
import { souGestor, lerRoles } from '@/lib/gestor';
import PageHeader from '@/components/PageHeader';
import FormEditarCamiao, { type DadosCamiao } from '@/components/FormEditarCamiao';

export default async function EditarCamiaoPage({
  params,
}: {
  params: Promise<{ id: string; did: string }>;
}) {
  const { id, did } = await params;
  const voltarHref = `/operacoes/${id}`;

  // Só o role "gestor" pode editar. Qualquer outro volta à lista.
  if (!(await souGestor())) {
    const roles = await lerRoles();
    return (
      <>
        <PageHeader title="Editar camião" subtitle="Sem permissão" back={voltarHref} />
        <div className="mx-auto w-full max-w-xl px-4 pt-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Não tem permissão para editar</h2>
            <p className="mt-2 text-base text-slate-600">
              Só os roles <b>gestor</b> e <b>super admin</b> podem editar registos.
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Roles desta sessão:{' '}
              <span className="font-semibold text-slate-700">{roles.length ? roles.join(', ') : 'nenhum'}</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Se o role foi atribuído agora, saia da app e entre outra vez.
            </p>
            <Link
              href={voltarHref}
              className="mt-5 inline-flex h-12 items-center rounded-xl bg-accent px-6 text-base font-semibold text-white"
            >
              Voltar à lista
            </Link>
          </div>
        </div>
      </>
    );
  }

  const camiao = await laravel<DadosCamiao>(`/discharges/${did}`).catch(() => null);
  if (!camiao) notFound();

  return (
    <>
      <PageHeader title="Editar camião" subtitle={camiao.matricula} back={voltarHref} />
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 md:px-8 md:pt-10">
        <FormEditarCamiao camiao={camiao} voltarHref={voltarHref} />
      </div>
    </>
  );
}
