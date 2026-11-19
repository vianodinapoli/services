'use client';

import { useEffect, useRef } from 'react';

const CORES = ['#16a34a', '#22c55e', '#facc15', '#38bdf8', '#f97316', '#a78bfa'];
const PONTOS = 14;

export default function FeitoAnimado({
  titulo = 'Feito!',
  subtitulo,
  duracao = 1900,
  onFim,
}: {
  titulo?: string;
  subtitulo?: string;
  duracao?: number;
  onFim: () => void;
}) {
  const fim = useRef(onFim);
  fim.current = onFim;

  useEffect(() => {
    try {
      navigator.vibrate?.([60, 40, 60]);
    } catch {
      /* sem vibração neste dispositivo */
    }
    const t = setTimeout(() => fim.current(), duracao);
    return () => clearTimeout(t);
  }, [duracao]);

  return (
    <div className="fa-overlay" role="status" aria-live="polite" onClick={() => fim.current()}>
      <div className="fa-card">
        <div className="fa-badge">
          <span className="fa-ring" />
          <span className="fa-ring fa-ring2" />

          <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
            <circle className="fa-fill" cx="60" cy="60" r="54" />
            <circle className="fa-circle" cx="60" cy="60" r="54" transform="rotate(-90 60 60)" />
            <path className="fa-check" d="M36 62 L53 78 L85 44" />
          </svg>

          {Array.from({ length: PONTOS }).map((_, i) => (
            <span
              key={i}
              className="fa-dot"
              style={
                {
                  '--a': `${(360 / PONTOS) * i}deg`,
                  background: CORES[i % CORES.length],
                  animationDelay: `${0.65 + (i % 3) * 0.04}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="fa-titulo">{titulo}</div>
        {subtitulo && <div className="fa-sub">{subtitulo}</div>}
      </div>

      <style>{`
        .fa-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
          background:rgba(15,23,42,.55);backdrop-filter:blur(3px);animation:fa-fade .2s ease-out}
        .fa-card{display:flex;flex-direction:column;align-items:center;gap:10px;background:#fff;border-radius:28px;
          padding:36px 56px 32px;box-shadow:0 30px 80px rgba(0,0,0,.35);
          animation:fa-pop .55s cubic-bezier(.2,1.4,.4,1) both}
        .fa-badge{position:relative;width:120px;height:120px}
        .fa-badge svg{position:relative;z-index:1}

        .fa-circle{stroke:#16a34a;stroke-width:6;fill:none;stroke-linecap:round;
          stroke-dasharray:340;stroke-dashoffset:340;animation:fa-draw .6s .15s ease-out forwards}
        .fa-fill{fill:#dcfce7;opacity:0;transform-origin:60px 60px;animation:fa-fill .35s .5s ease-out forwards}
        .fa-check{stroke:#16a34a;stroke-width:9;stroke-linecap:round;stroke-linejoin:round;fill:none;
          stroke-dasharray:80;stroke-dashoffset:80;animation:fa-draw .4s .6s ease-out forwards}

        .fa-ring{position:absolute;inset:0;border-radius:50%;border:4px solid #22c55e;opacity:0;
          animation:fa-ring .9s .6s ease-out forwards}
        .fa-ring2{animation-delay:.8s}

        .fa-dot{position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;
          opacity:0;animation:fa-burst .85s ease-out forwards}

        .fa-titulo{margin-top:6px;font-size:30px;font-weight:800;color:#0f172a;
          animation:fa-up .4s .75s ease-out both}
        .fa-sub{font-size:16px;color:#64748b;text-align:center;max-width:280px;
          animation:fa-up .4s .9s ease-out both}

        @keyframes fa-fade{from{opacity:0}to{opacity:1}}
        @keyframes fa-pop{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes fa-draw{to{stroke-dashoffset:0}}
        @keyframes fa-fill{0%{opacity:0;transform:scale(.7)}100%{opacity:1;transform:scale(1)}}
        @keyframes fa-ring{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(1.9)}}
        @keyframes fa-burst{
          0%{opacity:1;transform:rotate(var(--a)) translateY(-62px) scale(1)}
          100%{opacity:0;transform:rotate(var(--a)) translateY(-120px) scale(.3)}}
        @keyframes fa-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

        @media (prefers-reduced-motion:reduce){
          .fa-card,.fa-titulo,.fa-sub{animation:none}
          .fa-circle,.fa-check{animation:none;stroke-dashoffset:0}
          .fa-fill{animation:none;opacity:1}
          .fa-ring,.fa-dot{display:none}
        }
      `}</style>
    </div>
  );
}
