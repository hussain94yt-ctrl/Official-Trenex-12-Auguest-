import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CustomCursor } from "@/components/CustomCursor";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { AmbientBackground } from "@/components/three/AmbientBackground";
import { GridBackground } from "@/components/GridBackground";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Stats } from "@/components/sections/Stats";
import { TrophySection } from "@/components/sections/TrophySection";
import { ExpertiseWall } from "@/components/sections/ExpertiseWall";
import { Contact } from "@/components/sections/Contact";
import { TransitionProvider } from "@/components/PageTransition";
import { AssetProtection } from "@/components/AssetProtection";
import { LaunchContext } from "@/context/LaunchContext";

/* Route-level code splitting — these pages are only needed when the user
   navigates to them, so they stay out of the initial JS bundle.          */
const GraphicDesignPage  = lazy(() => import("@/pages/graphic-design"));
const VideoEditingPage   = lazy(() => import("@/pages/video-editing"));
const WebDevelopmentPage = lazy(() => import("@/pages/web-development"));
const NotFound           = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient();

function Home() {
  /**
   * Staged launch phases — prevents all heavy work from colliding on the
   * same frame when the loading screen exits.
   *
   *   0  loading screen showing
   *   1  hero text content (layout + Framer Motion text animations)
   *   2  HeroVisual mounted (SVG logo + HUD ring CSS animations)
   *   3  Hero particles + scroll indicator mounted
   *   4  below-fold sections mounted (Services → Footer)
   */
  const [phase, setPhase] = useState(0);
  const rafRef  = useRef<number>(0);
  const timers  = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* Cancel any pending rAF / timers if the component ever unmounts */
  useEffect(() => {
    document.title = "Trenex Agency";
    return () => {
      cancelAnimationFrame(rafRef.current);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const handleEnter = useCallback(() => {
    /*
     * Two rAFs: let the browser finish painting the loading screen's black
     * exit curtain before we commit the hero subtree.  Without this the
     * DOM mutations from LoadingScreen unmount + Hero mount land in the
     * same frame, causing a visible stutter.
     */
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setPhase(1); // hero text content

        timers.current = [
          setTimeout(() => setPhase(2), 150), // HeroVisual
          setTimeout(() => setPhase(3), 280), // particles + scroll indicator
          setTimeout(() => setPhase(4), 600), // below-fold sections
        ];
      });
    });
  }, []);

  return (
    <LaunchContext.Provider value={phase}>
      <div className="relative min-h-screen w-full">
        {/*
         * AmbientBackground stays in the tree at all phases so the dark
         * bg-[#050505] shows during the loading screen. Its WebGL Canvas
         * is internally gated on phase >= 1 to avoid GPU contention while
         * the loading screen GSAP animation is running.
         */}
        <AmbientBackground />
        <GridBackground />
        <CustomCursor />

        {phase === 0 && <LoadingScreen onEnter={handleEnter} />}

        {phase >= 1 && (
          <div className="relative z-10">
            <Header />
            <Hero />

            {/*
             * Below-fold sections mount 600 ms after hero text — well before
             * the user can scroll there, but long after the critical first
             * paint.  Avoids a single massive React commit that would freeze
             * low-end mobile for hundreds of milliseconds.
             */}
            {phase >= 4 && (
              <>
                <Services />
                <Stats />
                <ExpertiseWall />
                <Contact />
                <TrophySection />
                <Footer />
              </>
            )}
            <WhatsAppButton />
          </div>
        )}
      </div>
    </LaunchContext.Provider>
  );
}

function Router() {
  return (
    <Suspense fallback={null}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/graphic-design" component={GraphicDesignPage} />
        <Route path="/video-editing" component={VideoEditingPage} />
        <Route path="/web-development" component={WebDevelopmentPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AssetProtection />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <TransitionProvider>
            <Router />
          </TransitionProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
