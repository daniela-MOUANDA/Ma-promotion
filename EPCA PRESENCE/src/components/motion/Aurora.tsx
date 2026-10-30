import { motion } from "framer-motion";

/** Halos bleus qui respirent en arrière-plan des scènes sombres. */
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -right-32 -top-24 h-[34rem] w-[34rem] rounded-full bg-navy-600/50 blur-[120px]"
        animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -left-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-sky/30 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, -30, 0] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-glow/20 blur-[100px]"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
