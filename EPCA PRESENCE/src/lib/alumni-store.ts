import { academicYearForNumber } from "@/lib/academic-year";
import { apiPut } from "@/lib/api";
import { emitDataChanged } from "@/lib/data-events";
import { isRemoteEnabled, queueRemoteSave } from "@/lib/remote";
import { publicStudents as seedStudents } from "@/mocks/students";
import { promotions as seedPromotions } from "@/mocks/catalog";
import type { AlumniFeedback } from "@/types/domain";

const KEY = "epca.alumni.v5";

const baseFeedback: AlumniFeedback[] = [
  {
    id: "al-1",
    studentId: "st-7",
    fullName: "Ndong Marie-Claire",
    email: "mc.ndong@exemple.ga",
    promotionId: "promo-29",
    categoryId: "cat-a2",
    filiereId: "fil-impots",
    trainingYears: seedPromotions.find((item) => item.id === "promo-29")?.academicYear ?? "2020-2022",
    careerTitle: "Inspectrice des impôts",
    careerOrganization: "Direction générale des Impôts",
    careerPath:
      "Intégration à la DGI après la formation, puis spécialisation en contrôle fiscal des entreprises.",
    experience:
      "L’EPCA m’a donné une méthode de travail et une culture du service public que j’applique chaque jour. La rigueur des modules administratifs reste mon fil rouge.",
    status: "published",
    createdAt: "2025-11-12T10:00:00.000Z",
  },
  {
    id: "al-2",
    studentId: "st-4",
    fullName: "Bingou Stéphane",
    email: "s.bingou@exemple.ga",
    promotionId: "promo-30",
    categoryId: "cat-a2",
    filiereId: "fil-douanes",
    trainingYears: seedPromotions.find((item) => item.id === "promo-30")?.academicYear ?? "2022-2024",
    careerTitle: "Contrôleur des douanes",
    careerOrganization: "Direction générale des Douanes",
    careerPath: "Affectation au bureau de Libreville, puis formation continue en procédures douanières.",
    experience:
      "Les échanges avec les formateurs et la vie de promotion m’ont préparé au terrain. Je recommande aux futurs élèves de s’investir pleinement dans les stages.",
    status: "published",
    createdAt: "2026-01-08T14:20:00.000Z",
  },
];

const EXTRA_QUOTES = [
  "Les formateurs nous ont appris à travailler en équipe et à tenir des délais serrés. C’est exactement ce que l’on attend de moi aujourd’hui.",
  "La préparation m’a donné confiance. J’ai rejoint mon administration avec des bases solides et l’envie d’apprendre.",
  "Ce que je retiens de l’EPCA, c’est l’esprit de promotion : on avance ensemble, on se relève ensemble.",
  "Des cours exigeants, mais une équipe pédagogique toujours disponible. Je recommande cette formation sans hésiter.",
  "Les mises en situation m’ont préparé au quotidien du service public : rigueur, ponctualité, éthique.",
  "Une formation qui change une trajectoire. Merci aux formateurs et à toute l’administration de l’école.",
];

/** Témoignages supplémentaires, rattachés à de vrais profils diplômés du jeu de démonstration. */
function extraFeedback(): AlumniFeedback[] {
  const graduates = seedStudents.filter((student) => student.status === "DIPLOME" && !student.photoUrl);
  const step = Math.floor(graduates.length / EXTRA_QUOTES.length);
  return EXTRA_QUOTES.map((experience, index) => {
    const student = graduates[index * step + 2];
    const slug = student.fullName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z]+/g, ".");
    return {
      id: `al-x${index + 1}`,
      studentId: student.id,
      fullName: student.fullName,
      email: `${slug}@exemple.ga`,
      promotionId: student.promotionId,
      categoryId: student.categoryId,
      filiereId: student.filiereId,
      trainingYears:
        seedPromotions.find((item) => item.id === student.promotionId)?.academicYear ??
        academicYearForNumber(Number(student.promotionId.match(/\d+$/)?.[0])),
      careerTitle: student.careerTitle ?? "",
      careerOrganization: student.careerOrganization ?? "",
      careerPath: `Affectation à ${student.careerOrganization ?? "son administration"} à l’issue de la formation.`,
      experience,
      status: "published" as const,
      createdAt: `2026-0${2 + index}-1${index}T10:00:00.000Z`,
    };
  });
}

const seedFeedback: AlumniFeedback[] = [...baseFeedback, ...extraFeedback()];

let cache: AlumniFeedback[] | null = null;

function readAll(): AlumniFeedback[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AlumniFeedback[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hydrateAlumniStore(items: AlumniFeedback[]) {
  cache = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function persist(items: AlumniFeedback[], notify = true) {
  cache = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (isRemoteEnabled()) {
    queueRemoteSave("alumni", () => apiPut("/api/alumni", cache));
  } else {
    localStorage.setItem(KEY, JSON.stringify(cache));
  }
  if (notify) emitDataChanged();
}

export function getAlumniSnapshot(): AlumniFeedback[] {
  if (cache) return cache;
  if (typeof localStorage === "undefined") {
    cache = [...seedFeedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return cache;
  }
  const stored = readAll();
  if (stored.length === 0 && !localStorage.getItem(KEY)) {
    persist(seedFeedback, false);
    return cache!;
  }
  cache = [...stored].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return cache;
}

export function getPublishedAlumni() {
  return getAlumniSnapshot().filter((item) => item.status === "published");
}

export function getFeedbackForStudent(studentId: string) {
  return getAlumniSnapshot().filter((item) => item.studentId === studentId);
}

export function getPublishedFeedbackForStudent(studentId: string) {
  return getFeedbackForStudent(studentId).filter((item) => item.status === "published");
}

export function submitAlumniFeedback(
  input: Omit<AlumniFeedback, "id" | "status" | "createdAt">,
): AlumniFeedback {
  const existingPending = getAlumniSnapshot().find(
    (item) => item.studentId === input.studentId && item.status === "pending",
  );
  if (existingPending) {
    const updated: AlumniFeedback = {
      ...existingPending,
      ...input,
      id: existingPending.id,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    persist(getAlumniSnapshot().map((item) => (item.id === existingPending.id ? updated : item)));
    return updated;
  }

  const item: AlumniFeedback = {
    ...input,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  persist([item, ...getAlumniSnapshot()]);
  return item;
}

export function patchAlumniFeedback(id: string, patch: Partial<AlumniFeedback>) {
  persist(getAlumniSnapshot().map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item)));
}

export function deleteAlumniFeedback(id: string) {
  persist(getAlumniSnapshot().filter((item) => item.id !== id));
}
