import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { Particles } from "@/components/Particles";
import { HeroVisual } from "@/components/HeroVisual";
import { useLaunchPhase } from "@/context/LaunchContext";

export function Hero() {
  const phase          = useLaunchPhase();
  const prefersReduced = useReducedMotion() ?? false;

  /*
   * Detect mobile once on mount — used to:
   *   • skip the large blur-[140px] / blur-[200px] glow divs (expensive
   *     compositor layers that thrash the GPU on scroll on low-end devices)
   *   • pass lowPower to Particles so each dot skips its box-shadow glow
   *   • reduce particle count
   */
  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
    [],
  );

  /* ── Animation factories ──────────────────────────────────────────── */
  /*
   * When prefers-reduced-motion is set, return props that make each element
   * appear immediately with no transition — Framer Motion still runs but
   * the duration is 0 so there is no animation work on the main thread.
   */
  const fadeUp = (delay: number) =>
    prefersReduced
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  const fadeIn = (delay: number) =>
    prefersReduced
      ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 1, delay, ease: "easeOut" as const },
        };

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] w-full items-center overflow-hidden px-6 py-28 sm:px-10 sm:py-32 lg:px-16"
    >
      {/*
       * Ambient glow — the blur-[140px] and blur-[200px] divs force the
       * browser to create compositing layers and run Gaussian blur at the
       * element's full raster size on every paint. On desktop this is fine;
       * on mobile it adds ~15–25 ms per paint and causes jank on first render.
       * We skip them entirely on mobile — the Three.js AmbientBackground
       * already provides a red atmospheric glow on all screen sizes.
       */}
      {!isMobile && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute right-[10%] top-1/2 -translate-y-1/2 h-[640px] w-[640px] rounded-full opacity-20 blur-[140px]"
            style={{ background: "radial-gradient(circle, rgba(255,31,31,0.45) 0%, transparent 70%)" }}
          />
          <div
            className="absolute right-[5%] top-1/2 -translate-y-1/2 h-[900px] w-[900px] rounded-full opacity-10 blur-[200px]"
            style={{ background: "radial-gradient(circle, rgba(255,31,31,0.3) 0%, transparent 65%)" }}
          />
        </div>
      )}

      {/*
       * Particles — deferred to phase 3 so they don't compete with the
       * initial hero text paint and the HeroVisual SVG render.
       * Mobile: 6 particles (was 16) with no glow box-shadow.
       */}
      {phase >= 3 && (
        <Particles
          count={isMobile ? 6 : 16}
          sizeRange={[1, 2]}
          drift={5}
          lowPower={isMobile}
        />
      )}

      {/* ── Two-column grid ────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-12">

        {/* ── LEFT: copy ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">

          {/* Agency label */}
          <motion.p
            {...fadeIn(0.1)}
            className="mb-7 text-[0.58rem] font-semibold uppercase tracking-[0.4em] text-[#FF1F1F] sm:text-[0.62rem]"
          >
            Creative Digital Agency
          </motion.p>

          {/* Brand name */}
          <motion.h1
            {...fadeUp(0.22)}
            className="mb-6 font-black uppercase leading-[0.9] tracking-[0.12em] text-white"
            style={{ fontSize: "clamp(3.2rem, 8vw, 7rem)" }}
          >
            TRENEX
          </motion.h1>

          {/* Service lines */}
          <motion.div
            {...fadeUp(0.36)}
            className="mb-8 flex flex-col gap-2.5 sm:mb-9 sm:gap-2"
          >
            {[
              { title: "Development", sub: "Software • App • Web" },
              { title: "Creative", sub: "Video • Graphic • Content" },
              { title: "Digital Growth", sub: "Social Media • Digital Marketing" },
            ].map((group, i) => (
              <div
                key={group.title}
                className="flex flex-col items-center justify-center gap-0.5 sm:flex-row sm:items-baseline sm:justify-start sm:gap-2.5 lg:justify-start"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span
                    className="inline-block h-px w-4 sm:w-5 bg-[#FF1F1F]"
                    style={{ opacity: 1 - i * 0.2 }}
                  />
                  <span className="text-[0.78rem] sm:text-[0.82rem] font-bold uppercase tracking-[0.22em] text-white/90">
                    {group.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[0.66rem] sm:text-[0.72rem] tracking-[0.12em] text-white/45">
                  <span className="hidden sm:inline text-white/20 text-[0.55rem]">•</span>
                  <span>{group.sub}</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            {...fadeUp(0.48)}
            className="flex flex-col items-center gap-3 sm:flex-row lg:items-start sm:gap-4"
          >
            <a
              href="#contact"
              data-testid="link-start-project"
              className="group inline-flex w-full min-w-[180px] items-center justify-center gap-2.5 bg-[#FF1F1F] px-8 py-3.5 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#050505] transition-all duration-300 hover:bg-[#e41c1c] hover:shadow-[0_0_40px_rgba(255,31,31,0.45)] sm:w-auto"
            >
              <span>Start a Project</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
            </a>

            <a
              href="#services"
              data-testid="link-view-services"
              className="group inline-flex w-full min-w-[180px] items-center justify-center gap-2.5 border border-white/15 px-8 py-3.5 text-[0.68rem] font-medium uppercase tracking-[0.28em] text-white/80 transition-all duration-300 hover:border-[#FF1F1F]/50 hover:text-[#FF1F1F] hover:shadow-[0_0_20px_rgba(255,31,31,0.15)] sm:w-auto"
            >
              <span>View Services</span>
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">&rarr;</span>
            </a>
          </motion.div>
        </div>

        {/*
         * RIGHT: 3D hero visual — deferred to phase 2 so it does not
         * compete with the hero text Framer Motion animations on the
         * same frame.  A hidden spacer preserves the two-column grid
         * layout during phase 1 so there is no layout shift.
         */}
        {phase >= 2
          ? <HeroVisual />
          : <div className="hidden lg:block" aria-hidden />
        }
      </div>

      {/* Scroll indicator — deferred to phase 3 */}
      {phase >= 3 && (
        <motion.div
          {...fadeIn(1.05)}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 h-14 w-px bg-gradient-to-b from-white/20 to-transparent"
        />
      )}
    </section>
  );
}
