import { api } from "@/lib/api";
import { hydrateAlumniStore } from "@/lib/alumni-store";
import { hydrateFaqs } from "@/lib/catalog";
import { hydrateGalleryStore } from "@/lib/gallery-store";
import { hydratePromotionsStore } from "@/lib/promotions-store";
import { preferMocks, setRemoteState } from "@/lib/remote";
import type { AlumniFeedback, Category, FaqItem, Filiere, GalleryPhoto, Promotion, PublicStudent, Regie } from "@/types/domain";

type BootstrapPayload = {
  categories: Category[];
  regies: Regie[];
  filieres: Filiere[];
  promotions: Promotion[];
  students: PublicStudent[];
  alumni: AlumniFeedback[];
  gallery: GalleryPhoto[];
  faqs: FaqItem[];
};

export async function bootstrapData() {
  if (preferMocks()) {
    setRemoteState(false);
    return;
  }
  try {
    const health = await api<{ ok: boolean; error?: string }>("/api/health");
    if (!health.ok) {
      setRemoteState(false, health.error ?? "API indisponible");
      return;
    }
    const data = await api<BootstrapPayload>("/api/bootstrap");
    hydratePromotionsStore({
      categories: data.categories,
      regies: data.regies,
      filieres: data.filieres,
      promotions: data.promotions,
      students: data.students,
    });
    hydrateAlumniStore(data.alumni);
    hydrateGalleryStore(data.gallery);
    hydrateFaqs(data.faqs);
    setRemoteState(true);
  } catch (error) {
    const message = error instanceof Error ? error.message : "API MySQL injoignable";
    setRemoteState(false, message);
    console.warn("[api]", message, "— données locales conservées.");
  }
}
