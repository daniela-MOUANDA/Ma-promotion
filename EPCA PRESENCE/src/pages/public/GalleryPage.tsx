import { PhotoLightbox } from "@/components/gallery/PhotoLightbox";
import { Container, PageHero } from "@/components/ui/LayoutBits";
import { getGalleryEvents } from "@/lib/gallery-store";
import { cn } from "@/lib/cn";
import { useGallery } from "@/lib/use-live-data";
import { formatDate } from "@/lib/format";
import { AnimatePresence, motion } from "framer-motion";
import { Expand } from "lucide-react";
import { useMemo, useState } from "react";

export function GalleryPage() {
  const all = useGallery();
  const published = useMemo(() => all.filter((item) => item.published), [all]);
  const events = useMemo(() => getGalleryEvents(published), [published]);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<number | null>(null);

  const photos = useMemo(
    () => (filter === "all" ? published : published.filter((item) => item.event === filter)),
    [published, filter],
  );

  return (
    <div>
      <PageHero
        kicker="Galerie"
        title="Les souvenirs de l’école."
        description="Cérémonies, journées culturelles, vie de classe : les moments partagés par l’administration de l’EPCA."
        image="/gallery/evt-02.jpg"
      />

      <Container className="py-14 md:py-20">
        <div className="flex flex-wrap gap-2">
          {["all", ...events].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              className={cn(
                "relative rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                filter === name ? "text-white" : "bg-paper text-ink-soft ring-1 ring-line hover:text-navy-900",
              )}
            >
              {filter === name ? (
                <motion.span
                  layoutId="gallery-filter"
                  className="absolute inset-0 rounded-full bg-navy-900"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10">{name === "all" ? `Tout (${published.length})` : name}</span>
            </button>
          ))}
        </div>

        {photos.length === 0 ? (
          <p className="mt-14 text-center text-sm text-ink-soft">
            Aucune photo publiée pour le moment. L’administration les ajoutera bientôt.
          </p>
        ) : (
          <motion.div layout className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
            <AnimatePresence mode="popLayout">
              {photos.map((photo, index) => (
                <motion.figure
                  layout
                  key={photo.id}
                  initial={{ opacity: 0, y: 40, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative mb-5 break-inside-avoid overflow-hidden rounded-[1.75rem] bg-navy-900"
                >
                  <button type="button" className="block w-full text-left" onClick={() => setOpen(index)}>
                    <img
                      src={photo.src}
                      alt={photo.title}
                      loading="lazy"
                      className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="absolute inset-x-0 bottom-0 translate-y-3 p-5 text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      <span className="block font-display text-lg font-bold">{photo.title}</span>
                      <span className="mt-1 block text-xs text-white/70">
                        {photo.event} · {formatDate(photo.eventDate)}
                      </span>
                    </span>
                    <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-navy-900 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <Expand className="h-4 w-4" />
                    </span>
                  </button>
                </motion.figure>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </Container>

      <PhotoLightbox photos={photos} index={open} onClose={() => setOpen(null)} onChange={setOpen} />
    </div>
  );
}
