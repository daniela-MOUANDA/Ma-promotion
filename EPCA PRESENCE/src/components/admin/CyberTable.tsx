import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function CyberTable({
  children,
  empty,
  minWidth = "980px",
  className,
}: {
  children: ReactNode;
  empty?: ReactNode;
  minWidth?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "scroll-slim overflow-x-auto rounded-2xl border border-hairline bg-white shadow-card",
        className,
      )}
    >
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
      {empty}
    </div>
  );
}

export function CyberHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
      {children}
    </thead>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("whitespace-nowrap px-4 py-3.5 font-semibold", className)}>{children}</th>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3.5 align-middle text-slate-600", className)}>{children}</td>;
}

export function Tr({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={cn(
        "border-t border-hairline transition-colors hover:bg-slate-50/70",
        onClick && "cursor-pointer group",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}
