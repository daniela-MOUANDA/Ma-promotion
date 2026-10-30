import { Aurora } from "@/components/motion/Aurora";
import { PhotoBackdrop } from "@/components/motion/PhotoBackdrop";
import { SplitText } from "@/components/motion/SplitText";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer";
}) {
  return <Tag className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8", className)}>{children}</Tag>;
}

/** Héros de page intérieure — scène marine, titre animé. */
export function PageHero({
  kicker,
  title,
  description,
  children,
  image,
}: {
  kicker?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Photo de fond (chemin public) */
  image?: string;
}) {
  return (
    <section className="stage relative overflow-hidden text-white">
      {image ? <PhotoBackdrop images={[image]} overlay="from-navy-950/92 via-navy-950/75 to-navy-900/45" /> : <Aurora />}
      <Container className="relative pb-12 pt-32 md:pb-20 md:pt-40">
        {kicker ? (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-glow"
          >
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-glow" />
            {kicker}
          </motion.p>
        ) : null}
        <h1 className="mt-5 max-w-4xl font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.035em] sm:text-7xl">
          <SplitText text={title} />
        </h1>
        {description ? (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 max-w-xl text-base leading-8 text-white/65"
          >
            {description}
          </motion.p>
        ) : null}
        {children ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8"
          >
            {children}
          </motion.div>
        ) : null}
      </Container>
    </section>
  );
}

export function PageBanner(props: { kicker?: string; title: string; description?: string }) {
  return <PageHero {...props} />;
}

export function PageIntro({
  kicker,
  title,
  description,
}: {
  kicker?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      {kicker ? (
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">{kicker}</p>
      ) : null}
      <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-navy-900 sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-soft sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-paper px-6 py-16 text-center">
      <p className="font-display text-2xl font-semibold text-navy-900">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-soft">{description}</p>
    </div>
  );
}

export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-sky/20 bg-brand-50 px-3.5 py-2.5 text-xs leading-5 text-navy-800">
      {children}
    </p>
  );
}
