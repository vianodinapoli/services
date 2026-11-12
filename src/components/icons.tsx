const P: Record<string, string> = {
  ship: 'M3 17l2 3h14l2-3-9-3-9 3z M6 14V9h12v5 M10 9V5h4v4',
  box: 'M21 8l-9-5-9 5v8l9 5 9-5V8z M3 8l9 5 9-5 M12 13v8',
  anchor: 'M12 7v14 M5 12H3a9 9 0 0 0 18 0h-2 M8 12h8 M10 5a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  truck: 'M2 6h12v10H2z M14 9h4l4 4v3h-8z M5.5 18a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0 M15.5 18a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0',
  menu: 'M4 6h16M4 12h16M4 18h16',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  plus: 'M12 5v14M5 12h14',
  alert: 'M12 9v4 M12 17h.01 M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  check: 'M20 6L9 17l-5-5',
  chevron: 'M15 6l-6 6 6 6',
  back: 'M15 18l-6-6 6-6',
  close: 'M6 6l12 12M18 6L6 18',
  play: 'M5 3l14 9-14 9z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  ticket: 'M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6z M9 5v14',
  print: 'M6 9V3h12v6 M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2 M6 14h12v7H6z',
};

export function Icon({ name, className = 'h-5 w-5' }: { name: keyof typeof P; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}
