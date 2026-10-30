import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = "md",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "dialog-pop relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-float",
          size === "md" && "max-w-xl",
          size === "lg" && "max-w-3xl",
          size === "xl" && "max-w-5xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 bg-navy-900 px-6 py-5 text-white">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-white/60">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-hairline bg-slate-50 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
