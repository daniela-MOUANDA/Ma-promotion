import { getCompetitionsSnapshot } from "@/lib/competitions-store";
import {
  getCategoriesLive,
  getFilieresLive,
  getPromotionsLive,
  getPromotionsSnapshot,
  getRegiesLive,
  getStudentsLive,
} from "@/lib/promotions-store";
import { faqItems } from "@/mocks/catalog";
import type { Competition, FaqItem } from "@/types/domain";

let liveFaqs: FaqItem[] = faqItems;

export function hydrateFaqs(items: FaqItem[]) {
  if (items.length) liveFaqs = items;
}

export function getCompetitions() {
  return getCompetitionsSnapshot();
}

export function getCompetition(idOrSlug: string): Competition | undefined {
  return getCompetitionsSnapshot().find((item) => item.id === idOrSlug || item.slug === idOrSlug);
}

export function getOpenCompetition() {
  const all = getCompetitionsSnapshot();
  return all.find((item) => item.status === "open") ?? all[0];
}

export function getCategories() {
  return getCategoriesLive().filter((item) => item.active);
}

export function getCategory(id: string) {
  return getPromotionsSnapshot().categories.find((item) => item.id === id);
}

export function getFilieres() {
  return getFilieresLive();
}

export function getFiliere(id: string) {
  return getFilieresLive().find((item) => item.id === id);
}

export function getFilieresForCategory(categoryId: string, competition?: Competition) {
  return getFilieresLive().filter((filiere) => {
    const inCategory = filiere.categoryIds.includes(categoryId);
    const inCompetition = competition ? competition.filiereIds.includes(filiere.id) : true;
    return inCategory && inCompetition;
  });
}

export function getRegies() {
  return getRegiesLive();
}

export function getRegie(id: string) {
  return getRegiesLive().find((item) => item.id === id);
}

export function getPromotions() {
  return getPromotionsLive();
}

export function getPromotion(idOrNumber: string) {
  return getPromotionsLive().find(
    (item) => item.id === idOrNumber || String(item.number) === idOrNumber,
  );
}

export function getFaqs() {
  return liveFaqs;
}

export function getPublicStudents(filters: {
  promotionId?: string;
  categoryId?: string;
  filiereId?: string;
  includeUnpublished?: boolean;
}) {
  return getStudentsLive().filter((student) => {
    if (!filters.includeUnpublished && student.published === false) return false;
    if (filters.promotionId && student.promotionId !== filters.promotionId) return false;
    if (filters.categoryId && student.categoryId !== filters.categoryId) return false;
    if (filters.filiereId && student.filiereId !== filters.filiereId) return false;
    return true;
  });
}

export function getPublicStudent(id: string) {
  return getStudentsLive().find((item) => item.id === id);
}

export function studentProfilePath(student: {
  id: string;
  promotionId: string;
  categoryId: string;
  filiereId: string;
}) {
  const promotion = getPromotion(student.promotionId);
  const category = getCategory(student.categoryId);
  const filiere = getFiliere(student.filiereId);
  const promoKey = promotion ? String(promotion.number) : student.promotionId;
  const catKey = category?.code ?? student.categoryId;
  const filKey = filiere?.code ?? student.filiereId;
  return `/promotions/${promoKey}/${catKey}/${filKey}/${student.id}`;
}
