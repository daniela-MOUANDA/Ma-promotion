import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-react";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, htmlFor, className, children }: FieldProps) {
  return (
    <label htmlFor={htmlFor} className={cn("block space-y-1.5", className)}>
      <span className="text-[13px] font-semibold text-slate-700">{label}</span>
      {children}
      {hint && !error ? <span className="block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="block text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}

// text-base sous `sm` : évite le zoom automatique des champs sur iOS.
const controlClass =
  "w-full rounded-2xl border border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-navy-700 focus:bg-paper-2 disabled:opacity-60 sm:text-sm";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select className={cn(controlClass, "appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </span>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, "min-h-28 resize-y", className)} {...props} />;
}
