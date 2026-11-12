import { laravel } from '@/lib/laravel';
import PageHeader from '@/components/PageHeader';
import NovaDescargaForm from './form';
import type { Operation } from '@/lib/laravel-types';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operation = await laravel<Operation>(`/operations/${id}`);

  return (
    <>
      <PageHeader title="Novo camião" subtitle={operation.navio} back={`/operacoes/${operation.id}`} />
      <NovaDescargaForm operation={operation} />
    </>
  );
}
