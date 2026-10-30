import type { Promotion, PublicStudent, StudentPublicStatus } from "@/types/domain";

export type CohortStatus = Extract<StudentPublicStatus, "EN_FORMATION" | "DIPLOME">;

export function isExitStatus(status: StudentPublicStatus) {
  return status === "ABANDON" || status === "EXCLU";
}

/** Une promotion est entièrement en formation, ou entièrement diplômée. */
export function cohortOf(promo: Pick<Promotion, "status">): CohortStatus {
  return promo.status === "terminee" ? "DIPLOME" : "EN_FORMATION";
}

export function alignStudentStatus(
  status: StudentPublicStatus,
  promo?: Pick<Promotion, "status">,
): StudentPublicStatus {
  if (isExitStatus(status)) return status;
  if (!promo) return status;
  return cohortOf(promo);
}

export function alignStudent(student: PublicStudent, promo?: Pick<Promotion, "status">): PublicStudent {
  const status = alignStudentStatus(student.status, promo);
  return status === student.status ? student : { ...student, status };
}

export const STATUS_OPTIONS: { value: StudentPublicStatus; label: string }[] = [
  { value: "EN_FORMATION", label: "En formation" },
  { value: "DIPLOME", label: "Diplômé" },
  { value: "ABANDON", label: "Abandon" },
  { value: "EXCLU", label: "Exclu" },
];

export function studentStatusChoices(promo?: Pick<Promotion, "status">) {
  const cohort = promo ? cohortOf(promo) : "EN_FORMATION";
  return [
    { value: cohort, label: cohort === "DIPLOME" ? "Diplômé" : "En formation" },
    { value: "ABANDON" as const, label: "Abandon" },
    { value: "EXCLU" as const, label: "Exclu" },
  ];
}

export function cohortSwitchCopy(next: Promotion["status"]) {
  if (next === "terminee") {
    return {
      title: "Marquer la promotion diplômée ?",
      message:
        "Tous les élèves encore en formation seront diplômés. Les abandons et les exclus ne changent pas.",
      confirmLabel: "Marquer diplômée",
    };
  }
  return {
    title: "Remettre la promotion en formation ?",
    message:
      "Tous les diplômés redeviennent en formation. Les abandons et les exclus ne changent pas.",
    confirmLabel: "Remettre en formation",
  };
}
