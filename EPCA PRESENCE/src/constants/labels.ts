import type { ApplicationStatus } from "@/types/domain";

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  BROUILLON: "Brouillon",
  SOUMISE: "Soumise",
  DOSSIER_PHYSIQUE_ATTENDU: "Dossier physique attendu",
  DOSSIER_PHYSIQUE_DEPOSE: "Dossier physique déposé",
  DOSSIER_PHYSIQUE_VALIDE: "Dossier physique validé",
  DOSSIER_PHYSIQUE_REJETE: "Dossier physique rejeté",
  AUTORISE_CONCOURS: "Autorisé(e) au concours",
  NON_AUTORISE: "Non autorisé(e)",
  ADMIS: "Admis(e)",
  NON_ADMIS: "Non admis(e)",
  ANNULEE: "Annulée",
};

export const COMPETITION_STATUS_LABEL = {
  open: "Ouvert",
  upcoming: "À venir",
  closed: "Clos",
} as const;

export const ATTENDANCE_MARK_LABEL = {
  present: "Présent",
  absent: "Absent",
} as const;
