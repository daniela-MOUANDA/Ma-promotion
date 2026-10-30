import type { Application, ApplicationStatus } from "@/types/domain";
import { getCompetitionsSnapshot } from "@/lib/competitions-store";
import { emitDataChanged } from "@/lib/data-events";

const STORAGE_KEY = "epca.applications.v1";
const COUNTER_KEY = "epca.application-counter.v1";
const SEED_KEY = "epca.demo-seeded.v5";

let cache: Application[] | null = null;

function readAll(): Application[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Application[]) : [];
  } catch {
    return [];
  }
}

function sorted(items: Application[]) {
  return [...items].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

function persist(items: Application[], emit = true) {
  cache = sorted(items);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  if (emit) emitDataChanged();
}

/** Le millésime du numéro suit la session visée, pas l'année courante. */
function competitionYear(competitionId: string) {
  const session = getCompetitionsSnapshot().find((item) => item.id === competitionId);
  if (session) return session.year;
  const fromId = Number(competitionId.match(/(20\d{2})/)?.[1]);
  return Number.isFinite(fromId) && fromId ? fromId : new Date().getFullYear();
}

function nextNumber(year: number) {
  const key = `${COUNTER_KEY}.${year}`;
  const stored = Number(localStorage.getItem(key) ?? "0");
  // Le compteur est par session : on repart du plus haut numéro déjà attribué cette année-là.
  const prefix = `EPCA-${year}-CAND-`;
  const used = readAll().reduce((max, item) => {
    if (!item.number.startsWith(prefix)) return max;
    const sequence = Number(item.number.slice(prefix.length));
    return Number.isFinite(sequence) && sequence > max ? sequence : max;
  }, 0);
  const current = Math.max(stored, used) + 1;
  localStorage.setItem(key, String(current));
  return `${prefix}${String(current).padStart(6, "0")}`;
}

export function ensureDemoSeed() {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) {
    cache = sorted(readAll());
    return;
  }
  const kept = readAll().filter((item) => !item.demo);
  persist([...kept, ...buildDemoApplications()], false);
  localStorage.setItem(SEED_KEY, "1");
}

export function getApplicationsSnapshot(): Application[] {
  if (!cache) {
    ensureDemoSeed();
    cache = sorted(readAll());
  }
  return cache;
}

export function listApplications(): Application[] {
  return getApplicationsSnapshot();
}

export function getApplicationByNumber(number: string): Application | undefined {
  const needle = number.trim().toUpperCase();
  return getApplicationsSnapshot().find((item) => item.number.toUpperCase() === needle);
}

