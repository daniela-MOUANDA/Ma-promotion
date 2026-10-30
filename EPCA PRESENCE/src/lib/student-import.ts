import { cohortOf, isExitStatus } from "@/lib/cohort";
import type {
  Category,
  Filiere,
  Promotion,
  PublicStudent,
  StudentOrigin,
  StudentPublicStatus,
} from "@/types/domain";

/** Colonnes à remplir dans chaque onglet. La filière est le nom de la page. */
export const IMPORT_COLUMNS = ["Noms", "Promotion", "Catégorie", "Statut", "Interne / Externe"] as const;

export type ImportRowState = "ok" | "error" | "duplicate";

export interface ImportRow {
  /** Nom de l’onglet Excel (filière). */
  sheet: string;
  line: number;
  fullName: string;
  promotionRaw: string;
  categoryRaw: string;
  filiereRaw: string;
  statusRaw: string;
  originRaw: string;
  state: ImportRowState;
  /** Raison affichée à l’administrateur si la ligne n’est pas importée. */
  reason?: string;
  student?: Omit<PublicStudent, "id">;
}

export interface ImportCatalog {
  promotions: Promotion[];
  categories: Category[];
  filieres: Filiere[];
  students: PublicStudent[];
}

/** minuscules, sans accents, espaces et ponctuation réduits — pour comparer des saisies humaines. */
export function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const STATUS_ALIASES: Record<string, StudentPublicStatus> = {
  "en formation": "EN_FORMATION",
  formation: "EN_FORMATION",
  "en cours": "EN_FORMATION",
  diplome: "DIPLOME",
  diplomee: "DIPLOME",
  diplomes: "DIPLOME",
  abandon: "ABANDON",
  abandonne: "ABANDON",
  abandonnee: "ABANDON",
  exclu: "EXCLU",
  exclue: "EXCLU",
  exclusion: "EXCLU",
};

const ORIGIN_ALIASES: Record<string, StudentOrigin> = {
  interne: "INTERNE",
  internes: "INTERNE",
  int: "INTERNE",
  i: "INTERNE",
  externe: "EXTERNE",
  externes: "EXTERNE",
  ext: "EXTERNE",
  e: "EXTERNE",
};

type ColumnKey = "fullName" | "promotionRaw" | "categoryRaw" | "filiereRaw" | "statusRaw" | "originRaw";

const HEADER_ALIASES: Record<string, ColumnKey> = {
  noms: "fullName",
  nom: "fullName",
  "nom complet": "fullName",
  "noms et prenoms": "fullName",
  "nom et prenoms": "fullName",
  eleve: "fullName",
  promotion: "promotionRaw",
  categorie: "categoryRaw",
  filiere: "filiereRaw",
  statut: "statusRaw",
  "interne externe": "originRaw",
  "interne ou externe": "originRaw",
  type: "originRaw",
  origine: "originRaw",
};

function cellText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseHeaderRow(row: unknown[]) {
  const columns: Partial<Record<ColumnKey, number>> = {};
  row.forEach((cell, index) => {
    const key = HEADER_ALIASES[normalizeText(cell)];
    if (key && columns[key] === undefined) columns[key] = index;
  });
  return columns;
}

function findHeader(data: unknown[][]) {
  const limit = Math.min(5, data.length);
  for (let index = 0; index < limit; index += 1) {
    const columns = parseHeaderRow(data[index] ?? []);
    if (columns.fullName !== undefined && columns.promotionRaw !== undefined) {
      return { index, columns };
    }
  }
  return null;
}

/** Excel : 31 caractères max, pas de \ / ? * [ ]. */
export function excelSheetName(name: string, fallback = "Filiere") {
  const cleaned = name.replace(/[\\/?*[\]:]/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || fallback).slice(0, 31);
}

