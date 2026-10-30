/** 31e promotion = 2024-2026. Les promotions EPCA suivent un cycle de deux ans. */
const REFERENCE = { number: 31, start: 2024 };

export function academicYearForNumber(number: number) {
  if (!Number.isFinite(number) || number < 1) return "";
  const start = REFERENCE.start - (REFERENCE.number - number) * 2;
  return `${start}-${start + 2}`;
}

export function promotionLabelForNumber(number: number) {
  if (!Number.isFinite(number) || number < 1) return "";
  return `${number}e promotion`;
}

export function looksLikeAcademicYear(value: string | undefined) {
  return Boolean(value && /^\d{4}\s*[-–/]\s*\d{4}$/.test(value.trim()));
}

export function normalizeAcademicYear(value: string) {
  const match = value.trim().match(/(\d{4})\s*[-–/]\s*(\d{4})/);
  if (!match) return value.trim();
  return `${match[1]}-${match[2]}`;
}

/** Libellé + année, même si la promo a été retirée du référentiel. */
export function promotionDisplay(id: string | null | undefined, promotions: { id: string; label: string; academicYear: string }[]) {
  if (!id) return "—";
  const live = promotions.find((item) => item.id === id);
  if (live) return `${live.label} · ${live.academicYear}`;
  const number = Number(id.match(/(\d+)$/)?.[1]);
  if (!number) return "—";
  return `${promotionLabelForNumber(number)} · ${academicYearForNumber(number)}`;
}

export function resolveAcademicYear(promo: {
  number: number;
  academicYear?: string;
  yearLabel?: string;
}) {
  if (looksLikeAcademicYear(promo.academicYear)) return normalizeAcademicYear(promo.academicYear!);
  if (looksLikeAcademicYear(promo.yearLabel)) return normalizeAcademicYear(promo.yearLabel!);
  return academicYearForNumber(promo.number);
}
