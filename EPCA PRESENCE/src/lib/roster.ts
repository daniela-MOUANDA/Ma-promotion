import type { Application, ApplicationStatus } from "@/types/domain";

export interface RosterFilters {
  q: string;
  categoryId: string;
  filiereId: string;
  status: string;
  from: string;
  to: string;
}

export const EMPTY_FILTERS: RosterFilters = {
  q: "",
  categoryId: "",
  filiereId: "",
  status: "",
  from: "",
  to: "",
};

export function filterApplications(
  items: Application[],
  filters: RosterFilters,
  extraStatuses?: ApplicationStatus[],
) {
  const q = filters.q.trim().toLowerCase();
  return items.filter((item) => {
    if (extraStatuses && !extraStatuses.includes(item.status)) return false;
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
    if (filters.filiereId && item.filiereId !== filters.filiereId) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.from && item.submittedAt.slice(0, 10) < filters.from) return false;
    if (filters.to && item.submittedAt.slice(0, 10) > filters.to) return false;
    if (!q) return true;
    const hay = `${item.number} ${item.lastName} ${item.firstNames} ${item.email} ${item.phone}`.toLowerCase();
    return hay.includes(q);
  });
}

export function fullName(item: Pick<Application, "lastName" | "firstNames">) {
  return `${item.lastName} ${item.firstNames}`;
}

export function initials(item: Pick<Application, "lastName" | "firstNames">) {
  return `${item.lastName.slice(0, 1)}${item.firstNames.slice(0, 1)}`.toUpperCase();
}