export function getApplicationById(id: string): Application | undefined {
  return getApplicationsSnapshot().find((item) => item.id === id);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Récupération du numéro perdu : identité + date de naissance exacte. */
export function findApplicationsByIdentity(input: {
  lastName: string;
  firstNames: string;
  birthDate: string;
}): Application[] {
  const lastName = normalizeText(input.lastName);
  const firstNames = normalizeText(input.firstNames);
  const birthDate = input.birthDate.trim();
  if (!lastName || !firstNames || !birthDate) return [];

  return getApplicationsSnapshot().filter((item) => {
    const sameBirth = item.birthDate.slice(0, 10) === birthDate;
    const sameLast = normalizeText(item.lastName).includes(lastName);
    const sameFirst = normalizeText(item.firstNames).includes(firstNames);
    return sameBirth && sameLast && sameFirst;
  });
}

export function createApplication(
  input: Omit<Application, "id" | "number" | "status" | "submittedAt">,
): Application {
  const application: Application = {
    ...input,
    id: crypto.randomUUID(),
    number: nextNumber(competitionYear(input.competitionId)),
    status: "SOUMISE",
    submittedAt: new Date().toISOString(),
  };
  persist([application, ...readAll()]);
  return application;
}

export function patchApplication(id: string, patch: Partial<Application>) {
  const next = readAll().map((item) => (item.id === id ? { ...item, ...patch, id: item.id } : item));
  persist(next);
  return next.find((item) => item.id === id);
}

export function updateApplicationStatus(id: string, status: ApplicationStatus) {
  return patchApplication(id, { status });
}

export function updateManyApplications(ids: string[], patch: Partial<Application>) {
  const set = new Set(ids);
  persist(readAll().map((item) => (set.has(item.id) ? { ...item, ...patch } : item)));
}

export function deleteApplication(id: string) {
  persist(readAll().filter((item) => item.id !== id));
}

export function deleteManyApplications(ids: string[]) {
  const set = new Set(ids);
  persist(readAll().filter((item) => !set.has(item.id)));
}

function buildDemoApplications(): Application[] {
  const rows: Array<[ApplicationStatus, string, string, "F" | "M", string, string, Partial<Application>?]> = [
    ["SOUMISE", "OBAME", "Jean-Pierre", "M", "cat-b1", "fil-douanes"],
    ["SOUMISE", "NTOUTOUME", "Aline", "F", "cat-b1", "fil-impots"],
    ["SOUMISE", "MICKALA", "Patrick", "M", "cat-c1", "fil-admin"],
    ["SOUMISE", "ELLA", "Nadia", "F", "cat-c2", "fil-admin"],
    [
      "DOSSIER_PHYSIQUE_ATTENDU",
      "BOUNDA",
      "Sandra",
      "F",
      "cat-a2",
      "fil-douanes",
      {
        dropOffDate: "2026-10-15",
        dropOffSlot: "matin",
        dropOffVenue: "Secrétariat EPCA — Libreville",
      },
    ],
    ["DOSSIER_PHYSIQUE_ATTENDU", "MOUSSAVOU", "Hervé", "M", "cat-b2", "fil-rh"],
    ["DOSSIER_PHYSIQUE_DEPOSE", "KOUMBA", "Eric", "M", "cat-b2", "fil-impots"],
    ["DOSSIER_PHYSIQUE_DEPOSE", "BIBANG", "Chantal", "F", "cat-c1", "fil-rh"],
    ["DOSSIER_PHYSIQUE_VALIDE", "NDONG", "Mireille", "F", "cat-b1", "fil-impots"],
    ["DOSSIER_PHYSIQUE_VALIDE", "OVONO", "Serge", "M", "cat-c2", "fil-admin"],
    ["AUTORISE_CONCOURS", "IBINGA", "Claude", "M", "cat-a2", "fil-impots"],
    ["AUTORISE_CONCOURS", "NZENGUE", "Patricia", "F", "cat-b1", "fil-douanes"],
    ["AUTORISE_CONCOURS", "MAGANGA", "Didier", "M", "cat-b2", "fil-admin"],
    ["ADMIS", "ONDO", "Grace", "F", "cat-b1", "fil-douanes"],
    ["ADMIS", "PANDZOU", "Alain", "M", "cat-a2", "fil-impots"],
    ["NON_ADMIS", "IKAPI", "Lucie", "F", "cat-c1", "fil-admin"],
    ["SOUMISE", "MBOUMBA", "Yannick", "M", "cat-c1", "fil-douanes"],
    ["SOUMISE", "ASSOUMOU", "Prisca", "F", "cat-b2", "fil-admin"],
    ["SOUMISE", "LEKOGO", "Steeve", "M", "cat-c2", "fil-rh"],
    ["SOUMISE", "MENGUE", "Sylvie", "F", "cat-a2", "fil-admin"],
    ["SOUMISE", "BOUKANDOU", "Rodrigue", "M", "cat-b1", "fil-rh"],
    ["SOUMISE", "MOUNGUENGUI", "Estelle", "F", "cat-c1", "fil-impots"],
    ["DOSSIER_PHYSIQUE_ATTENDU", "NGUEMA", "Franck", "M", "cat-b1", "fil-admin"],
    ["DOSSIER_PHYSIQUE_ATTENDU", "MABIALA", "Josiane", "F", "cat-c2", "fil-douanes"],
    ["DOSSIER_PHYSIQUE_DEPOSE", "OYANE", "Armel", "M", "cat-a2", "fil-rh"],
    ["DOSSIER_PHYSIQUE_DEPOSE", "NYINGONE", "Bernadette", "F", "cat-b2", "fil-impots"],
    ["DOSSIER_PHYSIQUE_VALIDE", "MOUELE", "Cédric", "M", "cat-c1", "fil-douanes"],
    ["DOSSIER_PHYSIQUE_VALIDE", "AKENDENGUE", "Flore", "F", "cat-b1", "fil-admin"],
    ["DOSSIER_PHYSIQUE_REJETE", "MINKO", "Landry", "M", "cat-c2", "fil-impots"],
    ["AUTORISE_CONCOURS", "BEKALE", "Ruth", "F", "cat-b2", "fil-douanes"],
    ["AUTORISE_CONCOURS", "ONDIMBA", "Wilfried", "M", "cat-b1", "fil-impots"],
    ["AUTORISE_CONCOURS", "KOMBILA", "Nadège", "F", "cat-a2", "fil-rh"],
    ["ADMIS", "MAYOMBO", "Brice", "M", "cat-c1", "fil-admin"],
    ["ADMIS", "NDOUTOUME", "Vanessa", "F", "cat-b2", "fil-douanes"],
    ["NON_ADMIS", "SIMA", "Roland", "M", "cat-c2", "fil-rh"],
    ["NON_AUTORISE", "OYOUBI", "Carine", "F", "cat-c1", "fil-impots"],
  ];

  // Âges volontairement variés : le tableau de bord doit montrer une vraie pyramide.
  const ages = [
    23, 21, 26, 24, 29, 31, 27, 22, 25, 34, 28, 20, 33, 24, 38, 26, 19, 30, 22, 27, 41, 25, 23, 29,
    36, 21, 32, 24, 45, 28, 22, 26, 31, 20, 35, 27, 23, 30,
  ];
  const monthDay = (index: number) =>
    `${String((index % 12) + 1).padStart(2, "0")}-${String((index % 27) + 1).padStart(2, "0")}`;

  const currentYear = new Date().getFullYear();

  return rows.map(([status, lastName, firstNames, sex, categoryId, filiereId, extra], index) => {
    const age = ages[index % ages.length];
    const daysAgo = index % 14;
    const submitted = new Date();
    submitted.setDate(submitted.getDate() - daysAgo);
    submitted.setHours(8 + (index % 9), (index * 7) % 60, 0, 0);

    return {
      id: crypto.randomUUID(),
      number: nextNumber(competitionYear("cmp-2026")),
      competitionId: "cmp-2026",
      categoryId,
      filiereId,
      lastName,
      firstNames,
      birthDate: `${currentYear - age}-${monthDay(index)}`,
      sex,
      phone: "+241 00 00 00 00",
      email: `${lastName.toLowerCase()}.${firstNames.toLowerCase()}@demo.epca.ga`,
      status,
      submittedAt: submitted.toISOString(),
      demo: true,
      ...extra,
    };
  });
}
