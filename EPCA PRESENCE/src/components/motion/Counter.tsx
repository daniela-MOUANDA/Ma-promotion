import { animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const format = new Intl.NumberFormat("fr-FR");

/** Compteur animé. `prefix` permet d’afficher « +31 », « +3 000 »… */
export function Counter({
  value,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format.format(display)}
      {suffix}
    </span>
  );
}
