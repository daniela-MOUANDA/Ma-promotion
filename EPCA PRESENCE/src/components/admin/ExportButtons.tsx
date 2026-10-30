import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { exportListExcel, exportListPdf, type ExportMeta } from "@/lib/list-export";
import type { Application } from "@/types/domain";
import { useState } from "react";

function PdfMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-5 w-5 shrink-0", className)} aria-hidden="true">
      <path fill="#E5252A" d="M6 2h13l7 7v21H6z" />
      <path fill="#B71C1C" d="M19 2v7h7z" />
      <path fill="#fff" d="M8.2 21.2h3.1c1.7 0 2.7-.9 2.7-2.3 0-1.5-1-2.3-2.7-2.3H9.6v-3.2H8.2zm1.4-4.2h1.4c.8 0 1.3.4 1.3 1.1s-.5 1.1-1.3 1.1H9.6zm5.4 4.2h1.5l1.7-4.1 1.6 4.1h1.5l-2.4-5.6h-1.5zm6.6 0h3.6v-1.2h-2.2v-1.4h2v-1.2h-2V16.8h2.1v-1.2h-3.5z" />
    </svg>
  );
}

function ExcelMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-5 w-5 shrink-0", className)} aria-hidden="true">
      <path fill="#1D6F42" d="M6 3h20a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path fill="#fff" d="M10.2 22.2 14 16.1l-3.6-6.3h2.3l2.4 4.6c.2.4.3.7.5 1.1h.1c.1-.4.3-.7.5-1.1l2.5-4.6h2.2L17.3 16l3.9 6.2h-2.3l-2.8-4.8c-.1-.2-.2-.5-.3-.8h-.1c-.1.3-.2.6-.3.8l-2.8 4.8z" />
    </svg>
  );
}

export function ExportButtons({
  applications,
  meta,
  disabled,
}: {
  applications: Application[];
  meta: ExportMeta;
  disabled?: boolean;
}) {
  const empty = disabled || applications.length === 0;
  const [busy, setBusy] = useState<"pdf" | "excel" | null>(null);

  async function onPdf() {
    if (empty || busy) return;
    setBusy("pdf");
    try {
      await exportListPdf(applications, meta);
    } finally {
      setBusy(null);
    }
  }

  function onExcel() {
    if (empty || busy) return;
    setBusy("excel");
    try {
      exportListExcel(applications, meta);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={empty || Boolean(busy)}
        onClick={() => void onPdf()}
        className="border-[#E5252A]/35 bg-[#E5252A]/8 text-[#B71C1C] hover:border-[#E5252A] hover:bg-[#E5252A]/14"
      >
        <PdfMark />
        {busy === "pdf" ? "Préparation…" : "PDF"}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={empty || Boolean(busy)}
        onClick={onExcel}
        className="border-[#1D6F42]/35 bg-[#1D6F42]/8 text-[#146C43] hover:border-[#1D6F42] hover:bg-[#1D6F42]/14"
      >
        <ExcelMark />
        {busy === "excel" ? "Préparation…" : "Excel"}
      </Button>
    </div>
  );
}