/** Lit toutes les pages du .xlsx. La filière = nom de l’onglet, sauf si la colonne Filière est encore remplie. */
export async function readStudentSheet(file: File) {
  const readXlsxFile = (await import("read-excel-file/browser")).default;
  const sheets = await readXlsxFile(file);
  if (sheets.length === 0) throw new Error("Le fichier est vide.");

  const rows: Array<{
    sheet: string;
    line: number;
    fullName: string;
    promotionRaw: string;
    categoryRaw: string;
    filiereRaw: string;
    statusRaw: string;
    originRaw: string;
  }> = [];
  const skipped: string[] = [];

  for (const { sheet, data } of sheets) {
    if (!data.length) continue;
    const header = findHeader(data);
    if (!header) {
      skipped.push(sheet);
      continue;
    }

    const missing = [
      header.columns.fullName === undefined ? "Noms" : null,
      header.columns.promotionRaw === undefined ? "Promotion" : null,
      header.columns.categoryRaw === undefined ? "Catégorie" : null,
      header.columns.originRaw === undefined ? "Interne / Externe" : null,
    ].filter(Boolean);
    if (missing.length > 0) {
      throw new Error(
        `Onglet « ${sheet} » : colonne(s) introuvable(s) : ${missing.join(", ")}.`,
      );
    }

    const pick = (row: (typeof data)[number], key: ColumnKey) => {
      const index = header.columns[key];
      return index === undefined ? "" : cellText(row[index]);
    };

    for (let offset = 0; offset < data.length - header.index - 1; offset += 1) {
      const row = data[header.index + 1 + offset] ?? [];
      const fullName = pick(row, "fullName");
      const promotionRaw = pick(row, "promotionRaw");
      const categoryRaw = pick(row, "categoryRaw");
      const statusRaw = pick(row, "statusRaw");
      const originRaw = pick(row, "originRaw");
      const filiereRaw = pick(row, "filiereRaw") || sheet;
      if (!fullName && !promotionRaw && !categoryRaw && !statusRaw && !originRaw) continue;
      rows.push({
        sheet,
        line: header.index + 2 + offset,
        fullName,
        promotionRaw,
        categoryRaw,
        filiereRaw,
        statusRaw,
        originRaw,
      });
    }
  }

  if (rows.length === 0) {
    if (skipped.length > 0) {
      throw new Error(
        `Aucun élève lu. Les onglets ${skipped.map((name) => `« ${name} »`).join(", ")} n’ont pas les colonnes attendues (Noms, Promotion, Catégorie…).`,
      );
    }
    throw new Error("Aucune ligne d’élève trouvée sous les en-têtes.");
  }

  return rows;
}

type RawRow = Awaited<ReturnType<typeof readStudentSheet>>[number];

