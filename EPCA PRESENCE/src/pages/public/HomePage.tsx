import { SpinningCrest } from "@/components/brand/SpinningCrest";
import { EpcaCrest } from "@/components/brand/Logo";
import { MemoryMosaic } from "@/components/gallery/MemoryMosaic";
import { Aurora } from "@/components/motion/Aurora";
import { Counter } from "@/components/motion/Counter";
import { PhotoBackdrop } from "@/components/motion/PhotoBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { WaveText } from "@/components/motion/WaveText";
import { PromotionsRail } from "@/components/promotions/PromotionsRail";
import { TestimonyMarquee } from "@/components/promotions/TestimonyMarquee";
import { TestimonyStage } from "@/components/promotions/TestimonyStage";
import { Container } from "@/components/ui/LayoutBits";
import { SITE } from "@/constants/site";
import { getPublishedAlumni } from "@/lib/alumni-store";
import { getCategories, getFilieres, getPromotions } from "@/lib/catalog";
import { useMediaQuery } from "@/lib/use-media-query";
import { useAlumni, useGallery, usePromotionCategories, usePromotions, usePromotionStudents } from "@/lib/use-live-data";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

const BAND = ["Souvenirs", "Parcours", "Fierté EPCA", "Retrouvailles", "Réussites"];

