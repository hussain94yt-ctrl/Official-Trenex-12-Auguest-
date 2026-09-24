/**
 * HeroVisual — right-column centerpiece for the Hero section.
 *
 * Renders the Trenex T as an inline SVG so we can apply:
 *   • metallic gradient fill (top-left bright → bottom-right dark)
 *   • extruded depth layers (offset dark copies behind the front face)
 *   • thin illuminated edge stroke with a feGaussianBlur glow filter
 *   • metallic highlight overlay
 *
 * All animations are GPU-friendly transform/opacity only — no JS per-frame.
 */

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

/* ── Path data from Signature_1784486516004.svg ──────────────────── */
const P1 =
  "M21.185,169.78h17.6q445.589-.014,891.178.252c24.326.035,46.794-4.079,68.757-14.356,24.12-11.287,47.956-.306,57.57,24.343,5.829,14.945-.252,26.672-8.794,37.464-8.311,10.5-19.947,15.558-33.473,12.786-7.454-1.528-14.947-3.028-21.986-7.015-13.737-7.778-28.887-9.6-44.782-9.583q-406.207.33-812.415.058c-4.345,0-8.69,0-12.554,0-3.169,5.042.756,6.843,2.826,9.169q53.333,59.946,106.735,119.831c5.423,6.1,11.934,8.826,20.2,9.348,39.356,2.486,78.735.675,118.1,1.112,28.681.318,57.39.738,86.045-.183,13.458-.433,17.128,3.836,17.09,17.214q-.688,241.357-.341,482.719c0,4.837,0,9.674,0,15.648,21.343-7.319,39.585-18.906,59.106-27.679,16.686-7.5,33.528-14.655,50.361-21.821,22.687-9.659,32.857-27.825,33.053-51.367.222-26.7-1.616-53.408-1.71-80.115q-.375-107.189.088-214.378c.084-19.721-2.787-38.165-12.621-55.8-9.907-17.772-6.648-35.13,6.586-47.782,14.378-13.746,30.96-15.781,49.18-6.036,16.69,8.927,24.147,32.015,14.341,52.068-10.17,20.8-12.4,42.137-12.29,64.764.5,106.456-.062,212.917.609,319.372.144,22.758-8.465,36.749-29.215,46.243-55.991,25.615-111.392,52.519-167.042,78.88-10.412,4.932-20.875,9.772-32.316,12.542-2.938-5.964-1.68-11.812-1.683-17.429q-.137-253.027.164-506.054c.029-12.757-2.494-17.357-16.442-17.009-50.529,1.262-101.1.792-151.644,1.53-26.751.39-49.217-8.354-66.937-28.445-35.982-40.8-71.721-81.808-107.743-122.571-21.065-23.838-42.471-47.374-63.762-71.012C21.736,175.051,20.069,173.941,21.185,169.78Z";

const P2 =
  "M225.734,259.989c13.43,0,24.507,0,35.585,0,182.8-.029,365.6-.343,548.391.282,22.321.077,41.3-9.071,61.24-15.544,16.377-5.316,36.791,5.974,43.869,19.625a39.8,39.8,0,0,1-5.015,44.483c-13.12,15.147-29.24,20.138-46.731,10.649-24.457-13.268-50-16.046-77.136-15.7-63.678.8-127.372.255-191.06.23-25.52-.01-29.635,4.029-29.586,29.426q.384,199.054.768,398.109a202.111,202.111,0,0,1-.512,20.4c-2.245,22.474-14.25,34.081-36.637,37.718-7.106,1.155-7.417-2.179-7.481-6.882-.137-10.205-.081-20.414-.081-30.621,0-143.886-.208-287.773.317-431.658.05-13.638-3.812-16.916-16.989-16.777-62.708.662-125.428.464-188.142.138-12.572-.066-24.884,2.453-37.734.648C252.192,300.77,238.528,283.272,225.734,259.989Z";

