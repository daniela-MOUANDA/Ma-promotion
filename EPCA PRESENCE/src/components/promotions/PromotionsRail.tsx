import { Container } from "@/components/ui/LayoutBits";
import type { Promotion } from "@/types/domain";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/** Les promotions défilent à l’horizontale pendant que l’on descend la page. */
export function PromotionsRail({ promotions }: { promotions: Promotion[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.3 });
  const x = useTransform(smooth, [0, 1], [0, -distance]);

  useEffect(() => {
    const measure = () => {
      if (!track.current) return;
      setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [promotions.length]);

  return (
    <section ref={section} style={{ height: `calc(100vh + ${distance}px)` }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <Container className="mb-10 w-full">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky">Promotions</p>
              <h2 className="mt-3 max-w-xl font-display text-4xl font-extrabold leading-[0.98] tracking-[-0.03em] text-navy-900 md:text-6xl">
                Choisissez la vôtre.
              </h2>
            </div>
            <Link to="/promotions" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900">
              Tout voir <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 h-[3px] w-full overflow-hidden rounded-full bg-navy-900/10">
            <motion.div style={{ scaleX: smooth }} className="h-full origin-left rounded-full bg-sky" />
          </div>
        </Container>

        <motion.div
          ref={track}
          style={{ x }}
          className="flex w-max gap-5 pl-[max(1rem,calc((100vw-72rem)/2+2rem))] pr-10"
        >
          {promotions.map((promo) => (
            <Link
              key={promo.id}
              to={`/promotions/${promo.number}`}
              className="group relative flex h-[22rem] w-[min(25rem,82vw)] shrink-0 flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-700 to-navy-950 p-7 text-white transition-transform duration-500 hover:-translate-y-2"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-6 select-none font-display text-[11rem] font-extrabold leading-none text-white/[0.07] transition-colors duration-500 group-hover:text-glow/25"
              >
                {String(promo.number).padStart(2, "0")}
              </span>
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-glow">
                    {promo.academicYear}
                  </span>
                  <span className="inline-flex rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    {promo.status === "en_cours" ? "En formation" : "Diplômée"}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight">{promo.label}</h3>
                <p className="mt-3 line-clamp-3 max-w-xs text-sm leading-6 text-white/60">{promo.summary}</p>
              </div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="font-display text-3xl font-bold">{promo.studentCount}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">profils</p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-navy-900 transition-transform duration-500 group-hover:rotate-45 group-hover:bg-glow">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
