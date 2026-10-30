import type { PublicStudent, StudentOrigin, StudentPublicStatus } from "@/types/domain";

/**
 * Jeu de démonstration : 3 promotions × 5 catégories × 10 profils = 150 élèves.
 *
 * Règles respectées dans chaque (promotion, catégorie) :
 *  - 8 profils « de masse » dont le statut est commun à toute la promotion
 *    (31e : tous en formation · 30e et 29e : tous diplômés) — jamais un mélange ;
 *  - 1 abandon et 1 exclu, présents dans toutes les promotions.
 */

type PromoPlan = { id: string; status: Extract<StudentPublicStatus, "EN_FORMATION" | "DIPLOME"> };

const PROMOS: PromoPlan[] = [
  { id: "promo-31", status: "EN_FORMATION" },
  { id: "promo-30", status: "DIPLOME" },
  { id: "promo-29", status: "DIPLOME" },
];

const CATEGORY_FILIERES: Record<string, string[]> = {
  "cat-c2": ["fil-admin"],
  "cat-c1": ["fil-admin", "fil-rh"],
  "cat-b2": ["fil-impots", "fil-admin", "fil-rh"],
  "cat-b1": ["fil-douanes", "fil-impots", "fil-admin", "fil-rh"],
  "cat-a2": ["fil-douanes", "fil-impots"],
};

const LAST_NAMES = [
  "Moussounda", "Nzigou", "Koumba", "Bingou", "Ella", "Mintsa", "Ndong", "Obame", "Mba", "Nguema",
  "Ondo", "Mouketou", "Oyane", "Ndzeng", "Mavoungou", "Boussougou", "Ntoutoume", "Engonga", "Mounguengui",
  "Ndembi", "Issembé", "Makaya", "Nzamba", "Mikolo", "Bivigou", "Ovono", "Abessolo", "Essono", "Edou",
  "Lekogo", "Mebiame", "Mboumba", "Ngoua", "Okome", "Pambou", "Tchibanga", "Ogoula", "Nkoghe", "Mezui",
  "Assoumou", "Ntsame", "Ayingone", "Bekale", "Mouity", "Nzoghe", "Obiang", "Mfoumou", "Ikapi", "Moukagni",
];

const FEMALE = [
  "Estelle", "Sandrine", "Chancelle", "Ornella", "Gaëlle", "Nadège", "Flora", "Yolande", "Carine", "Laure",
  "Josiane", "Mireille", "Larissa", "Sabine", "Vanessa", "Rosine", "Clarisse", "Arlette", "Syntiche", "Éliane",
  "Prisca", "Aline", "Daniela", "Bénédicte", "Laetitia",
];

const MALE = [
  "Hervé", "Parfait", "Brice", "Ulrich", "Cédric", "Ghislain", "Fabrice", "Landry", "Yannick", "Arnaud",
  "Dieudonné", "Christian", "Médard", "Franck", "Blaise", "Wilfried", "Éric", "Judicaël", "Thierry", "Serge",
  "Gildas", "Aymard", "Bertrand", "Rodrigue", "Stéphane",
];

const ORGANIZATION: Record<string, string> = {
  "fil-douanes": "Direction générale des Douanes",
  "fil-impots": "Direction générale des Impôts",
  "fil-admin": "Ministère de la Fonction publique",
  "fil-rh": "Direction des ressources humaines",
};

function careerTitle(filiereId: string, categoryId: string, female: boolean) {
  const pick = (male: string, fem: string) => (female ? fem : male);
  if (filiereId === "fil-douanes") {
    return categoryId === "cat-a2"
      ? pick("Inspecteur des douanes", "Inspectrice des douanes")
      : pick("Contrôleur des douanes", "Contrôleuse des douanes");
  }
  if (filiereId === "fil-impots") {
    return categoryId === "cat-a2"
      ? pick("Inspecteur des impôts", "Inspectrice des impôts")
      : pick("Contrôleur des impôts", "Contrôleuse des impôts");
  }
  if (filiereId === "fil-rh") {
    return categoryId === "cat-c1" ? pick("Assistant RH", "Assistante RH") : "Gestionnaire RH";
  }
  if (categoryId === "cat-c2") return pick("Agent administratif", "Agente administrative");
  if (categoryId === "cat-c1") return pick("Secrétaire administratif", "Secrétaire administrative");
  return pick("Attaché d’administration", "Attachée d’administration");
}

const pad = (value: number) => String(value).padStart(2, "0");

function build(): PublicStudent[] {
  const list: PublicStudent[] = [];
  // Les noms des profils mis en avant sont réservés pour éviter les doublons.
  const used = new Set<string>(FEATURED.map((item) => item.student.fullName));
  let counter = 0;

  for (const promo of PROMOS) {
    for (const [categoryId, filiereIds] of Object.entries(CATEGORY_FILIERES)) {
      for (let slot = 0; slot < 10; slot += 1) {
        const female = counter % 2 === 0;
        const firstPool = female ? FEMALE : MALE;

        // Nom unique, déterministe
        let shift = 0;
        let fullName = "";
        do {
          const last = LAST_NAMES[(counter * 7 + shift * 3) % LAST_NAMES.length];
          const first = firstPool[(counter * 3 + shift + Math.floor(counter / 5)) % firstPool.length];
          fullName = `${last} ${first}`;
          shift += 1;
        } while (used.has(fullName));
        used.add(fullName);

        const status: StudentPublicStatus =
          slot === 8 ? "ABANDON" : slot === 9 ? "EXCLU" : promo.status;
        const filiereId = filiereIds[slot % filiereIds.length];
        // ~un tiers d’externes, réparti sur tous les statuts
        const origin: StudentOrigin = (slot + counter) % 3 === 0 ? "EXTERNE" : "INTERNE";
        const diplome = status === "DIPLOME";

        list.push({
          id: `st-${promo.id.slice(6)}-${categoryId.slice(4)}-${slot + 1}`,
          promotionId: promo.id,
          categoryId,
          filiereId,
          fullName,
          birthDate: `${1990 + ((counter * 3) % 12)}-${pad(1 + ((counter * 5) % 12))}-${pad(1 + ((counter * 7) % 28))}`,
          status,
          origin,
          photoLabel: "Portrait",
          careerTitle: diplome ? careerTitle(filiereId, categoryId, female) : undefined,
          careerOrganization: diplome ? ORGANIZATION[filiereId] : undefined,
          published: true,
        });
        counter += 1;
      }
    }
  }
  return list;
}

