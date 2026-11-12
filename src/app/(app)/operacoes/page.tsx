import { laravel } from '@/lib/laravel';
import PageHeader from '@/components/PageHeader';
import OpCard from '@/components/OpCard';
import { Icon } from '@/components/icons';
import type { Operation } from '@/lib/laravel-types';

export default async function OperacoesPage() {
  const operations = await laravel<Operation[]>('/operations');

  return (
    <>
      <PageHeader title="Operações de Descarga" subtitle="Operações em curso: escolha o navio para registar camiões" />

      <div className="p-6">
        {operations.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            <Icon name="ship" className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3">Não há operações em curso. Inicie uma operação no sistema para poder lançar camiões.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {operations.map((op) => (
              <OpCard key={op.id} op={op} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
