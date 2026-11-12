export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-[1.1em] w-[1.1em] animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function PageLoader({
  text = 'A carregar',
  sub,
  fullscreen = true,
}: {
  text?: string;
  sub?: string;
  fullscreen?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={
        fullscreen
          ? 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm'
          : 'flex min-h-[60vh] items-center justify-center'
      }
    >
      <div
        className={`flex flex-col items-center gap-5 rounded-2xl px-10 py-8 ${
          fullscreen ? 'bg-white shadow-2xl' : ''
        }`}
      >
        <div className="bar-loader" />
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700">{text}</div>
          {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
        </div>
      </div>
    </div>
  );
}



export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}