/** Rapproche chaque ligne du catalogue existant et signale ce qui ne peut pas être importé. */
export function validateStudentRows(rows: RawRow[], catalog: ImportCatalog): ImportRow[] {
  const known = new Set(
    catalog.students.map((student) => `${normalizeText(student.fullName)}|${student.promotionId}`),
  );

  return rows.map((row) => {
    const base = { ...row };
    const fail = (reason: string): ImportRow => ({ ...base, state: "error", reason });

    if (!row.fullName) return fail("Nom manquant.");

    const promoKey = normalizeText(row.promotionRaw);
    const promoNumber = promoKey.match(/\d+/)?.[0];
    const promotion = catalog.promotions.find(
      (item) =>
        normalizeText(item.label) === promoKey ||
        (promoNumber !== undefined && String(item.number) === promoNumber),
    );
    if (!promotion) return fail(`Promotion « ${row.promotionRaw || "vide"} » inconnue — créez-la d’abord.`);

    const categoryKey = normalizeText(row.categoryRaw);
    const category = catalog.categories.find(
      (item) => normalizeText(item.code) === categoryKey || normalizeText(item.name) === categoryKey,
    );
    if (!category) return fail(`Catégorie « ${row.categoryRaw || "vide"} » inconnue.`);

    const filiereKey = normalizeText(row.filiereRaw);
    const filiere = catalog.filieres.find(
      (item) => normalizeText(item.name) === filiereKey || normalizeText(item.code) === filiereKey,
    );
    if (!filiere) return fail(`Filière « ${row.filiereRaw || "vide"} » inconnue (nom de l’onglet).`);

    if (filiere.categoryIds.length > 0 && !filiere.categoryIds.includes(category.id)) {
      const allowed = catalog.categories
        .filter((item) => filiere.categoryIds.includes(item.id))
        .map((item) => item.code)
        .join(", ");
      return fail(
        `Catégorie ${category.code} non rattachée à ${filiere.name}${allowed ? ` (utiliser ${allowed})` : ""}.`,
      );
    }

    const statusKey = normalizeText(row.statusRaw);
    const parsed = statusKey ? STATUS_ALIASES[statusKey] : undefined;
    if (statusKey && !parsed) return fail(`Statut « ${row.statusRaw} » non reconnu.`);
    const cohort = cohortOf(promotion);
    if (parsed && !isExitStatus(parsed) && parsed !== cohort) {
      return fail(
        promotion.status === "en_cours"
          ? "Cette promotion est encore en formation : indiquez En formation, Abandon ou Exclu."
          : "Cette promotion est diplômée : indiquez Diplômé, Abandon ou Exclu.",
      );
    }
    const status: StudentPublicStatus = parsed ?? cohort;

    const origin = ORIGIN_ALIASES[normalizeText(row.originRaw)];
    if (!origin) {
      return fail(
        row.originRaw
          ? `« ${row.originRaw} » : indiquez Interne ou Externe.`
          : "Interne ou Externe non renseigné.",
      );
    }

    const identity = `${normalizeText(row.fullName)}|${promotion.id}`;
    if (known.has(identity)) {
      return { ...base, state: "duplicate", reason: "Déjà présent dans cette promotion." };
    }
    known.add(identity);

    return {
      ...base,
      state: "ok",
      student: {
        fullName: row.fullName.replace(/\s+/g, " "),
        birthDate: "",
        promotionId: promotion.id,
        categoryId: category.id,
        filiereId: filiere.id,
        status,
        origin,
        photoLabel: "Portrait",
        published: true,
      },
    };
  });
}

/** Modèle Excel : une page par filière, colonnes déjà prêtes à remplir. */
export async function downloadStudentTemplate(catalog: Pick<ImportCatalog, "promotions" | "categories" | "filieres">) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const promotion = catalog.promotions[0];
  const statusExample = promotion?.status === "terminee" ? "Diplômé" : "En formation";
  const promotionLabel = promotion?.label ?? "31e promotion";
  const filieres = [...catalog.filieres].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const pages = filieres.length ? filieres : [{ id: "", code: "FIL", name: "Filière", categoryIds: [] as string[] }];
  const used = new Set<string>();

  const sheets = pages.map((filiere) => {
    const category =
      catalog.categories.find((item) => filiere.categoryIds.includes(item.id)) ?? catalog.categories[0];
    let sheet = excelSheetName(filiere.name, filiere.code || "Filiere");
    if (used.has(normalizeText(sheet))) sheet = excelSheetName(filiere.code || `${sheet} 2`);
    used.add(normalizeText(sheet));

    const allowed = catalog.categories
      .filter((item) => filiere.categoryIds.includes(item.id))
      .map((item) => item.code)
      .join(", ");

    const head = IMPORT_COLUMNS.map((title) => ({
      value: title,
      fontWeight: "bold" as const,
    }));

    return {
      sheet,
      columns: [{ width: 32 }, { width: 22 }, { width: 16 }, { width: 18 }, { width: 20 }],
      data: [
        [
          {
            value: allowed
              ? `${filiere.name} — catégories : ${allowed}`
              : filiere.name,
            fontWeight: "bold" as const,
            columnSpan: 5,
          },
          null,
          null,
          null,
          null,
        ],
        head,
        ["Nom Prénom", promotionLabel, category?.code ?? "B1", statusExample, "Interne"],
      ],
    };
  });

  await writeXlsxFile(sheets).toFile("modele-import-eleves.xlsx");
}
