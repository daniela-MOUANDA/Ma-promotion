import { registerLenis } from "@/lib/scroll";
import Lenis from "lenis";
import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    registerLenis(lenis);
    // Après une actualisation, le navigateur peut encore restaurer la position : on la recale tout de suite.
    lenis.scrollTo(0, { immediate: true, force: true });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      registerLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
