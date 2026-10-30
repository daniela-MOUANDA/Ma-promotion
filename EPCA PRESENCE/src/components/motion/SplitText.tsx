import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Révélation mot par mot, masquée — le texte « monte » dans sa ligne.
 * Le déclencheur est le conteneur (jamais le mot caché), sinon un mot entièrement
 * rogné par son masque ne serait jamais détecté comme visible et le titre resterait vide.
 */
export function SplitText({
  text,
  className,
  delay = 0,
  stagger = 0.07,
  duration = 0.85,
  inView = true,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  inView?: boolean;
}) {
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      aria-label={text}
      initial="hidden"
      {...(inView
        ? { whileInView: "visible" as const, viewport: { once: true, amount: "some" as const } }
        : { animate: "visible" as const })}
      variants={{
        hidden: {},
        visible: { transition: { delayChildren: delay, staggerChildren: stagger } },
      }}
    >
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="inline-block overflow-hidden pb-[0.14em] align-bottom">
          <motion.span
            aria-hidden
            className="inline-block"
            variants={{
              hidden: { y: "115%" },
              visible: { y: 0, transition: { duration, ease: EASE } },
            }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 ? "\u00A0" : null}
        </span>
      ))}
    </motion.span>
  );
}
