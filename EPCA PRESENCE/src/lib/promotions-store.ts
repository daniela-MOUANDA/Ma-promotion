import { resolveAcademicYear } from "@/lib/academic-year";
import { apiPut } from "@/lib/api";
import { alignStudent, alignStudentStatus, cohortOf, isExitStatus } from "@/lib/cohort";
import { emitDataChanged } from "@/lib/data-events";
import { isRemoteEnabled, queueRemoteSave } from "@/lib/remote";
import {
  categories as seedCategories,
  filieres as seedFilieres,
  promotions as seedPromotions,
  publicStudents as seedStudents,
  regies as seedRegies,
} from "@/mocks/catalog";
import type { Category, Filiere, Promotion, PublicStudent, Regie } from "@/types/domain";

// v2 : promotions renumérotées (29e–31e) et champ interne/externe. L’ancienne version est ignorée.
const KEY = "epca.promotions.v3";

type Snapshot = {
  categories: Category[];
  regies: Regie[];
  filieres: Filiere[];
  promotions: Promotion[];
  students: PublicStudent[];
};

let cache: Snapshot | null = null;

function seed(): Snapshot {
  return {
    categories: structuredClone(seedCategories),
    regies: structuredClone(seedRegies),
    filieres: structuredClone(seedFilieres),
    promotions: structuredClone(seedPromotions),
    students: structuredClone(seedStudents),
  };
}

const seedPhotos = new Map(seedStudents.map((student) => [student.id, student.photoUrl]));
const seedContacts = new Map(
  seedStudents.map((student) => [student.id, { email: student.email, phone: student.phone }]),
);

function normalize(snapshot: Snapshot): Snapshot {
  const byPromo = new Map(snapshot.promotions.map((item) => [item.id, item]));
  // Les profils déjà enregistrés avant l’ajout des photos récupèrent celle de la démo.
  // photoUrl === "" signifie « photo retirée volontairement » : on n’y touche pas.
  const students = snapshot.students.map((student) => {
    const fallback = seedPhotos.get(student.id);
    const withPhoto =
      student.photoUrl === undefined && fallback ? { ...student, photoUrl: fallback } : student;
    const seedContact = seedContacts.get(withPhoto.id);
    const withContact = {
      ...withPhoto,
      email: withPhoto.email ?? seedContact?.email,
      phone: withPhoto.phone ?? seedContact?.phone,
    };
    return alignStudent(withContact, byPromo.get(withContact.promotionId));
  });
  const promotions = [...snapshot.promotions]
    .map((promo) => {
      const { yearLabel: _legacyYear, ...rest } = promo as Promotion & { yearLabel?: string };
      return {
        ...rest,
        academicYear: resolveAcademicYear(promo),
        studentCount: students.filter((s) => s.promotionId === promo.id && s.published !== false).length,
      };
    })
    .sort((a, b) => b.number - a.number);
  const categories = [...snapshot.categories]
    .map((item) => ({
      ...item,
      name: /^cat[eé]gorie\s+/i.test(item.name) ? item.code : item.name,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    ...snapshot,
    categories,
    promotions,
    students,
    filieres: snapshot.filieres,
    regies: snapshot.regies,
  };
}

function readAll(): Snapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot;
    if (!parsed?.promotions || !parsed?.students) return null;
    return {
      categories: parsed.categories?.length ? parsed.categories : seed().categories,
      regies: parsed.regies?.length ? parsed.regies : seed().regies,
      filieres: parsed.filieres?.length ? parsed.filieres : seed().filieres,
      promotions: parsed.promotions,
      students: parsed.students,
    };
  } catch {
    return null;
  }
}

let lastWriteSaved = true;

/** false si le navigateur a refusé la dernière sauvegarde (espace de stockage plein). */
export function wasLastWriteSaved() {
  return lastWriteSaved;
}

export function hydratePromotionsStore(snapshot: Snapshot) {
  cache = normalize(snapshot);
}

function persist(snapshot: Snapshot, notify = true) {
  cache = normalize(snapshot);
  if (isRemoteEnabled()) {
    lastWriteSaved = true;
    queueRemoteSave("catalog", () => apiPut("/api/catalog", cache));
  } else {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
      lastWriteSaved = true;
    } catch {
      lastWriteSaved = false;
    }
  }
  if (notify) emitDataChanged();
}

