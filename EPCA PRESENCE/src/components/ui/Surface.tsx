import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type Gradient = "brand" | "mint" | "sky" | "sunset" | "blush" | "night";

/** Pastilles douces : l'icône porte la couleur, pas le fond. */
const tintClass: Record<Gradient, string> = {
  brand: "bg-brand-50 text-brand-600",
  mint: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  sunset: "bg-amber-50 text-amber-600",
  blush: "bg-rose-50 text-rose-600",
  night: "bg-slate-100 text-slate-600",
};

const fillClass: Record<Gradient, string> = {
  brand: "bg-brand-500",
  mint: "bg-emerald-500",
  sky: "bg-sky-500",
  sunset: "bg-amber-500",
  blush: "bg-rose-500",
  night: "bg-slate-700",
};

export function Card({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-hairline bg-white shadow-card",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHead({
  title,
  subtitle,
  icon: Icon,
  gradient = "brand",
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  gradient?: Gradient;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {Icon ? (
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tintClass[gradient])}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold tracking-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">{kicker}</p>
        ) : null}
        <h1 className="mt-1 font-display text-[26px] font-extrabold leading-tight tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  gradient = "brand",
  trend,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  gradient?: Gradient;
  trend?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group rounded-2xl border border-hairline bg-white p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon ? (
          <span className={cn("grid h-9 w-9 place-items-center rounded-xl", tintClass[gradient])}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-display text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
        {trend ? <div className="pb-1">{trend}</div> : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function Progress({
  value,
  tone = "brand",
  className,
}: {
  value: number;
  tone?: Gradient;
  className?: string;
}) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", fillClass[tone])}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

const AVATAR_TINTS = [
  "bg-brand-50 text-brand-600",
  "bg-brand-100 text-brand-700",
  "bg-brand-200 text-brand-700",
  "bg-slate-100 text-slate-600",
  "bg-slate-200 text-slate-700",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function tintFor(name: string) {
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return AVATAR_TINTS[sum % AVATAR_TINTS.length];
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const sizes = {
    xs: "h-7 w-7 text-[10px]",
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
  };
  return (
    <span
      title={name}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-display font-bold ring-2 ring-white",
        sizes[size],
        tintFor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  names,
  max = 5,
  size = "sm",
}: {
  names: string[];
  max?: number;
  size?: "xs" | "sm" | "md";
}) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((name, index) => (
          <Avatar key={`${name}-${index}`} name={name} size={size} />
        ))}
      </div>
      {rest > 0 ? (
        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
          +{rest}
        </span>
      ) : null}
      {names.length === 0 ? <span className="text-xs text-slate-400">Aucun étudiant</span> : null}
    </div>
  );
}

export function Chip({
  children,
  tone = "slate",
  icon: Icon,
}: {
  children: ReactNode;
  tone?: "slate" | "brand" | "mint" | "amber" | "rose" | "sky";
  icon?: LucideIcon;
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    brand: "bg-brand-50 text-brand-700",
    mint: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tones[tone],
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {Icon ? (
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon className="h-6 w-6" />
        </span>
      ) : null}
      <p className="font-display text-sm font-bold text-slate-700">{title}</p>
      {message ? <p className="max-w-sm text-sm text-slate-500">{message}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
