import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import logoUrl from "@assets/Trenex_Logo_1784538025298.svg";
import { siteConfig } from "@/data/site";
import { gsap } from "@/lib/gsap";

interface LoadingScreenProps {
  onEnter: () => void;
}

type Phase = "loading" | "ready" | "entering";

/* ─── Atmosphere particles ──────────────────────────────── */
const ATMO_CHARS = ["0", "1", "0", "1", "F", "A", "0", "1", "B", "C", "7", "E"];

interface AnimationProfile {
  atmoCount: number;
  dustCount: number;
  reducedMotion: boolean;
  lowPower: boolean;
}

function getAnimationProfile(): AnimationProfile {
  if (typeof window === "undefined") {
    return { atmoCount: 24, dustCount: 12, reducedMotion: false, lowPower: true };
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const device = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const connection = device.connection;
  const lowPower =
    window.innerWidth < 640 ||
    navigator.hardwareConcurrency <= 4 ||
    connection?.saveData === true ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g" ||
    (device.deviceMemory !== undefined && device.deviceMemory <= 4);

  return {
    atmoCount: reducedMotion ? 0 : lowPower ? 24 : 46,
    dustCount: reducedMotion ? 0 : lowPower ? 12 : 22,
    reducedMotion,
    lowPower,
  };
}

interface AtmoParticle {
  id: number;
  char: string;
  left: number;
  top: number;
  delay: number;
  dur: number;
  size: number;
  alpha: number;
}

interface DustParticle {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  dur: number;
  hue: number;
}

export function LoadingScreen({ onEnter }: LoadingScreenProps) {
  const [phase, setPhase] = useState<Phase>("loading");

  /* ── refs ── */
  const containerRef = useRef<HTMLDivElement>(null);
  const scanlinesRef = useRef<HTMLDivElement>(null);
  const scanBeamRef  = useRef<HTMLDivElement>(null);

  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const ring3Ref = useRef<HTMLDivElement>(null);
  const ring4Ref = useRef<HTMLDivElement>(null);

  const glowRef      = useRef<HTMLDivElement>(null);
  const glowRingRef  = useRef<HTMLDivElement>(null);
  const logoWrapRef  = useRef<HTMLDivElement>(null);
  const logoImgRef   = useRef<HTMLImageElement>(null);

  const atmoRef  = useRef<HTMLDivElement>(null);
  const dustRef  = useRef<HTMLDivElement>(null);

  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const buttonRef  = useRef<HTMLButtonElement>(null);

  /* pulse rings (click exit) */
  const pulse1Ref = useRef<HTMLDivElement>(null);
  const pulse2Ref = useRef<HTMLDivElement>(null);
  const pulse3Ref = useRef<HTMLDivElement>(null);

  /* exit overlay */
  const shockRef   = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  /* ── static data ── */
  const animationProfile = useMemo(getAnimationProfile, []);
  const atmoParticles = useMemo<AtmoParticle[]>(() =>
    Array.from({ length: animationProfile.atmoCount }, (_, i) => ({
      id: i,
      char: ATMO_CHARS[Math.floor(Math.random() * ATMO_CHARS.length)],
      left: Math.random() * 100,
      top:  Math.random() * 100,
      delay: Math.random() * 3,
      dur:   1.6 + Math.random() * 1.8,
      size:  Math.random() > 0.65 ? 11 : 9,
      alpha: 0.25 + Math.random() * 0.45,
    })), [animationProfile.atmoCount]);

  const dustParticles = useMemo<DustParticle[]>(() =>
    Array.from({ length: animationProfile.dustCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top:  10 + Math.random() * 85,
      size: 1.5 + Math.random() * 2,
      delay: Math.random() * 4,
      dur:   5 + Math.random() * 5,
      hue:   Math.floor(Math.random() * 30),
    })), [animationProfile.dustCount]);

  const nameLetters = useMemo(() => siteConfig.name.split(""), []);

  /* ─── MAIN ENTRANCE + RING ROTATION ──────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* initial hidden states */
      gsap.set(containerRef.current, { opacity: 0 });
      gsap.set(scanlinesRef.current, { opacity: 0 });
      gsap.set(scanBeamRef.current,  { y: "-10vh" });

      /* rings — GSAP controls rotationX + rotation + opacity + scale */
      gsap.set(ring1Ref.current, { opacity: 0, scale: 0.3, rotationX: 0,  rotation: 0 });
      gsap.set(ring2Ref.current, { opacity: 0, scale: 0.3, rotationX: 62, rotation: 0 });
      gsap.set(ring3Ref.current, { opacity: 0, scale: 0.3, rotationX: 55, rotation: 0 });
      gsap.set(ring4Ref.current, { opacity: 0, scale: 0.3, rotationX: 68, rotation: 0 });

      gsap.set(glowRef.current,     { opacity: 0, scale: 0.4 });
      gsap.set(glowRingRef.current, { opacity: 0, scale: 0.6 });
      gsap.set(logoWrapRef.current, { opacity: 0, scale: 0.5, filter: "blur(20px)" });

      gsap.set(atmoRef.current,  { opacity: 0 });
      gsap.set(dustRef.current,  { opacity: 0 });

      gsap.set(lettersRef.current.filter(Boolean), { opacity: 0, y: 22 });
      gsap.set(buttonRef.current, { opacity: 0, y: 18, scale: 0.95 });

      gsap.set(pulse1Ref.current,  { opacity: 0, scale: 0.6 });
      gsap.set(pulse2Ref.current,  { opacity: 0, scale: 0.4 });
      gsap.set(pulse3Ref.current,  { opacity: 0, scale: 0.2 });
      gsap.set(shockRef.current,   { opacity: 0, scale: 0, xPercent: -50, yPercent: -50 });
      gsap.set(overlayRef.current, { opacity: 0 });

      if (animationProfile.reducedMotion) {
        gsap.set([
          containerRef.current,
          scanlinesRef.current,
          ring1Ref.current,
          ring2Ref.current,
          ring3Ref.current,
          ring4Ref.current,
          glowRef.current,
          glowRingRef.current,
          logoWrapRef.current,
          atmoRef.current,
          dustRef.current,
          lettersRef.current.filter(Boolean),
          buttonRef.current,
        ], { opacity: 1, clearProps: "transform,filter" });
        setPhase("ready");
        return;
      }

      /* ── continuous ring rotation (independent of timeline) ── */
      gsap.to(ring1Ref.current, { rotation: 360,  duration: animationProfile.lowPower ? 18 : 11, ease: "none", repeat: -1 });
      gsap.to(ring2Ref.current, { rotation: -360, duration: animationProfile.lowPower ? 26 : 17, ease: "none", repeat: -1 });
      gsap.to(ring3Ref.current, { rotation: 360,  duration: animationProfile.lowPower ? 36 : 25, ease: "none", repeat: -1 });
      gsap.to(ring4Ref.current, { rotation: -360, duration: animationProfile.lowPower ? 48 : 37, ease: "none", repeat: -1 });

      /* ── entrance timeline ── */
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Phase 1: environment
      tl.to(containerRef.current, { opacity: 1, duration: 0.45, ease: "power1.out" }, 0);
      tl.to(scanlinesRef.current, { opacity: 1, duration: 0.35 }, 0.1);
      tl.to(scanBeamRef.current,  { y: "110vh", duration: 1.4, ease: "power2.inOut" }, 0.1);

      // Phase 2: rings cascade in (outermost first)
      tl.to(ring4Ref.current, { opacity: 1, scale: 1, duration: 0.75, ease: "power4.out" }, 0.2);
      tl.to(ring3Ref.current, { opacity: 1, scale: 1, duration: 0.7,  ease: "power4.out" }, 0.35);
      tl.to(ring2Ref.current, { opacity: 1, scale: 1, duration: 0.65, ease: "power4.out" }, 0.5);
      tl.to(ring1Ref.current, { opacity: 1, scale: 1, duration: 0.6,  ease: "power4.out" }, 0.65);

      // Phase 3: logo assembles
      tl.to(glowRef.current,     { opacity: 1, scale: 1, duration: 0.85 }, 0.72);
      tl.to(logoWrapRef.current, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.85, ease: "power4.out" }, 0.78);
      tl.to(glowRingRef.current, { opacity: 1, scale: 1, duration: 0.7 }, 1.05);
      tl.to(logoImgRef.current,  {
        filter: "drop-shadow(0 0 22px rgba(255,31,31,0.85)) drop-shadow(0 0 55px rgba(255,31,31,0.42))",
        duration: 0.9,
      }, 1.05);

      // Phase 4: atmosphere
      tl.to(atmoRef.current, { opacity: 1, duration: 0.55 }, 1.1);
      tl.to(dustRef.current, { opacity: 1, duration: 0.85 }, 1.2);

      // Phase 5: name reveals letter by letter
      tl.to(lettersRef.current.filter(Boolean), {
        opacity: 1, y: 0, duration: 0.6, stagger: 0.042, ease: "power3.out",
      }, 2.0);

      // Phase 6: ENTER TRENEX button slides up
      tl.to(buttonRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.72, ease: "back.out(1.5)" }, 3.05);
      tl.call(() => setPhase("ready"), [], 3.05);
    }, containerRef);

    return () => ctx.revert();
  }, [animationProfile]);

  /* ─── ENTER CLICK TRANSITION ─────────────────────────── */
  const handleEnter = useCallback(() => {
    if (phase !== "ready") return;
    setPhase("entering");

    if (animationProfile.reducedMotion) {
      onEnter();
      return;
    }

    gsap.context(() => {
      const tl = gsap.timeline({ onComplete: onEnter });

      // 1 — button dissolves immediately
      tl.to(buttonRef.current,  { opacity: 0, scale: 0.85, duration: 0.22, ease: "power2.in" }, 0);

      // 2 — fade decorative layers as groups; avoid per-particle layout reads
      tl.to([atmoRef.current, dustRef.current], { opacity: 0, duration: 0.24, ease: "power1.in" }, 0);

      // 3 — one restrained pulse keeps the transition tactile without a full-screen blur blast
      tl.fromTo(pulse1Ref.current, { opacity: 0.9, scale: 0.65 }, { opacity: 0, scale: 2.4, duration: 0.62, ease: "power2.out" }, 0.04);

      // 4 — name letters implode
      tl.to(lettersRef.current.filter(Boolean), {
        opacity: 0, y: -8, stagger: 0.012, duration: 0.24, ease: "power2.in",
      }, 0.04);

      // 5 — rings and logo exit with compositor-friendly transforms
      tl.to([ring1Ref.current, ring2Ref.current, ring3Ref.current, ring4Ref.current], {
        scale: 1.12, opacity: 0, duration: 0.42, ease: "power2.in", stagger: 0.025,
      }, 0.04);
      tl.to(logoWrapRef.current, { scale: 1.04, opacity: 0, duration: 0.38, ease: "power2.in" }, 0.1);
      tl.to([glowRef.current, glowRingRef.current], { scale: 1.12, opacity: 0, duration: 0.32 }, 0.1);

      // 6 — a short curtain closes before the main site mounts on the next rAF
      tl.to(overlayRef.current, { opacity: 1, duration: 0.24, ease: "power1.in" }, 0.26);
    }, containerRef);
  }, [animationProfile.reducedMotion, onEnter, phase]);

  /* ─── JSX ──────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#050505]"
      style={{ opacity: 0 }}
    >
      {/* ── volumetric background lighting ── */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 85% 65% at 50% 50%, rgba(255,31,31,0.13), transparent 70%)"
      }} />
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 50% 45% at 18% 82%, rgba(180,0,0,0.07), transparent 70%)"
      }} />
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 40% 38% at 84% 16%, rgba(220,20,20,0.055), transparent 70%)"
      }} />
      {/* deep vignette */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 110% 110% at 50% 50%, transparent 35%, rgba(0,0,0,0.75) 100%)"
      }} />

      {/* ── scan lines ── */}
      <div ref={scanlinesRef} className="pointer-events-none absolute inset-0 opacity-0" style={{
        backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 4px)"
      }} />
      <div ref={scanBeamRef} className="loading-transform-layer pointer-events-none absolute left-0 top-0 h-28 w-full" style={{
        background: "linear-gradient(to bottom, transparent, rgba(255,31,31,0.1) 50%, transparent)"
      }} />

      {/* ── atmosphere: hex / binary chars ── */}
      <div ref={atmoRef} className="pointer-events-none absolute inset-0">
        {atmoParticles.map((p) => (
          <span
            key={p.id}
            className="absolute select-none font-mono"
            style={{
              left:   `${p.left}%`,
              top:    `${p.top}%`,
              fontSize: `${p.size}px`,
              color: `rgba(255,31,31,${p.alpha})`,
              textShadow: "0 0 5px rgba(255,31,31,0.4)",
              animation: `load-atmo-fade ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
            }}
          >
            {p.char}
          </span>
        ))}
      </div>

      {/* ── floating dust particles ── */}
      <div ref={dustRef} className="pointer-events-none absolute inset-0">
        {dustParticles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left:  `${p.left}%`,
              top:   `${p.top}%`,
              width:  `${p.size}px`,
              height: `${p.size}px`,
              background: `rgba(255,${20 + p.hue},${10 + p.hue},0.55)`,
              boxShadow: `0 0 ${p.size * 2.5}px rgba(255,31,31,0.35)`,
              animation: `load-dust-float ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* ── rotating rings (perspective container) ── */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ perspective: 900 }}>
        {/* Ring 4 — outermost */}
        <div ref={ring4Ref} className="absolute" style={{
          width: 500, height: 500, borderRadius: "50%",
          border: "1px solid rgba(255,31,31,0.07)",
          boxShadow: "0 0 18px rgba(255,31,31,0.04) inset",
        }} />
        {/* Ring 3 */}
        <div ref={ring3Ref} className="absolute" style={{
          width: 370, height: 370, borderRadius: "50%",
          border: "1px dashed rgba(255,255,255,0.07)",
        }} />
        {/* Ring 2 */}
        <div ref={ring2Ref} className="absolute" style={{
          width: 265, height: 265, borderRadius: "50%",
          border: "1px solid rgba(255,31,31,0.2)",
          boxShadow: "0 0 14px rgba(255,31,31,0.07) inset, 0 0 22px rgba(255,31,31,0.07)",
        }} />
        {/* Ring 1 — innermost */}
        <div ref={ring1Ref} className="absolute" style={{
          width: 175, height: 175, borderRadius: "50%",
          border: "1px solid rgba(255,31,31,0.38)",
          boxShadow: "0 0 10px rgba(255,31,31,0.18) inset",
        }} />
      </div>

      {/* ── logo + name + button ── */}
      <div className="relative flex flex-col items-center">
        <div className="relative mb-8 flex items-center justify-center">

          {/* ambient glow behind logo */}
          <div ref={glowRef} className="absolute" style={{
            width: 220, height: 220, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,31,31,0.5), transparent 68%)",
            filter: "blur(12px)",
          }} />

          {/* glowing border ring around logo */}
          <div ref={glowRingRef} className="pointer-events-none absolute" style={{
            width: 208, height: 208, borderRadius: "50%",
            border: "1px solid rgba(255,31,31,0.5)",
            boxShadow: "0 0 18px rgba(255,31,31,0.2), 0 0 36px rgba(255,31,31,0.08) inset",
          }} />

          {/* pulse rings — hidden until click */}
          <div ref={pulse1Ref} className="pointer-events-none absolute" style={{
            width: 190, height: 190, borderRadius: "50%",
            border: "2px solid rgba(255,31,31,0.85)",
            boxShadow: "0 0 14px rgba(255,31,31,0.38)",
          }} />
          <div ref={pulse2Ref} className="pointer-events-none absolute" style={{
            width: 190, height: 190, borderRadius: "50%",
            border: "1px solid rgba(255,90,60,0.65)",
          }} />
          <div ref={pulse3Ref} className="pointer-events-none absolute" style={{
            width: 190, height: 190, borderRadius: "50%",
            border: "1px solid rgba(255,31,31,0.45)",
          }} />

          {/* logo mark */}
          <div ref={logoWrapRef} className="brand-asset relative z-10 flex items-center justify-center">
            <img
              ref={logoImgRef}
              src={logoUrl}
              alt="Trenex Agency"
              className="relative h-48 w-48 object-contain sm:h-60 sm:w-60 md:h-64 md:w-64"
              style={{ filter: "drop-shadow(0 0 14px rgba(255,31,31,0.55))", imageRendering: "auto" }}
              decoding="async"
              loading="eager"
              data-testid="img-logo-loading"
            />
          </div>
        </div>

        {/* TRENEX AGENCY letter-by-letter */}
        <h1 className="mb-11 flex flex-wrap items-center justify-center text-2xl font-semibold uppercase tracking-[0.35em] text-white sm:text-3xl md:text-4xl">
          {nameLetters.map((letter, i) => (
            <span
              key={i}
              ref={(el) => { lettersRef.current[i] = el; }}
              className="inline-block"
              style={letter === " " ? { width: "0.4em" } : undefined}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </h1>

        {/* ── ENTER TRENEX button ── */}
        <button
          ref={buttonRef}
          onClick={handleEnter}
          disabled={phase !== "ready"}
          aria-label="Enter Trenex Agency"
          className="group relative overflow-hidden px-11 py-[14px] font-mono text-sm uppercase tracking-[0.32em]"
          style={{ opacity: 0 }}
        >
          {/* main border */}
          <span className="pointer-events-none absolute inset-0 transition-all duration-400 border border-[#FF1F1F]/55 group-hover:border-[#FF1F1F] group-hover:shadow-[0_0_28px_rgba(255,31,31,0.38),0_0_55px_rgba(255,31,31,0.12)_inset]" />
          {/* inner radial glow on hover */}
          <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100" style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,31,31,0.13), transparent)"
          }} />
          {/* corner accent marks */}
          <span className="pointer-events-none absolute left-0 top-0 h-[10px] w-[10px] border-l-2 border-t-2 border-[#FF1F1F] transition-all duration-300 group-hover:h-[14px] group-hover:w-[14px]" />
          <span className="pointer-events-none absolute right-0 top-0 h-[10px] w-[10px] border-r-2 border-t-2 border-[#FF1F1F] transition-all duration-300 group-hover:h-[14px] group-hover:w-[14px]" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-[10px] w-[10px] border-b-2 border-l-2 border-[#FF1F1F] transition-all duration-300 group-hover:h-[14px] group-hover:w-[14px]" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-[10px] w-[10px] border-b-2 border-r-2 border-[#FF1F1F] transition-all duration-300 group-hover:h-[14px] group-hover:w-[14px]" />
          {/* animated scan line inside button */}
          <span className="pointer-events-none absolute inset-x-0 h-px opacity-0 group-hover:opacity-100" style={{
            top: "50%",
            background: "linear-gradient(to right, transparent, rgba(255,31,31,0.55), transparent)",
            animation: "load-btn-scan 2.2s ease-in-out infinite",
          }} />
          {/* label */}
          <span className="relative text-white/75 transition-all duration-300 group-hover:text-white group-hover:[text-shadow:0_0_18px_rgba(255,31,31,0.55)]">
            ENTER TRENEX
          </span>
        </button>
      </div>

      {/* ── exit: shockwave circle ── */}
      <div ref={shockRef} className="pointer-events-none absolute" style={{
        width: 220, height: 220,
        borderRadius: "50%",
        left: "50%", top: "50%",
        background: "radial-gradient(circle, rgba(255,80,60,0.85) 0%, rgba(255,31,31,0.5) 22%, rgba(255,31,31,0.15) 52%, transparent 70%)",
        transformOrigin: "center center",
      }} />

      {/* ── exit: final dark curtain ── */}
      <div ref={overlayRef} className="pointer-events-none absolute inset-0 bg-[#050505]" />
    </div>
  );
}