export function HomePage() {
  usePromotions();
  usePromotionStudents();
  usePromotionCategories();
  useAlumni();
  const gallery = useGallery();
  const tabletUp = useMediaQuery("(min-width: 768px)");

  const promotions = getPromotions();
  const filieres = getFilieres();
  const alumni = getPublishedAlumni();
  const categories = getCategories();
  const photos = useMemo(() => gallery.filter((item) => item.published), [gallery]);
  const heroImages = useMemo(() => {
    const srcs = photos.slice(0, 5).map((item) => item.src);
    const late = srcs.filter((src) => src.includes("evt-10"));
    const rest = srcs.filter((src) => !src.includes("evt-10"));
    return late.length ? [...rest, ...late] : srcs;
  }, [photos]);

  // Un seul bandeau : les mots-clés alternent avec les promotions
  const bandItems = useMemo(() => {
    const labels = promotions.map((promo) => promo.label);
    const merged: string[] = [];
    const length = Math.max(BAND.length, labels.length);
    for (let i = 0; i < length; i += 1) {
      if (BAND[i % BAND.length]) merged.push(BAND[i % BAND.length]);
      if (labels.length > 0) merged.push(labels[i % labels.length]);
    }
    return merged;
  }, [promotions]);

  return (
    <div className="overflow-x-clip">
      {/* ——— HERO ——— */}
      <section className="stage relative min-h-[100svh] overflow-x-clip overflow-y-hidden text-white">
        {heroImages.length > 0 ? <PhotoBackdrop images={heroImages} /> : <Aurora />}

        <Container className="relative grid min-h-[100svh] items-center gap-6 pb-24 pt-28 text-center sm:pt-32 md:grid-cols-[1.1fr_1fr] md:text-left lg:pb-32">
          <div className="relative z-10 flex flex-col items-center overflow-visible md:items-start">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur"
            >
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-glow" />
              {SITE.schoolShort} · {SITE.country}
            </motion.p>

            <h1 className="mt-6 overflow-visible font-display text-[clamp(3rem,16vw,4.8rem)] font-extrabold leading-[0.92] tracking-[-0.05em] sm:mt-8 sm:text-[clamp(4.8rem,13vw,6.5rem)] md:text-[clamp(3.6rem,8.2vw,5.4rem)] lg:text-[clamp(4.5rem,8.5vw,7rem)] xl:text-[clamp(5rem,9vw,9rem)] md:leading-[0.9]">
              <span className="block">
                <SplitText text="Ma" delay={0.08} duration={0.5} inView={false} />
              </span>
              <span className="block overflow-visible whitespace-nowrap leading-[1.08]">
                <WaveText text="Promotion" delay={0.22} />
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-6 max-w-md text-base leading-7 text-white/80 sm:mt-8 sm:text-lg sm:leading-8"
            >
              Les visages, les fous rires, les diplômes, les carrières. Revivez les plus beaux souvenirs de
              l’EPCA et retrouvez votre promotion.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.85 }}
              className="mt-8 grid w-full grid-cols-2 gap-3 sm:mt-10 sm:flex sm:flex-wrap sm:items-center sm:gap-4"
            >
              <Link
                to="/promotions"
                className="group flex h-14 w-full items-center justify-between gap-2 rounded-full bg-white pl-5 pr-2 text-[15px] font-semibold text-navy-900 transition-colors hover:bg-navy-900 hover:text-white sm:inline-flex sm:h-auto sm:w-auto sm:justify-start sm:gap-3 sm:py-3 sm:pl-7 sm:pr-3 sm:text-sm"
              >
                <span className="sm:hidden">Ma promo</span>
                <span className="hidden sm:inline">Retrouver ma promotion</span>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-900 text-white transition-colors group-hover:bg-white group-hover:text-navy-900 sm:h-9 sm:w-9">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                to="/galerie"
                className="flex h-14 w-full items-center justify-center rounded-full border border-white/35 bg-white/10 px-4 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:border-white hover:bg-white hover:text-navy-900 sm:inline-flex sm:h-auto sm:w-auto sm:px-7 sm:py-3.5 sm:text-sm"
              >
                <span className="sm:hidden">Voir galerie</span>
                <span className="hidden sm:inline">Voir la galerie</span>
              </Link>
            </motion.div>
          </div>

          {/* Logo EPCA : rotation + reflet miroir. Absent sur téléphone (le titre prend toute la place). */}
          {tabletUp ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-0 h-[22rem] lg:h-[36rem]"
            >
              <SpinningCrest className="h-full w-full" />
            </motion.div>
          ) : null}
        </Container>
      </section>

      {/* ——— BANDEAU ——— */}
      <div className="relative z-10 -mt-7 -rotate-[1.4deg] overflow-hidden bg-sky py-5 shadow-glow">
        <div className="marquee-track font-display text-2xl font-extrabold uppercase tracking-[-0.01em] text-white md:text-4xl">
          {[...bandItems, ...bandItems, ...bandItems, ...bandItems].map((word, index) => (
            <span key={`${word}-${index}`} className="inline-flex items-center gap-6 pr-6 whitespace-nowrap md:gap-10 md:pr-10">
              {word}
              <span className="h-2 w-2 rounded-full bg-white/70 md:h-3 md:w-3" />
            </span>
          ))}
        </div>
      </div>

      {/* ——— CHIFFRES ——— */}
      <section className="relative bg-navy-900 pb-20 pt-24 text-white md:pb-28 md:pt-32">
        <Aurora />
        <Container className="relative">
          <div className="grid gap-10 md:grid-cols-4">
            {[
              { label: "Promotions", value: 31, prefix: "+", suffix: "" },
              { label: "Personnes formées", value: 3, prefix: "+", suffix: "k" },
              { label: "Catégories de concours", value: categories.length, prefix: "", suffix: "" },
              { label: "Filières", value: filieres.length, prefix: "", suffix: "" },
            ].map((item, index) => (
              <Reveal key={item.label} delay={index * 0.1}>
                <div className="border-t-2 border-glow pt-5">
                  <p className="font-display text-7xl font-extrabold leading-none tracking-[-0.04em] md:text-8xl">
                    <Counter value={item.value} prefix={item.prefix} suffix={item.suffix} />
                  </p>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                    {item.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ——— SOUVENIRS ——— */}
      <section className="py-24 md:py-32">
        <Container>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky">Souvenirs</p>
                <h2 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-[0.98] tracking-[-0.03em] text-navy-900 md:text-6xl">
                  Ces moments qu’on n’oublie pas.
                </h2>
              </div>
              <Link
                to="/galerie"
                className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-sky"
              >
                Toute la galerie
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-12">
            {photos.length > 0 ? (
              <MemoryMosaic photos={photos} />
            ) : (
              <p className="text-sm text-ink-soft">
                Les photos des événements de l’école apparaîtront ici dès que l’administration les publiera.
              </p>
            )}
          </div>
        </Container>
      </section>

      {/* ——— PROMOTIONS (défilement horizontal) ——— */}
      <PromotionsRail promotions={promotions} />

      {/* ——— TÉMOIGNAGES ——— */}
      <section className="relative overflow-hidden bg-navy-950 py-24 text-white md:py-32">
        <Aurora />
        <Container className="relative">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-glow">Témoignages</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-[0.98] tracking-[-0.03em] md:text-6xl">
              Ils l’ont vécu, ils en parlent.
            </h2>
          </Reveal>
          <div className="mt-16">
            <TestimonyStage items={alumni} />
          </div>
        </Container>
        <div className="relative mt-20">
          <TestimonyMarquee items={alumni} tone="dark" />
        </div>
      </section>

      {/* ——— CATÉGORIES ——— */}
      <section className="bg-wash py-24 md:py-32">
        <Container>
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky">Catégories</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-[0.98] tracking-[-0.03em] text-navy-900 md:text-6xl">
              Du C2 à l’A2.
            </h2>
          </Reveal>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 font-display text-[clamp(4rem,14vw,11rem)] font-extrabold leading-[0.95] tracking-[-0.05em]">
            {categories.map((cat, index) => (
              <motion.span
                key={cat.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ duration: 0.8, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="text-outline cursor-default"
              >
                {cat.code}
              </motion.span>
            ))}
          </div>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-md text-sm leading-7 text-ink-soft">
              Chaque promotion se parcourt par catégorie, puis par filière, jusqu’au profil de l’élève.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ——— COMMENT TÉMOIGNER ——— */}
      <section className="border-y border-line bg-paper py-24 md:py-32">
        <Container>
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky">Comment témoigner</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-[0.98] tracking-[-0.03em] text-navy-900 md:text-6xl">
              Votre témoignage vit sur votre profil.
            </h2>
          </Reveal>

          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              { step: "01", title: "Trouvez votre promotion", text: "Parcourez les années, puis ouvrez la vôtre." },
              { step: "02", title: "Ouvrez votre profil", text: "Catégorie, filière, puis votre fiche élève." },
              { step: "03", title: "Déposez le témoignage", text: "Il reste attaché à votre profil et publié après validation." },
            ].map((item, index) => (
              <Reveal key={item.step} delay={index * 0.1}>
                <div>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 + index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="h-[2px] origin-left bg-navy-900"
                  />
                  <p className="mt-6 font-display text-6xl font-extrabold tracking-[-0.04em] text-sky">{item.step}</p>
                  <h3 className="mt-5 font-display text-2xl font-bold text-navy-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-ink-soft">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ——— APPEL FINAL ——— */}
      <section className="stage relative overflow-hidden py-28 text-white md:py-44">
        <PhotoBackdrop
          images={["/gallery/evt-01.jpg"]}
          overlay="from-navy-950/85 via-navy-900/70 to-navy-900/60"
        />
        <Container className="relative text-center">
          <div className="mb-8 flex justify-center">
            <EpcaCrest size="xl" inverted />
          </div>
          <h2 className="mx-auto max-w-4xl font-display text-5xl font-extrabold leading-[0.92] tracking-[-0.045em] sm:text-7xl md:text-8xl">
            <SplitText text="Votre histoire commence ici." />
          </h2>
          <Reveal delay={0.2}>
            <div className="mt-12">
              <Link
                to="/promotions"
                className="group inline-flex items-center gap-3 rounded-full bg-white py-3 pl-8 pr-3 text-base font-semibold text-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
              >
                Trouver mon profil
                <span className="grid h-11 w-11 place-items-center rounded-full bg-navy-900 text-white transition-colors group-hover:bg-white group-hover:text-navy-900">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
