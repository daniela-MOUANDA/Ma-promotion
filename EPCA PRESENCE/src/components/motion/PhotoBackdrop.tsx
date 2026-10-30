import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Photos plein cadre en fondu enchaîné, avec zoom lent (effet « Ken Burns »).
 * Un voile marine garde le texte lisible par-dessus.
 */
export function PhotoBackdrop({
  images,
  interval = 6500,
  overlay = "from-navy-950/90 via-navy-950/70 to-navy-900/40",
}: {
  images: string[];
  interval?: number;
  overlay?: string;
}) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), interval);
    return () => window.clearInterval(timer);
  }, [count, interval]);

  if (count === 0) return null;
  const safe = index % count;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        <motion.img
          key={images[safe]}
          src={images[safe]}
          alt=""
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1.16 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.4 },
            scale: { duration: (interval + 1400) / 1000, ease: "linear" },
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      <div className={`absolute inset-0 bg-gradient-to-r ${overlay}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
    </div>
  );
}
