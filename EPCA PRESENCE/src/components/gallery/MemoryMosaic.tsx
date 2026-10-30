import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { GalleryPhoto } from "@/types/domain";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const SPANS = [
  "col-span-2 md:col-span-2 md:row-span-2",
  "md:row-span-2",
  "",
  "",
  "col-span-2 md:col-span-2",
  "col-span-2 md:col-span-2",
];

/** Mosaïque de souvenirs : chaque photo se « dévoile » au scroll et zoome au survol. */
export function MemoryMosaic({ photos }: { photos: GalleryPhoto[] }) {
  const items = photos.slice(0, 6);
  if (items.length === 0) return null;

  return (
    <div className="grid auto-rows-[11rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] md:grid-cols-4 md:gap-4">
      {items.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, clipPath: "inset(14% 14% 14% 14% round 2rem)", scale: 0.92 }}
          whileInView={{ opacity: 1, clipPath: "inset(0% 0% 0% 0% round 2rem)", scale: 1 }}
          viewport={{ once: true, margin: "-6% 0px" }}
          transition={{ duration: 0.9, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={cn("group relative overflow-hidden rounded-[2rem] bg-navy-900", SPANS[index])}
        >
          <Link to="/galerie" className="block h-full w-full">
            <img
              src={photo.src}
              alt={photo.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/5 to-transparent transition-opacity duration-500" />
            <span className="absolute inset-x-0 bottom-0 p-4 text-white md:p-5">
              <span className="block font-display text-base font-bold leading-tight md:text-lg">{photo.title}</span>
              <span className="mt-1 block text-[11px] text-white/65">
                {photo.event} · {formatDate(photo.eventDate)}
              </span>
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
