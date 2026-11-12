import Link from 'next/link';
import { Icon } from './icons';

export default function PageHeader({
  title,
  subtitle,
  back,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex min-h-[60px] flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-2">
      <div className="flex items-center gap-3">
        {back && (
          <Link href={back} aria-label="Voltar" className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-600 active:bg-gray-100">
            <Icon name="back" />
          </Link>
        )}
        <div>
          <h1 className="font-display text-[17px] font-bold tracking-tight text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex gap-2">{children}</div>
    </header>
  );
}