export function getPromotionsSnapshot(): Snapshot {
  if (cache) return cache;
  if (typeof localStorage === "undefined") {
    cache = normalize(seed());
    return cache;
  }
  const stored = readAll();
  if (!stored) {
    persist(seed(), false);
    return cache!;
  }
  const next = normalize(stored);
  const mixed = stored.students.some((student) => {
    const aligned = next.students.find((item) => item.id === student.id);
    return Boolean(aligned && aligned.status !== student.status);
  });
  const yearsStale = stored.promotions.some((promo) => {
    const aligned = next.promotions.find((item) => item.id === promo.id);
    return Boolean(aligned && aligned.academicYear !== promo.academicYear);
  });
  const categoriesStale = stored.categories.some((item) => {
    const aligned = next.categories.find((entry) => entry.id === item.id);
    return Boolean(aligned && aligned.name !== item.name);
  });
  const contactsStale = stored.students.some((student) => {
    const aligned = next.students.find((item) => item.id === student.id);
    return Boolean(aligned && (aligned.email !== student.email || aligned.phone !== student.phone));
  });
  if (mixed || yearsStale || categoriesStale || contactsStale) persist(next, false);
  else cache = next;
  return cache!;
}

function mutate(fn: (current: Snapshot) => Snapshot) {
  persist(fn(structuredClone(getPromotionsSnapshot())));
}

export function getCategoriesLive() {
  return getPromotionsSnapshot().categories;
}

export function getRegiesLive() {
  return getPromotionsSnapshot().regies;
}

export function getFilieresLive() {
  return getPromotionsSnapshot().filieres;
}

export function getPromotionsLive() {
  return getPromotionsSnapshot().promotions;
}

export function getStudentsLive() {
  return getPromotionsSnapshot().students;
}

export function createPromotion(input: Omit<Promotion, "id" | "studentCount">) {
  const item: Promotion = { ...input, id: crypto.randomUUID(), studentCount: 0 };
  mutate((current) => ({ ...current, promotions: [item, ...current.promotions] }));
  return item;
}

function applyCohort(current: Snapshot, id: string, status: Promotion["status"]): Snapshot {
  const promo = current.promotions.find((item) => item.id === id);
  if (!promo) return current;
  const expected = cohortOf({ status });
  return {
    ...current,
    promotions: current.promotions.map((item) => (item.id === id ? { ...item, status } : item)),
    students: current.students.map((item) => {
      if (item.promotionId !== id || isExitStatus(item.status)) return item;
      return { ...item, status: expected };
    }),
  };
}

/** Passe toute la promotion en formation ou diplômée. Abandons et exclus inchangés. */
export function setPromotionCohort(id: string, status: Promotion["status"]) {
  mutate((current) => applyCohort(current, id, status));
}

export function patchPromotion(id: string, patch: Partial<Promotion>) {
  mutate((current) => {
    const previous = current.promotions.find((item) => item.id === id);
    const next =
      patch.status && previous && patch.status !== previous.status
        ? applyCohort(current, id, patch.status)
        : current;
    return {
      ...next,
      promotions: next.promotions.map((item) =>
        item.id === id ? { ...item, ...patch, id: item.id } : item,
      ),
    };
  });
}

export function deletePromotion(id: string) {
  mutate((current) => ({
    ...current,
    promotions: current.promotions.filter((item) => item.id !== id),
    students: current.students.filter((item) => item.promotionId !== id),
  }));
}

export function createFiliere(input: Omit<Filiere, "id">) {
  const item: Filiere = { ...input, id: crypto.randomUUID() };
  mutate((current) => ({ ...current, filieres: [item, ...current.filieres] }));
  return item;
}

export function patchFiliere(id: string, patch: Partial<Filiere>) {
  mutate((current) => ({
    ...current,
    filieres: current.filieres.map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item)),
  }));
}

export function deleteFiliere(id: string) {
  mutate((current) => ({
    ...current,
    filieres: current.filieres.filter((item) => item.id !== id),
  }));
}

export function createRegie(input: Omit<Regie, "id">) {
  const item: Regie = { ...input, id: crypto.randomUUID() };
  mutate((current) => ({ ...current, regies: [...current.regies, item] }));
  return item;
}

export function patchRegie(id: string, patch: Partial<Regie>) {
  mutate((current) => ({
    ...current,
    regies: current.regies.map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item)),
  }));
}

