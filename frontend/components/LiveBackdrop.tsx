"use client";

// Kiln — Binance-dark NFT marketplace backdrop. Layers, back to front:
//   1. Near-black vignette + faint yellow ceiling glow
//   2. Trading grid (fine graphite lines, radial mask)
//   3. Candlestick ghost chart — green/red wicks drifting left like a
//      slow market tape, drawn twice for parallax depth
//   4. Floating holographic NFT cards — tilted rounded rects with a
//      shimmer sweep crossing their faces (trading-card energy)
//   5. Yellow diamond glints sparking at random intervals
//   6. Price-tape marquee along the top edge
//   7. Slow spotlight sweep
// GPU-friendly (transform/opacity/background-position), reduced-motion aware.

export function LiveBackdrop() {
  const tape =
    "· KILN LAUNCHPAD · EVERY COLLECTION ADJUDICATED BEFORE MINT · 10% OF MINTS FUND HOLDER PROTECTION · REPORTS RULED BY AI CONSENSUS · CRITICAL RULINGS FREEZE + REFUND · SEALED ON GENLAYER STUDIONET · ";

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="kl-vignette" />
      <div className="kl-grid" />

      {/* Candlestick ghost tape — two parallax layers */}
      <svg className="kl-candles kl-candles-far" viewBox="0 0 1600 400" preserveAspectRatio="none">
        {[
          [40, 210, 60, 40, 1], [130, 190, 40, 70, 0], [220, 230, 80, 30, 1],
          [310, 170, 50, 60, 1], [400, 240, 30, 50, 0], [490, 200, 70, 40, 1],
          [580, 160, 40, 80, 0], [670, 220, 60, 30, 1], [760, 180, 50, 70, 1],
          [850, 250, 40, 40, 0], [940, 200, 80, 50, 1], [1030, 170, 30, 60, 0],
          [1120, 230, 60, 40, 1], [1210, 190, 50, 50, 1], [1300, 210, 40, 70, 0],
          [1390, 160, 70, 40, 1], [1480, 240, 50, 30, 0],
        ].map(([x, y, body, wick, up], i) => {
          const color = up ? "#0ecb81" : "#f6465d";
          return (
            <g key={i} opacity="0.5">
              <line x1={x + 8} y1={y - wick} x2={x + 8} y2={y + body + wick} stroke={color} strokeWidth="1.5" />
              <rect x={x} y={y} width="16" height={body} fill={color} opacity="0.55" rx="1" />
            </g>
          );
        })}
      </svg>
      <svg className="kl-candles kl-candles-near" viewBox="0 0 1600 400" preserveAspectRatio="none">
        {[
          [80, 200, 70, 50, 0], [230, 160, 50, 80, 1], [380, 230, 40, 40, 1],
          [530, 180, 90, 30, 0], [680, 210, 50, 60, 1], [830, 150, 60, 70, 1],
          [980, 240, 30, 40, 0], [1130, 190, 70, 50, 1], [1280, 220, 40, 60, 0],
          [1430, 170, 80, 40, 1],
        ].map(([x, y, body, wick, up], i) => {
          const color = up ? "#0ecb81" : "#f6465d";
          return (
            <g key={i} opacity="0.7">
              <line x1={x + 11} y1={y - wick} x2={x + 11} y2={y + body + wick} stroke={color} strokeWidth="2" />
              <rect x={x} y={y} width="22" height={body} fill={color} opacity="0.6" rx="1.5" />
            </g>
          );
        })}
      </svg>

      {/* Floating holographic NFT cards */}
      <div className="kl-cards">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`kl-card kl-c${i}`}>
            <span className="kl-card-art" />
            <span className="kl-card-line" />
            <span className="kl-card-line kl-card-line-short" />
            <span className="kl-shimmer" />
          </span>
        ))}
      </div>

      {/* Yellow diamond glints */}
      <div className="kl-glints">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={`kl-glint kl-g${i}`} />
        ))}
      </div>

      {/* Price-tape marquee */}
      <div className="kl-tape">
        <div className="kl-tape-track">
          <span>{tape}{tape}{tape}</span>
        </div>
      </div>

      {/* Spotlight sweep */}
      <div className="kl-sweep" />

      <style jsx>{`
        .kl-vignette {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 50% 0%,
              rgba(252, 213, 53, 0.07) 0%, transparent 60%),
            radial-gradient(ellipse 90% 70% at 50% 100%,
              rgba(6, 8, 10, 0.9) 0%, transparent 60%),
            #0b0e11;
        }

        .kl-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(to right,  rgba(43, 49, 57, 0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(43, 49, 57, 0.4) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 85% 65% at 50% 40%, black 25%, transparent 90%);
          -webkit-mask-image: radial-gradient(ellipse 85% 65% at 50% 40%, black 25%, transparent 90%);
        }

        .kl-candles {
          position: absolute;
          left: 0; right: 0;
          width: 200%;
          mix-blend-mode: screen;
          will-change: transform;
        }
        .kl-candles-far {
          bottom: 6%;
          height: 34vh;
          opacity: 0.35;
          animation: klTape 90s linear infinite;
        }
        .kl-candles-near {
          bottom: 0;
          height: 40vh;
          opacity: 0.5;
          animation: klTape 55s linear infinite;
        }
        @keyframes klTape {
          from { transform: translateX(0);    }
          to   { transform: translateX(-50%); }
        }

        /* ── Holographic NFT cards ── */
        .kl-cards { position: absolute; inset: 0; }
        .kl-card {
          position: absolute;
          width: 120px; height: 160px;
          border-radius: 10px;
          background: linear-gradient(160deg,
            rgba(30, 35, 41, 0.85) 0%,
            rgba(20, 24, 29, 0.9) 100%);
          border: 1px solid rgba(252, 213, 53, 0.25);
          box-shadow:
            0 0 28px rgba(252, 213, 53, 0.06),
            inset 0 1px 0 rgba(252, 213, 53, 0.12);
          overflow: hidden;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: klFloat ease-in-out infinite;
          will-change: transform;
        }
        .kl-card-art {
          display: block;
          width: 100%; height: 92px;
          border-radius: 6px;
          background:
            conic-gradient(from 210deg at 60% 40%,
              rgba(252, 213, 53, 0.35),
              rgba(14, 203, 129, 0.25),
              rgba(246, 70, 93, 0.2),
              rgba(252, 213, 53, 0.35));
          filter: saturate(1.2);
        }
        .kl-card-line {
          display: block;
          height: 6px; width: 70%;
          border-radius: 3px;
          background: rgba(234, 236, 239, 0.16);
        }
        .kl-card-line-short { width: 40%; background: rgba(252, 213, 53, 0.3); }
        .kl-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(115deg,
            transparent 0%, transparent 42%,
            rgba(255, 255, 255, 0.14) 50%,
            transparent 58%, transparent 100%);
          background-size: 250% 100%;
          animation: klShimmer 5.5s ease-in-out infinite;
        }
        @keyframes klShimmer {
          0%, 55%  { background-position: 130% 0; }
          85%, 100%{ background-position: -130% 0; }
        }
        @keyframes klFloat {
          0%, 100% { transform: translateY(0)    rotate(var(--r, -6deg)); }
          50%       { transform: translateY(-22px) rotate(calc(var(--r, -6deg) + 3deg)); }
        }
        .kl-c0 { top: 12%; left:  5%; --r: -8deg;  animation-duration: 11s; }
        .kl-c1 { top: 26%; right: 6%; --r:  7deg;  animation-duration: 13s; animation-delay: -4s; }
        .kl-c2 { top: 55%; left: 10%; --r: -5deg;  animation-duration: 12s; animation-delay: -7s; opacity: 0.75; }
        .kl-c3 { top:  8%; left: 44%; --r:  4deg;  animation-duration: 14s; animation-delay: -2s; opacity: 0.6; transform: scale(0.8); }
        .kl-c4 { top: 60%; right: 14%; --r: -9deg; animation-duration: 10s; animation-delay: -5s; opacity: 0.7; transform: scale(0.9); }

        /* ── Diamond glints ── */
        .kl-glints { position: absolute; inset: 0; }
        .kl-glint {
          position: absolute;
          width: 10px; height: 10px;
          background: #fcd535;
          clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
          filter: drop-shadow(0 0 6px rgba(252, 213, 53, 0.8));
          animation: klGlint ease-in-out infinite;
        }
        @keyframes klGlint {
          0%, 92%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
          4%             { opacity: 1; transform: scale(1.2) rotate(45deg); }
          8%             { opacity: 0.4; transform: scale(0.8) rotate(90deg); }
        }
        .kl-g0  { top:  9%; left: 14%; animation-duration: 9s;  animation-delay: 0s;  }
        .kl-g1  { top: 18%; left: 30%; animation-duration: 12s; animation-delay: 2s;  }
        .kl-g2  { top:  7%; left: 62%; animation-duration: 10s; animation-delay: 4s;  }
        .kl-g3  { top: 22%; left: 78%; animation-duration: 13s; animation-delay: 6s;  }
        .kl-g4  { top: 36%; left:  8%; animation-duration: 11s; animation-delay: 8s;  }
        .kl-g5  { top: 42%; left: 50%; animation-duration: 9s;  animation-delay: 1s;  }
        .kl-g6  { top: 34%; left: 90%; animation-duration: 12s; animation-delay: 3s;  }
        .kl-g7  { top: 55%; left: 28%; animation-duration: 10s; animation-delay: 5s;  }
        .kl-g8  { top: 62%; left: 66%; animation-duration: 13s; animation-delay: 7s;  }
        .kl-g9  { top: 72%; left: 12%; animation-duration: 11s; animation-delay: 9s;  }
        .kl-g10 { top: 78%; left: 44%; animation-duration: 9s;  animation-delay: 11s; }
        .kl-g11 { top: 70%; left: 84%; animation-duration: 12s; animation-delay: 2.5s;}
        .kl-g12 { top: 88%; left: 24%; animation-duration: 10s; animation-delay: 6.5s;}
        .kl-g13 { top: 85%; left: 70%; animation-duration: 13s; animation-delay: 4.5s;}

        /* ── Price tape ── */
        .kl-tape {
          position: absolute;
          top: 2px; left: 0; right: 0;
          height: 20px;
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        }
        .kl-tape-track {
          animation: klMarquee 70s linear infinite;
          white-space: nowrap;
          will-change: transform;
        }
        .kl-tape-track span {
          font-family: ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          color: rgba(252, 213, 53, 0.35);
          text-transform: uppercase;
        }
        @keyframes klMarquee {
          from { transform: translateX(0);       }
          to   { transform: translateX(-33.33%); }
        }

        /* ── Spotlight sweep ── */
        .kl-sweep {
          position: absolute; inset: 0;
          background: linear-gradient(105deg,
            transparent 0%, transparent 44%,
            rgba(252, 213, 53, 0.04) 50%,
            transparent 56%, transparent 100%);
          background-size: 260% 100%;
          animation: klSweep 20s linear infinite;
          mix-blend-mode: screen;
        }
        @keyframes klSweep {
          from { background-position: -100% 0; }
          to   { background-position:  260% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .kl-candles, .kl-card, .kl-shimmer, .kl-glint,
          .kl-tape-track, .kl-sweep { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
