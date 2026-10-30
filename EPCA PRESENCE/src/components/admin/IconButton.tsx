import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: "navy" | "danger" | "gold" | "green" | "muted";
  children: ReactNode;
}

const tones = {
  navy: "text-slate-500 hover:bg-brand-50 hover:text-brand-700",
  danger: "text-slate-500 hover:bg-rose-50 hover:text-rose-600",
  gold: "text-slate-500 hover:bg-amber-50 hover:text-amber-600",
  green: "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600",
  muted: "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
};

export function IconButton({ label, tone = "navy", className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-40",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
