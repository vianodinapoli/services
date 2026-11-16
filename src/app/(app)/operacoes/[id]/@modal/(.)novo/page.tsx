import Modal from '@/components/Modal';
import { laravel } from '@/lib/laravel';
import type { Operation } from '@/lib/laravel-types';
import NovaDescargaForm from '../../novo/form';

export default async function NovoNoModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operation = await laravel<Operation>(`/operations/${id}`);

  return (
    <Modal titulo="Registar novo camião">
      <NovaDescargaForm operation={operation} />
    </Modal>
  );
}
