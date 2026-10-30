import { formatDate } from "@/lib/format";
import type { GalleryPhoto } from "@/types/domain";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useEffect } from "react";

/** Visionneuse plein écran : flèches du clavier, Échap, clic hors de la photo. */
export function PhotoLightbox({
  photos,
  index,
  onClose,
  onChange,
}: {
  photos: GalleryPhoto[];
  index: number | null;
  onClose: () => void;
  onChange: (next: number) => void;
}) {
  const open = index !== null && photos[index] !== undefined;

  useEffect(() => {
    if (!open || index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onChange((index + 1) % photos.length);
      if (event.key === "ArrowLeft") onChange((index - 1 + photos.length) % photos.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, index, photos.length, onClose, onChange]);

  const photo = open && index !== null ? photos[index] : null;

  return (
    <AnimatePresence>
      {photo && index !== null ? (
        <motion.div
          key="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] flex flex-col bg-navy-950/95 backdrop-blur-xl"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={photo.title}
        >
          <div className="flex items-center justify-between px-5 py-4 text-white" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-sm font-semibold text-white/60">
              {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
            </p>
            <button
              type="button"
              aria-label="Fermer"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 transition-colors hover:bg-white hover:text-navy-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
            <AnimatePresence mode="wait">
              <motion.img
                key={photo.id}
                src={photo.src}
                alt={photo.title}
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full rounded-2xl object-contain shadow-float"
              />
            </AnimatePresence>

            {photos.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Photo précédente"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange((index - 1 + photos.length) % photos.length);
                  }}
                  className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-navy-900 sm:left-6"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Photo suivante"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange((index + 1) % photos.length);
                  }}
                  className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-navy-900 sm:right-6"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>

          <div className="px-6 py-6 text-center text-white" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-xl font-bold">{photo.title}</p>
            <p className="mt-1 text-sm text-white/55">
              {photo.event} · {formatDate(photo.eventDate)}
            </p>
            {photo.caption ? <p className="mx-auto mt-2 max-w-xl text-sm text-white/70">{photo.caption}</p> : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
