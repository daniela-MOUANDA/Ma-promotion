import { useMemo, useSyncExternalStore } from "react";
import { getAlumniSnapshot } from "@/lib/alumni-store";
import { getApplicationsSnapshot } from "@/lib/applications-store";
import { getCompetitionsSnapshot } from "@/lib/competitions-store";
import { getGallerySnapshot } from "@/lib/gallery-store";
import { subscribeData } from "@/lib/data-events";
import { getPromotionsSnapshot } from "@/lib/promotions-store";
import { getPublicationsSnapshot } from "@/lib/publications-store";
import { getSchoolSnapshot } from "@/lib/school-store";

export function useApplications() {
  return useSyncExternalStore(subscribeData, getApplicationsSnapshot, getApplicationsSnapshot);
}

export function usePublications() {
  return useSyncExternalStore(subscribeData, getPublicationsSnapshot, getPublicationsSnapshot);
}

export function useSchool() {
  return useSyncExternalStore(subscribeData, getSchoolSnapshot, getSchoolSnapshot);
}

export function useCompetitions() {
  return useSyncExternalStore(subscribeData, getCompetitionsSnapshot, getCompetitionsSnapshot);
}

export function usePromotionsCatalog() {
  return useSyncExternalStore(subscribeData, getPromotionsSnapshot, getPromotionsSnapshot);
}

export function usePromotions() {
  const catalog = usePromotionsCatalog();
  return catalog.promotions;
}

export function usePromotionStudents() {
  const catalog = usePromotionsCatalog();
  return catalog.students;
}

export function usePromotionCategories() {
  const catalog = usePromotionsCatalog();
  return catalog.categories;
}

export function usePromotionFilieres() {
  const catalog = usePromotionsCatalog();
  return catalog.filieres;
}

export function useGallery() {
  return useSyncExternalStore(subscribeData, getGallerySnapshot, getGallerySnapshot);
}

export function useAlumni() {
  return useSyncExternalStore(subscribeData, getAlumniSnapshot, getAlumniSnapshot);
}

export function usePublishedAlumni() {
  const alumni = useAlumni();
  return useMemo(() => alumni.filter((item) => item.status === "published"), [alumni]);
}
