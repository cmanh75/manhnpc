/**
 * Site-wide ambient backdrop: aurora blobs + blueprint grid + scanline.
 * Pure CSS — zero JS cost, sits behind everything.
 */
export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* aurora blobs */}
      <div
        className="absolute -left-40 -top-52 size-[42rem] rounded-full opacity-25 blur-[120px] animate-aurora"
        style={{ background: 'radial-gradient(circle, #22d3ee 0%, transparent 65%)' }}
      />
      <div
        className="absolute -right-52 top-1/4 size-[38rem] rounded-full opacity-20 blur-[130px] animate-aurora"
        style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 65%)', animationDelay: '-6s' }}
      />
      <div
        className="absolute -bottom-60 left-1/3 size-[36rem] rounded-full opacity-15 blur-[140px] animate-aurora"
        style={{ background: 'radial-gradient(circle, #f472b6 0%, transparent 65%)', animationDelay: '-12s' }}
      />

      {/* blueprint grid */}
      <div className="grid-bg absolute inset-0" />

      {/* drifting scanline */}
      <div
        className="absolute inset-x-0 h-40 animate-scanline opacity-[0.045]"
        style={{ background: 'linear-gradient(180deg, transparent, #22d3ee, transparent)' }}
      />

      {/* shooting stars */}
      {[
        { top: '12%', delay: '0s', duration: '7s' },
        { top: '34%', delay: '3.2s', duration: '9s' },
        { top: '6%', delay: '5.8s', duration: '8s' },
        { top: '55%', delay: '8.4s', duration: '10s' },
      ].map((m, i) => (
        <span
          key={i}
          className="meteor"
          style={{ top: m.top, animationDelay: m.delay, animationDuration: m.duration }}
        />
      ))}

      {/* noise grain */}
      <svg className="absolute inset-0 size-full opacity-[0.022]">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  )
}