/* ── Fixed particle positions (no Math.random — stable across renders) ── */
const PARTICLES = [
  { left: "8%",  top: "22%", size: 1.5, dur: 5.5, delay: 0,   drift:  8 },
  { left: "83%", top: "13%", size: 2,   dur: 7.2, delay: 1.2, drift: -8 },
  { left: "90%", top: "60%", size: 1.5, dur: 6.3, delay: 2.4, drift:  6 },
  { left: "14%", top: "78%", size: 2,   dur: 8.0, delay: 0.6, drift: -6 },
  { left: "62%", top: "90%", size: 1.5, dur: 5.9, delay: 3.0, drift:  7 },
  { left: "4%",  top: "48%", size: 1.5, dur: 7.6, delay: 1.8, drift: -5 },
  { left: "72%", top: "5%",  size: 2,   dur: 6.7, delay: 0.3, drift:  8 },
];

/* ── Glass card data ─────────────────────────────────────────────── */
/* cx/cy are SVG viewBox (0→100) coords used for the connecting line endpoint */
const CARDS = [
  {
    label: "Development",
    pos: { top: "4%", left: "0%" },
    cx: 13, cy: 8,
  },
  {
    label: "Creative",
    pos: { top: "40%", right: "0%" },
    cx: 88, cy: 44,
  },
  {
    label: "Digital Growth",
    pos: { bottom: "4%", left: "3%" },
    cx: 18, cy: 92,
  },
] as const;

