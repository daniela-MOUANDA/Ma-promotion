import { apiPut } from "@/lib/api";
import { emitDataChanged } from "@/lib/data-events";
import { isRemoteEnabled, queueRemoteSave } from "@/lib/remote";
import type { GalleryPhoto } from "@/types/domain";

const KEY = "epca.gallery.v3";
const LEGACY_KEYS = ["epca.gallery.v2", "epca.gallery.v1"];

function photo(
  n: number,
  title: string,
  caption: string,
  event: string,
  eventDate: string,
): GalleryPhoto {
  const id = String(n).padStart(2, "0");
  return {
    id: `ph-${id}`,
    title,
    caption,
    event,
    eventDate,
    src: `/gallery/evt-${id}.jpg`,
    published: true,
    createdAt: `${eventDate}T09:${id}:00.000Z`,
  };
}

/** Photos réelles de l’école. Les admins peuvent les retirer, les modifier et en publier d’autres. */
const seed: GalleryPhoto[] = [
  photo(10, "Savoir · Rigueur · Intégrité", "Allocution devant la bannière de l’EPCA.", "Cérémonie", "2026-09-26"),
  photo(9, "Une délégation, un souvenir", "Photo de groupe aux couleurs de l’école.", "Visite institutionnelle", "2026-09-18"),
  photo(6, "Remise de dossier", "Un moment d’échange officiel, sous les couleurs du Gabon.", "Visite institutionnelle", "2026-09-18"),
  photo(7, "Séance de travail", "Autour de la table, la délégation de l’EPCA échange avec ses hôtes.", "Visite institutionnelle", "2026-09-18"),
  photo(8, "Écoute et réflexion", "Chaque mot compte pendant l’audience.", "Visite institutionnelle", "2026-09-18"),
  photo(11, "Salle comble", "Une salle de cours pleine, des élèves studieux.", "Vie de l’école", "2026-06-12"),
  photo(1, "Un regard attentif", "Concentration et élégance dans l’auditoire.", "Conférence", "2026-06-05"),
  photo(2, "Sourires dans l’auditoire", "Les bons moments se partagent aussi entre deux interventions.", "Conférence", "2026-06-05"),
  photo(3, "La parole est à vous", "Les questions fusent, les échanges sont riches.", "Conférence", "2026-06-05"),
  photo(5, "La question qui compte", "Quand l’assemblée prend la parole.", "Conférence", "2026-06-05"),
  photo(4, "Un échange sincère", "Une intervention marquante devant l’assemblée.", "Conférence", "2026-06-05"),
  photo(16, "Photo de famille", "Toute l’assemblée réunie devant le bâtiment.", "Photo de groupe", "2026-05-22"),
  photo(17, "L’ouverture", "Prise de parole devant l’assemblée, sous les bannières de l’EPCA.", "Cérémonie", "2026-05-22"),
  photo(15, "Face aux médias", "Une interview devant les bannières de l’école.", "Cérémonie", "2026-05-22"),
  photo(14, "Séance de travail", "Carnets ouverts et regards concentrés.", "Séminaire", "2026-04-16"),
  photo(18, "Attention soutenue", "Chacune et chacun suit les échanges avec sérieux.", "Séminaire", "2026-04-16"),
  photo(19, "Chacun prend ses notes", "Les idées s’écrivent au fil des interventions.", "Séminaire", "2026-04-16"),
  photo(20, "Une salle pleine", "Des carnets ouverts du premier au dernier rang.", "Vie de l’école", "2026-03-10"),
  photo(12, "Cours en salle", "Les élèves suivent attentivement les enseignements.", "Vie de l’école", "2026-03-10"),
  photo(13, "Visite en salle de classe", "Une rencontre au cœur de la formation.", "Vie de l’école", "2026-03-10"),
];
let cache: GalleryPhoto[] | null = null;

function sorted(items: GalleryPhoto[]) {
  return [...items].sort((a, b) => b.eventDate.localeCompare(a.eventDate) || b.createdAt.localeCompare(a.createdAt));
}

function readAll(): GalleryPhoto[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GalleryPhoto[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function legacyUploads(): GalleryPhoto[] {
  const kept = new Map<string, GalleryPhoto>();
  for (const key of LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as GalleryPhoto[]) : [];
      if (!Array.isArray(parsed)) continue;
      for (const item of parsed) {
        if (item.src?.startsWith("data:")) kept.set(item.id, item);
      }
    } catch {
      // ancienne version illisible : on l’ignore
    }
  }
  return [...kept.values()];
}

export function hydrateGalleryStore(items: GalleryPhoto[]) {
  cache = sorted(items);
}

/** Retourne false si le navigateur refuse d’enregistrer (espace plein). */
function persist(items: GalleryPhoto[], notify = true): boolean {
  const next = sorted(items);
  if (isRemoteEnabled()) {
    cache = next;
    queueRemoteSave("gallery", () => apiPut("/api/gallery", cache));
    if (notify) emitDataChanged();
    return true;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  cache = next;
  if (notify) emitDataChanged();
  return true;
}

export function getGallerySnapshot(): GalleryPhoto[] {
  if (cache) return cache;
  if (typeof localStorage === "undefined") {
    cache = sorted(seed);
    return cache;
  }
  const stored = readAll();
  if (!stored) {
    // Première ouverture de cette version : on garde les photos ajoutées par les admins
    // dans l’ancienne galerie (les photos de démonstration générées sont abandonnées).
    const initial = [...legacyUploads(), ...seed];
    persist(initial, false);
    cache = cache ?? sorted(initial);
    return cache;
  }
  cache = sorted(stored);
  return cache;
}

export function getPublishedPhotos() {
  return getGallerySnapshot().filter((item) => item.published);
}

export function getGalleryEvents(photos: GalleryPhoto[] = getPublishedPhotos()) {
  return [...new Set(photos.map((item) => item.event).filter(Boolean))];
}

export function addGalleryPhoto(
  input: Omit<GalleryPhoto, "id" | "createdAt" | "published"> & { published?: boolean },
): boolean {
  const item: GalleryPhoto = {
    ...input,
    published: input.published ?? true,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  return persist([item, ...getGallerySnapshot()]);
}

export function patchGalleryPhoto(id: string, patch: Partial<GalleryPhoto>) {
  return persist(getGallerySnapshot().map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item)));
}

export function deleteGalleryPhoto(id: string) {
  persist(getGallerySnapshot().filter((item) => item.id !== id));
}
