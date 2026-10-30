import type { Publication } from "@/types/domain";
import { emitDataChanged } from "@/lib/data-events";

const KEY = "epca.publications.v1";
let cache: Publication[] | null = null;

function readAll(): Publication[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Publication[]) : [];
  } catch {
    return [];
  }
}

function sorted(items: Publication[]) {
  return [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function persist(items: Publication[]) {
  cache = sorted(items);
  localStorage.setItem(KEY, JSON.stringify(cache));
  emitDataChanged();
}

export function getPublicationsSnapshot(): Publication[] {
  if (!cache) cache = sorted(readAll());
  return cache;
}

export function listPublications(type?: Publication["type"]) {
  const all = getPublicationsSnapshot();
  return type ? all.filter((item) => item.type === type) : all;
}

export function getPublication(id: string) {
  return getPublicationsSnapshot().find((item) => item.id === id);
}

export function createPublication(input: Omit<Publication, "id" | "createdAt">): Publication {
  const item: Publication = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  persist([item, ...readAll()]);
  return item;
}

export function patchPublication(id: string, patch: Partial<Publication>) {
  persist(readAll().map((item) => (item.id === id ? { ...item, ...patch } : item)));
}

export function deletePublication(id: string) {
  persist(readAll().filter((item) => item.id !== id));
}