/** Profils mis en avant, avec portrait : ils prennent la place d’un profil généré, au même statut. */
const FEATURED: { slot: [string, string, number]; student: PublicStudent }[] = [
  {
    slot: ["promo-31", "cat-b1", 0],
    student: {
      id: "st-1", photoUrl: "/students/st-1.jpg", promotionId: "promo-31", categoryId: "cat-b1",
      filiereId: "fil-douanes", fullName: "Moussounda Daniela", birthDate: "1999-04-12",
      status: "EN_FORMATION", origin: "INTERNE", photoLabel: "Portrait", published: true,
      email: "moussounda.daniela@exemple.ga", phone: "+241 07 11 22 33",
    },
  },
  {
    slot: ["promo-31", "cat-b1", 4],
    student: {
      id: "st-2", photoUrl: "/students/st-2.jpg", promotionId: "promo-31", categoryId: "cat-b1",
      filiereId: "fil-douanes", fullName: "Nzigou Bénédicte", birthDate: "1998-11-02",
      status: "EN_FORMATION", origin: "EXTERNE", photoLabel: "Portrait", published: true,
      email: "nzigou.benedicte@exemple.ga", phone: "+241 06 18 44 21",
    },
  },
  {
    slot: ["promo-31", "cat-b1", 1],
    student: {
      id: "st-3", photoUrl: "/students/st-3.jpg", promotionId: "promo-31", categoryId: "cat-b1",
      filiereId: "fil-impots", fullName: "Koumba Aline", birthDate: "2000-01-20",
      status: "EN_FORMATION", origin: "INTERNE", photoLabel: "Portrait", published: true,
      email: "koumba.aline@exemple.ga", phone: "+241 07 45 18 22",
    },
  },
  {
    slot: ["promo-30", "cat-a2", 0],
    student: {
      id: "st-4", photoUrl: "/students/st-4.jpg", promotionId: "promo-30", categoryId: "cat-a2",
      filiereId: "fil-douanes", fullName: "Bingou Stéphane", birthDate: "1996-06-08",
      status: "DIPLOME", origin: "INTERNE", photoLabel: "Portrait",
      careerTitle: "Contrôleur des douanes", careerOrganization: "Direction générale des Douanes",
      published: true,
      email: "bingou.stephane@exemple.ga", phone: "+241 06 22 09 14",
    },
  },
  {
    slot: ["promo-31", "cat-c1", 8],
    student: {
      id: "st-5", photoUrl: "/students/st-5.jpg", promotionId: "promo-31", categoryId: "cat-c1",
      filiereId: "fil-admin", fullName: "Ella Prisca", birthDate: "2001-09-14",
      status: "ABANDON", origin: "EXTERNE", photoLabel: "Portrait", published: true,
      email: "ella.prisca@exemple.ga", phone: "+241 07 33 10 08",
    },
  },
  {
    slot: ["promo-30", "cat-b2", 2],
    student: {
      id: "st-6", photoUrl: "/students/st-6.jpg", promotionId: "promo-30", categoryId: "cat-b2",
      filiereId: "fil-rh", fullName: "Mintsa Rodrigue", birthDate: "1997-03-03",
      status: "DIPLOME", origin: "INTERNE", photoLabel: "Portrait",
      careerTitle: "Gestionnaire RH", careerOrganization: "Direction des ressources humaines",
      published: true,
      email: "mintsa.rodrigue@exemple.ga", phone: "+241 06 55 12 40",
    },
  },
  {
    slot: ["promo-29", "cat-a2", 1],
    student: {
      id: "st-7", photoUrl: "/students/st-7.jpg", promotionId: "promo-29", categoryId: "cat-a2",
      filiereId: "fil-impots", fullName: "Ndong Marie-Claire", birthDate: "1995-12-19",
      status: "DIPLOME", origin: "EXTERNE", photoLabel: "Portrait",
      careerTitle: "Inspectrice des impôts", careerOrganization: "Direction générale des Impôts",
      published: true,
      email: "ndong.marieclaire@exemple.ga", phone: "+241 07 28 16 05",
    },
  },
];

function assemble(): PublicStudent[] {
  const generated = build();

  // Remplace le profil généré de chaque emplacement par le profil mis en avant.
  const replaced = new Map<string, PublicStudent>();
  for (const { slot, student } of FEATURED) {
    const [promotionId, categoryId, index] = slot;
    const target = generated.filter((item) => item.promotionId === promotionId && item.categoryId === categoryId)[index];
    if (target) replaced.set(target.id, student);
  }

  return generated.map((item) => replaced.get(item.id) ?? item);
}

export const publicStudents: PublicStudent[] = assemble();