export function HeroVisual() {
  /*
   * Detect mobile once on mount — used to skip expensive GPU operations:
   *   • SVG feGaussianBlur filter (hv-glow) — forces a raster pass over the
   *     entire SVG element on every composite; costly on low-end mobile.
   *   • backdropFilter: blur(10px) on glass cards — each card creates a
   *     separate compositor layer; 3 cards × blur = significant GPU overdraw.
   *   • Ambient glow div opacity is reduced on mobile.
   */
  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
    [],
  );

  /* Skip fade-in animation for prefers-reduced-motion users */
  const prefersReduced = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={{ opacity: prefersReduced ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={prefersReduced ? { duration: 0 } : { duration: 1.1, delay: 0.3, ease: "easeOut" }}
      className="flex items-center justify-center lg:justify-end"
    >
      {/* Float wrapper — translateY only, no conflict with inner perspective */}
      <div className="logo-float-gentle">

        {/* Perspective tilt wrapper */}
        <div
          className="hv-container"
          style={{
            width: "clamp(280px, 42vw, 520px)",
            height: "clamp(280px, 42vw, 520px)",
            transform: "perspective(900px) rotateY(-7deg) rotateX(3deg)",
            position: "relative",
          }}
        >
          {/* ── HUD ring 1: clockwise, red tint ─────────────────── */}
          <div
            className="hud-cw pointer-events-none absolute rounded-full"
            style={{
              inset: "-14%",
              border: "1px solid rgba(255,31,31,0.12)",
              borderTop: "1px solid rgba(255,50,50,0.32)",
              borderRight: "1px solid rgba(255,31,31,0.06)",
            }}
          />

          {/* ── HUD ring 2: counter-clockwise, neutral ───────────── */}
          <div
            className="hud-ccw pointer-events-none absolute rounded-full"
            style={{
              inset: "-26%",
              border: "1px solid rgba(255,255,255,0.04)",
              borderLeft: "1px solid rgba(255,31,31,0.10)",
              borderBottom: "1px solid rgba(255,31,31,0.07)",
            }}
          />

          {/* ── Ambient glow behind the T ────────────────────────── */}
          <div
            className="pointer-events-none absolute inset-[8%] rounded-full blur-[55px]"
            style={{
              opacity: isMobile ? 0.35 : 0.65,
              background:
                "radial-gradient(ellipse at 44% 52%, rgba(255,31,31,0.42) 0%, transparent 68%)",
            }}
          />

          {/* ── SVG connection lines ─────────────────────────────── */}
          {/*
            viewBox="0 0 100 100" + preserveAspectRatio="none" maps cleanly
            onto the square container so card cx/cy values are percentages.
          */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
            style={{ overflow: "visible" }}
          >
            {CARDS.map((c) => (
              <line
                key={c.label}
                x1="50" y1="50"
                x2={c.cx} y2={c.cy}
                stroke="rgba(255,31,31,0.18)"
                strokeWidth="0.25"
                strokeDasharray="1.8 2.2"
              />
            ))}
          </svg>

          {/* ── Inline SVG: 3D metallic T ─────────────────────────── */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              viewBox="0 0 1080 1080"
              className="h-[80%] w-[80%]"
              style={{ overflow: "visible" }}
              aria-label="Trenex"
            >
              <defs>
                {/* Metallic gradient: lit from top-left */}
                <linearGradient id="hv-metal" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stopColor="#FF5050" />
                  <stop offset="28%"  stopColor="#DD1515" />
                  <stop offset="65%"  stopColor="#930606" />
                  <stop offset="100%" stopColor="#4A0000" />
                </linearGradient>

                {/* Specular highlight — narrow diagonal streak */}
                <linearGradient id="hv-spec" x1="0.05" y1="0" x2="0.55" y2="0.9">
                  <stop offset="0%"   stopColor="rgba(255,255,255,0.22)" />
                  <stop offset="45%"  stopColor="rgba(255,255,255,0.05)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
                </linearGradient>

                {/* Edge glow filter */}
                <filter id="hv-glow" x="-18%" y="-18%" width="136%" height="136%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
                  <feColorMatrix in="b" type="matrix"
                    values="1 0 0 0 1  0 0.05 0 0 0  0 0 0 0 0  0 0 0 0.85 0"
                    result="rg" />
                  <feMerge>
                    <feMergeNode in="rg" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Extrusion: deep shadow layer (furthest back) */}
              <g transform="translate(11,8)" opacity="0.25">
                <path d={P1} fill="#180000" />
                <path d={P2} fill="#180000" />
              </g>

              {/* Extrusion: mid layer */}
              <g transform="translate(5,4)" opacity="0.50">
                <path d={P1} fill="#5C0000" />
                <path d={P2} fill="#5C0000" />
              </g>

              {/*
               * Front face: metallic gradient + glow filter.
               * Skip the feGaussianBlur filter on mobile — it forces a full
               * raster pass over the SVG bounding box on every composite and
               * is the single most expensive operation in this component.
               */}
              <g filter={isMobile ? undefined : "url(#hv-glow)"}>
                <path d={P1} fill="url(#hv-metal)" />
                <path d={P2} fill="url(#hv-metal)" />
              </g>

              {/* Illuminated edge stroke */}
              <path d={P1} fill="none"
                stroke="rgba(255,110,110,0.52)" strokeWidth="1.8" />
              <path d={P2} fill="none"
                stroke="rgba(255,110,110,0.52)" strokeWidth="1.8" />

              {/* Specular highlight overlay */}
              <path d={P1} fill="url(#hv-spec)" />
              <path d={P2} fill="url(#hv-spec)" />
            </svg>
          </div>

          {/* ── Glass service cards ───────────────────────────────── */}
          {CARDS.map((c, i) => (
            <div
              key={c.label}
              className={`hv-card hv-card-${i} pointer-events-none absolute flex items-center gap-2 rounded-[5px] px-3 py-[7px]`}
              style={{
                ...c.pos,
                /*
                 * backdropFilter creates a compositor layer for each card.
                 * On mobile (3 cards = 3 layers) this causes GPU overdraw
                 * at exactly the wrong moment — during the hero entry paint.
                 * Use a denser solid background on mobile instead.
                 */
                background: isMobile ? "rgba(5,0,0,0.82)" : "rgba(10,0,0,0.55)",
                border: "1px solid rgba(255,31,31,0.20)",
                backdropFilter: isMobile ? undefined : "blur(10px)",
                WebkitBackdropFilter: isMobile ? undefined : "blur(10px)",
                boxShadow:
                  "0 0 14px rgba(255,31,31,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
                whiteSpace: "nowrap",
              }}
            >
              {/* Red indicator dot */}
              <span
                className="hv-card-dot h-[5px] w-[5px] flex-shrink-0 rounded-full bg-[#FF1F1F]"
                style={{ boxShadow: "0 0 5px rgba(255,31,31,0.9)" }}
              />
              <span className="hv-card-label text-[0.52rem] font-semibold uppercase tracking-[0.22em] text-white/55">
                {c.label}
              </span>
            </div>
          ))}

          {/* ── Particles ─────────────────────────────────────────── */}
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="pointer-events-none absolute rounded-full bg-[#FF1F1F]"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                boxShadow: "0 0 4px 1px rgba(255,31,31,0.55)",
                "--particle-opacity": 0.4,
                "--particle-drift": `${p.drift}px`,
                animationName: "particle-rise",
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.delay}s`,
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                animationFillMode: "both",
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
