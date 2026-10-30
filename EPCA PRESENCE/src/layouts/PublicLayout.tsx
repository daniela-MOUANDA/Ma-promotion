import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { scrollToTop } from "@/lib/scroll";
import { PublicFooter, PublicHeader } from "@/layouts/PublicChrome";
import { motion, useScroll, useSpring } from "framer-motion";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function PublicLayout() {
  const { pathname } = useLocation();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });

  useEffect(() => {
    scrollToTop({ immediate: true });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-wash">
      <SmoothScroll />
      <motion.div
        aria-hidden
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-glow"
      />
      <PublicHeader />
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1"
      >
        <Outlet />
      </motion.main>
      <PublicFooter />
    </div>
  );
}
