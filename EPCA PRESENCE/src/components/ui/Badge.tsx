import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { APPLICATION_STATUS_LABEL, ATTENDANCE_MARK_LABEL, COMPETITION_STATUS_LABEL } from "@/constants/labels";
import type { ApplicationStatus, AttendanceMark, CompetitionStatus, StudentPublicStatus } from "@/types/domain";

export function Badge({
  children,
  tone = "navy",
}: {
  children: ReactNode;
  tone?: "navy" | "gold" | "green" | "muted" | "danger";
}) {
  const tones = {
    navy: "bg-brand-50 text-brand-700 ring-brand-500/15",
    gold: "bg-amber-50 text-amber-700 ring-amber-500/15",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-500/15",
    muted: "bg-slate-100 text-slate-600 ring-slate-500/10",
    danger: "bg-rose-50 text-rose-700 ring-rose-500/15",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function CompetitionStatusBadge({ status }: { status: CompetitionStatus }) {
  const tone = status === "open" ? "green" : status === "upcoming" ? "gold" : "muted";
  return <Badge tone={tone}>{COMPETITION_STATUS_LABEL[status]}</Badge>;
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const tone =
    status === "ADMIS" || status === "AUTORISE_CONCOURS" || status === "DOSSIER_PHYSIQUE_VALIDE"
      ? "green"
      : status === "SOUMISE" || status === "DOSSIER_PHYSIQUE_ATTENDU" || status === "DOSSIER_PHYSIQUE_DEPOSE"
        ? "gold"
        : status === "ANNULEE" || status === "NON_ADMIS" || status === "NON_AUTORISE" || status === "DOSSIER_PHYSIQUE_REJETE"
          ? "danger"
          : "muted";
  return <Badge tone={tone}>{APPLICATION_STATUS_LABEL[status]}</Badge>;
}

export function StudentStatusBadge({ status }: { status: StudentPublicStatus }) {
  if (status === "DIPLOME") return <Badge tone="gold">Diplômé</Badge>;
  if (status === "ABANDON") return <Badge tone="muted">Abandon</Badge>;
  if (status === "EXCLU") return <Badge tone="danger">Exclu</Badge>;
  return <Badge tone="green">En formation</Badge>;
}

export function AttendanceMarkBadge({ mark }: { mark: AttendanceMark }) {
  const tone = mark === "present" ? "green" : "danger";
  return <Badge tone={tone}>{ATTENDANCE_MARK_LABEL[mark]}</Badge>;
}
