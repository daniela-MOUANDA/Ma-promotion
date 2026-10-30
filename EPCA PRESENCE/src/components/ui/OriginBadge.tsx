import { cn } from "@/lib/cn";
import type { StudentOrigin } from "@/types/domain";

export const ORIGIN_LABEL: Record<StudentOrigin, string> = {
  INTERNE: "Interne",
  EXTERNE: "Externe",
};

/** Interne = navy plein · Externe = bleu clair cerclé. `onPhoto` : version lisible sur une photo. */
export function OriginBadge({
  origin,
  onPhoto = false,
  className,
}: {
  origin: StudentOrigin;
  onPhoto?: boolean;
  className?: string;
}) {
  const interne = origin === "INTERNE";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]",
        onPhoto
          ? interne
            ? "bg-navy-900/85 text-white backdrop-blur"
            : "bg-sky/90 text-white backdrop-blur"
          : interne
            ? "bg-navy-900 text-white"
            : "border border-sky/40 bg-sky/10 text-sky",
        className,
      )}
    >
      {ORIGIN_LABEL[origin]}
    </span>
  );
}
