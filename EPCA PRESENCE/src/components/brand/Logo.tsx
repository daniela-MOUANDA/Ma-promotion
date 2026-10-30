import { SITE } from "@/constants/site";
import { cn } from "@/lib/cn";

type LogoSize = "sm" | "md" | "lg" | "xl";

const height: Record<LogoSize, string> = {
  sm: "h-11",
  md: "h-12",
  lg: "h-16",
  xl: "h-28",
};

const title: Record<LogoSize, string> = {
  sm: "text-[1.08rem]",
  md: "text-[1.2rem]",
  lg: "text-[1.45rem]",
  xl: "text-[1.9rem]",
};

interface LogoProps {
  size?: LogoSize;
  withName?: boolean;
  /** Fond sombre : écusson blanc. Fond clair : écusson bleu marine. */
  inverted?: boolean;
  className?: string;
}

/** Écusson officiel de l’EPCA, affiché tel quel (détouré, sans pastille). */
export function EpcaCrest({
  size = "md",
  inverted = false,
  className,
}: {
  size?: LogoSize;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <img
      src={inverted ? "/logo-epca-white.png" : "/logo-epca-navy.png"}
      alt="Logo de l’EPCA"
      draggable={false}
      className={cn("w-auto shrink-0 select-none object-contain", height[size], className)}
    />
  );
}

export function Logo({ size = "md", withName = false, inverted = false, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <EpcaCrest size={size} inverted={inverted} />
      {withName ? (
        <span className={cn("leading-none", inverted ? "text-white" : "text-navy-900")}>
          <span className={cn("block font-display font-bold tracking-tight", title[size])}>
            {SITE.shortName}
          </span>
          <span
            className={cn(
              "mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em]",
              inverted ? "text-glow/80" : "text-ink-soft",
            )}
          >
            {SITE.schoolShort} · {SITE.country}
          </span>
        </span>
      ) : null}
    </span>
  );
}
