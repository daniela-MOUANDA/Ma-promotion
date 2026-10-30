import { emitDataChanged } from "@/lib/data-events";
import { competitions as seedCompetitions } from "@/mocks/catalog";
import type { Competition } from "@/types/domain";

const KEY = "epca.competitions.v1";

let cache: Competition[] | null = null;

function readAll(): Competition[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Competition[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sorted(items: Competition[]) {
  const rank = (status: Competition["status"]) => (status === "open" ? 0 : status === "upcoming" ? 1 : 2);
  return [...items].sort((a, b) => rank(a.status) - rank(b.status) || b.year - a.year);
}

function persist(items: Competition[]) {
  cache = sorted(items);
  localStorage.setItem(KEY, JSON.stringify(cache));
  emitDataChanged();
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getCompetitionsSnapshot(): Competition[] {
  if (cache) return cache;
  if (typeof localStorage === "undefined") return sorted(seedCompetitions);
  const stored = readAll();
  if (stored.length === 0 && !localStorage.getItem(KEY)) {
    persist(seedCompetitions);
    return cache!;
  }
  cache = sorted(stored);
  return cache;
}

export type CompetitionInput = Omit<Competition, "id" | "slug"> & { slug?: string };

export function createCompetition(input: CompetitionInput): Competition {
  const base = input.slug?.trim() || `${slugify(input.name)}-${input.year}`;
  const existing = getCompetitionsSnapshot();
  let slug = base;
  let suffix = 2;
  while (existing.some((item) => item.slug === slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  const item: Competition = { ...input, slug, id: crypto.randomUUID() };
  persist([item, ...existing]);
  return item;
}

export function patchCompetition(id: string, patch: Partial<Competition>) {
  persist(
    getCompetitionsSnapshot().map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item)),
  );
}

export function deleteCompetition(id: string) {
  persist(getCompetitionsSnapshot().filter((item) => item.id !== id));
}

export function resetCompetitions() {
  persist(seedCompetitions);
}
