import { motion } from "framer-motion";

/**
 * Écusson de l’EPCA qui tourne sur lui-même, avec son reflet « miroir » dessous.
 * Le reflet fait partie du même volume 3D : il tourne en même temps que le logo.
 */
export function SpinningCrest({ className }: { className?: string }) {
  return (
    <div className={className} style={{ perspective: 1400 }}>
      <div className="relative mx-auto flex h-full w-full items-center justify-center">
        {/* halo qui respire */}
        <motion.div
          aria-hidden
          className="absolute h-[70%] w-[70%] rounded-full bg-glow/30 blur-[90px]"
          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="relative flex w-[62%] max-w-[22rem] flex-col items-center"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        >
          <motion.img
            src="/logo-epca-white.png"
            alt="Logo de l’EPCA"
            draggable={false}
            className="w-full select-none drop-shadow-[0_0_40px_rgba(127,176,255,0.55)]"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* reflet miroir */}
          <img
            aria-hidden
            src="/logo-epca-white.png"
            alt=""
            draggable={false}
            className="-mt-1 w-full select-none opacity-40"
            style={{
              transform: "scaleY(-1)",
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent 62%)",
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent 62%)",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
