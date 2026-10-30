import { cn } from "@/lib/cn";
import { motion } from "framer-motion";

/** Vague lettre par lettre. Chaque glyphe a une vraie couleur — le « n » ne peut plus disparaître. */
export function WaveText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const letters = Array.from(text);
  const last = Math.max(letters.length - 1, 1);

  return (
    <span className={cn("inline-block whitespace-nowrap", className)} aria-label={text}>
      {letters.map((letter, index) => (
        <motion.span
          key={`${letter}-${index}`}
          aria-hidden
          className="inline-block"
          style={{ color: shineColor(index / last) }}
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: delay + index * 0.045,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </span>
  );
}

function shineColor(t: number) {
  if (t <= 0.1) return "#ffffff";
  if (t < 0.45) return mix("#ffffff", "#9cc2ff", (t - 0.1) / 0.35);
  if (t < 0.9) return mix("#9cc2ff", "#4f8cff", (t - 0.45) / 0.45);
  return "#4f8cff";
}

function mix(a: string, b: string, t: number) {
  const pa = hex(a);
  const pb = hex(b);
  const k = Math.min(1, Math.max(0, t));
  return `#${[0, 1, 2]
    .map((i) => Math.round(pa[i] + (pb[i] - pa[i]) * k).toString(16).padStart(2, "0"))
    .join("")}`;
}

function hex(value: string) {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}
