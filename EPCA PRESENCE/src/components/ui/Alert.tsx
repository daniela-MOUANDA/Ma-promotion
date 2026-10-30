import { cn } from "@/lib/cn";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type AlertTone = "success" | "warning" | "danger" | "info";

const styles: Record<AlertTone, { wrap: string; badge: string; title: string; icon: LucideIcon }> = {
  success: {
    wrap: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-600 text-white",
    title: "text-emerald-900",
    icon: CheckCircle2,
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50",
    badge: "bg-amber-500 text-white",
    title: "text-amber-900",
    icon: TriangleAlert,
  },
  danger: {
    wrap: "border-rose-200 bg-rose-50",
    badge: "bg-rose-600 text-white",
    title: "text-rose-900",
    icon: CircleAlert,
  },
  info: {
    wrap: "border-brand-200 bg-brand-50",
    badge: "bg-brand-500 text-white",
    title: "text-brand-800",
    icon: Info,
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  actions,
  icon,
  className,
}: {
  tone?: AlertTone;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  const style = styles[tone];
  const Icon = icon ?? style.icon;

  return (
    <div className={cn("flex gap-3.5 rounded-2xl border p-4", style.wrap, className)} role="status">
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", style.badge)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("font-display text-sm font-bold", style.title)}>{title}</p>
        {children ? <div className="mt-1 text-sm leading-6 text-slate-600">{children}</div> : null}
        {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
