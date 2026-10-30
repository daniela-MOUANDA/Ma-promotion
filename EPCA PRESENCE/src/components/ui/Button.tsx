import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold" | "danger" | "onDark" | "light";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-45",
  secondary: "border border-line bg-paper text-navy-900 hover:border-navy-900/25",
  ghost: "text-ink-soft hover:bg-wash hover:text-navy-900",
  gold: "bg-sky text-white hover:brightness-110 disabled:opacity-45",
  danger: "bg-blush text-white hover:brightness-95 disabled:opacity-45",
  onDark: "border border-white/25 bg-transparent text-white hover:border-white/55",
  light: "bg-white text-navy-900 hover:bg-wash disabled:opacity-45",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-full px-4 text-[13px]",
  md: "h-11 rounded-full px-5 text-sm",
  lg: "h-12 rounded-full px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-sans font-semibold transition-all duration-200 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