export function deleteRegie(id: string) {
  mutate((current) => ({
    ...current,
    regies: current.regies.filter((item) => item.id !== id),
  }));
}

export function createCategory(input: Omit<Category, "id">) {
  const item: Category = { ...input, id: crypto.randomUUID() };
  mutate((current) => ({ ...current, categories: [...current.categories, item] }));
  return item;
}

export function patchCategory(id: string, patch: Partial<Category>) {
  mutate((current) => ({
    ...current,
    categories: current.categories.map((item) =>
      item.id === id ? { ...item, ...patch, id: item.id } : item,
    ),
  }));
}

export function deleteCategory(id: string) {
  mutate((current) => ({
    ...current,
    categories: current.categories.filter((item) => item.id !== id),
    filieres: current.filieres.map((item) => ({
      ...item,
      categoryIds: item.categoryIds.filter((categoryId) => categoryId !== id),
    })),
  }));
}

export function createStudent(input: Omit<PublicStudent, "id">) {
  let created: PublicStudent | undefined;
  mutate((current) => {
    const promo = current.promotions.find((item) => item.id === input.promotionId);
    created = {
      published: true,
      ...input,
      id: crypto.randomUUID(),
      status: alignStudentStatus(input.status, promo),
    };
    return { ...current, students: [created, ...current.students] };
  });
  return created!;
}

export function patchStudent(id: string, patch: Partial<PublicStudent>) {
  mutate((current) => ({
    ...current,
    students: current.students.map((item) => {
      if (item.id !== id) return item;
      const merged = { ...item, ...patch, id: item.id };
      const promo = current.promotions.find((entry) => entry.id === merged.promotionId);
      return alignStudent(merged, promo);
    }),
  }));
}

/** Ajout en masse (import Excel) : une seule écriture, une seule notification. */
export function createStudents(inputs: Omit<PublicStudent, "id">[]) {
  let count = 0;
  mutate((current) => {
    const items: PublicStudent[] = inputs.map((input) => {
      const promo = current.promotions.find((item) => item.id === input.promotionId);
      return {
        published: true,
        ...input,
        id: crypto.randomUUID(),
        status: alignStudentStatus(input.status, promo),
      };
    });
    count = items.length;
    return { ...current, students: [...items, ...current.students] };
  });
  return count;
}

/** Proposition de photo faite par l’élève depuis son profil — en attente de validation admin. */
export function submitStudentPhoto(id: string, dataUrl: string) {
  mutate((current) => ({
    ...current,
    students: current.students.map((item) => {
      if (item.id !== id) return item;
      if (item.photoUrl) return item;
      return { ...item, photoPending: dataUrl, photoSubmittedAt: new Date().toISOString() };
    }),
  }));
}

export function approveStudentPhoto(id: string) {
  mutate((current) => ({
    ...current,
    students: current.students.map((item) =>
      item.id === id && item.photoPending
        ? { ...item, photoUrl: item.photoPending, photoPending: undefined, photoSubmittedAt: undefined }
        : item,
    ),
  }));
}

export function rejectStudentPhoto(id: string) {
  patchStudent(id, { photoPending: undefined, photoSubmittedAt: undefined });
}

export function submitStudentContact(id: string, contact: { email: string; phone: string }) {
  mutate((current) => ({
    ...current,
    students: current.students.map((item) => {
      if (item.id !== id) return item;
      if (item.email || item.phone) return item;
      return { ...item, contactPending: contact, contactSubmittedAt: new Date().toISOString() };
    }),
  }));
}

export function approveStudentContact(id: string) {
  mutate((current) => ({
    ...current,
    students: current.students.map((item) =>
      item.id === id && item.contactPending
        ? {
            ...item,
            email: item.contactPending.email || item.email,
            phone: item.contactPending.phone || item.phone,
            contactPending: undefined,
            contactSubmittedAt: undefined,
          }
        : item,
    ),
  }));
}

export function rejectStudentContact(id: string) {
  patchStudent(id, { contactPending: undefined, contactSubmittedAt: undefined });
}

export function deleteStudent(id: string) {
  mutate((current) => ({
    ...current,
    students: current.students.filter((item) => item.id !== id),
  }));
}

export function resetPromotionsStore() {
  persist(seed());
}
