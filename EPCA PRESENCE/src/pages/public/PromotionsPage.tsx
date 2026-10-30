import { Reveal } from "@/components/motion/Reveal";
import { Container, PageHero } from "@/components/ui/LayoutBits";
import { getPromotions } from "@/lib/catalog";
import { usePromotions } from "@/lib/use-live-data";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function PromotionsPage() {
  usePromotions();
  const promotions = getPromotions();

  return (
    <div>
      <PageHero
        kicker="Catalogue"
        title="Toutes les promotions"
        description="Ouvrez une promotion, choisissez une catégorie et une filière, puis cliquez sur votre profil pour témoigner."
        image="/gallery/evt-07.jpg"
      />

      <Container className="py-16 md:py-24">
        <div className="grid gap-5 md:grid-cols-2">
          {promotions.map((promo, index) => (
            <Reveal key={promo.id} delay={index * 0.05}>
              <Link
                to={`/promotions/${promo.number}`}
                className="group relative flex min-h-[15rem] flex-col justify-between overflow-hidden rounded-[2rem] border border-line bg-paper p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-navy-900 hover:bg-navy-900 hover:shadow-float"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-3 -top-5 select-none font-display text-[9rem] font-extrabold leading-none text-navy-900/[0.05] transition-colors duration-500 group-hover:text-glow/20"
                >
                  {String(promo.number).padStart(2, "0")}
                </span>
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-wash px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft transition-colors duration-500 group-hover:bg-white/10 group-hover:text-glow">
                      {promo.academicYear}
                    </span>
                    <span className="inline-flex rounded-full bg-wash px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft transition-colors duration-500 group-hover:bg-white/10 group-hover:text-glow">
                      {promo.status === "en_cours" ? "En formation" : "Diplômée"}
                    </span>
                  </div>
                  <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-navy-900 transition-colors duration-500 group-hover:text-white">
                    {promo.label}
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-ink-soft transition-colors duration-500 group-hover:text-white/60">
                    {promo.summary}
                  </p>
                </div>
                <div className="relative mt-8 flex items-center justify-between">
                  <span className="text-sm font-semibold text-navy-900 transition-colors duration-500 group-hover:text-white">
                    {promo.studentCount} profils
                  </span>
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-navy-900 text-white transition-all duration-500 group-hover:rotate-45 group-hover:bg-glow group-hover:text-navy-900">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </div>
  );
}
