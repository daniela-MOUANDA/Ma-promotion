import type {
  Category,
  Competition,
  FaqItem,
  Filiere,
  Promotion,
  Regie,
} from "@/types/domain";

export const categories: Category[] = [
  {
    id: "cat-c2",
    code: "C2",
    name: "C2",
    description: "Catégorie de recrutement C2 — libellé administratif à confirmer.",
    sortOrder: 1,
    active: true,
  },
  {
    id: "cat-c1",
    code: "C1",
    name: "C1",
    description: "Catégorie de recrutement C1 — libellé administratif à confirmer.",
    sortOrder: 2,
    active: true,
  },
  {
    id: "cat-b2",
    code: "B2",
    name: "B2",
    description: "Catégorie de recrutement B2 — libellé administratif à confirmer.",
    sortOrder: 3,
    active: true,
  },
  {
    id: "cat-b1",
    code: "B1",
    name: "B1",
    description: "Catégorie de recrutement B1 — libellé administratif à confirmer.",
    sortOrder: 4,
    active: true,
  },
  {
    id: "cat-a2",
    code: "A2",
    name: "A2",
    description: "Catégorie de recrutement A2 — libellé administratif à confirmer.",
    sortOrder: 5,
    active: true,
  },
];

export const regies: Regie[] = [
  {
    id: "reg-fin",
    code: "FIN",
    name: "Régie financière",
    description: "Placeholder — dénomination officielle à confirmer.",
  },
  {
    id: "reg-adm",
    code: "ADM",
    name: "Gestion administrative",
    description: "Placeholder — dénomination officielle à confirmer.",
  },
];

export const filieres: Filiere[] = [
  {
    id: "fil-douanes",
    code: "DOU",
    name: "Douanes",
    description: "Filière d’exemple pour la démonstration du portail.",
    regieId: "reg-fin",
    categoryIds: ["cat-b1", "cat-a2"],
  },
  {
    id: "fil-impots",
    code: "IMP",
    name: "Impôts",
    description: "Filière d’exemple pour la démonstration du portail.",
    regieId: "reg-fin",
    categoryIds: ["cat-b1", "cat-b2", "cat-a2"],
  },
  {
    id: "fil-admin",
    code: "GAD",
    name: "Administration générale",
    description: "Filière d’exemple — liste officielle à paramétrer.",
    regieId: "reg-adm",
    categoryIds: ["cat-c2", "cat-c1", "cat-b2", "cat-b1"],
  },
  {
    id: "fil-rh",
    code: "RH",
    name: "Ressources humaines",
    description: "Filière d’exemple — liste officielle à paramétrer.",
    regieId: "reg-adm",
    categoryIds: ["cat-c1", "cat-b2", "cat-b1"],
  },
];

export const competitions: Competition[] = [
  {
    id: "cmp-2026",
    slug: "concours-2026",
    name: "Concours d’entrée 2026",
    year: 2026,
    status: "open",
    opensAt: "2026-08-01",
    closesAt: "2026-09-30",
    examAt: "2026-11-15",
    seats: null,
    summary:
      "Session de démonstration. Les dates, le nombre de places et les conditions officielles seront publiés par l’administration.",
    conditions: [
      "Nationalité et conditions d’âge : à confirmer dans l’arrêté officiel.",
      "Diplôme requis selon la catégorie choisie : à confirmer.",
      "Dossier physique à déposer après la candidature en ligne.",
    ],
    documents: [
      "Pièce d’identité",
      "Acte de naissance",
      "Diplômes et relevés",
      "Photos d’identité",
      "Autres pièces listées par le concours",
    ],
    calendar: [
      { label: "Ouverture des candidatures en ligne", date: "2026-08-01" },
      { label: "Clôture des candidatures en ligne", date: "2026-09-30" },
      { label: "Dépôt des dossiers physiques", date: "2026-10-15" },
      { label: "Épreuves (date indicative)", date: "2026-11-15" },
    ],
    categoryIds: ["cat-c2", "cat-c1", "cat-b2", "cat-b1", "cat-a2"],
    filiereIds: ["fil-douanes", "fil-impots", "fil-admin", "fil-rh"],
    instructions:
      "La candidature en ligne ne remplace pas le dépôt du dossier physique. Conservez votre numéro de candidature.",
  },
  {
    id: "cmp-2027",
    slug: "concours-2027",
    name: "Concours d’entrée 2027",
    year: 2027,
    status: "upcoming",
    opensAt: "2027-07-01",
    closesAt: "2027-08-31",
    examAt: null,
    seats: null,
    summary: "Session à venir. Le calendrier officiel n’est pas encore publié.",
    conditions: ["Conditions à publier."],
    documents: ["Liste des pièces à publier."],
    calendar: [{ label: "Ouverture prévue (indicatif)", date: "2027-07-01" }],
    categoryIds: ["cat-c2", "cat-c1", "cat-b2", "cat-b1", "cat-a2"],
    filiereIds: ["fil-douanes", "fil-impots", "fil-admin", "fil-rh"],
    instructions: "Les inscriptions ne sont pas encore ouvertes.",
  },
  {
    id: "cmp-2025",
    slug: "concours-2025",
    name: "Concours d’entrée 2025",
    year: 2025,
    status: "closed",
    opensAt: "2025-07-15",
    closesAt: "2025-09-15",
    examAt: "2025-11-08",
    seats: null,
    summary: "Session close. Donnée de démonstration pour l’historique du portail.",
    conditions: ["Session close."],
    documents: [],
    calendar: [],
    categoryIds: ["cat-b1", "cat-a2"],
    filiereIds: ["fil-douanes", "fil-impots"],
    instructions: "Cette session n’accepte plus de candidatures.",
  },
];

export const promotions: Promotion[] = [
  {
    id: "promo-31",
    number: 31,
    label: "31e promotion",
    academicYear: "2024-2026",
    status: "en_cours",
    studentCount: 50,
    summary: "Promotion actuellement en formation à l’EPCA : tous les élèves suivent leur cursus.",
  },
  {
    id: "promo-30",
    number: 30,
    label: "30e promotion",
    academicYear: "2022-2024",
    status: "terminee",
    studentCount: 50,
    summary: "Promotion sortie diplômée : retrouvez les parcours et les premières affectations.",
  },
  {
    id: "promo-29",
    number: 29,
    label: "29e promotion",
    academicYear: "2020-2022",
    status: "terminee",
    studentCount: 50,
    summary: "Promotion historique diplômée : des anciens aujourd’hui en poste dans l’administration.",
  },
];

export { publicStudents } from "./students";

export const faqItems: FaqItem[] = [
  {
    id: "faq-1",
    question: "À quoi sert ce portail ?",
    answer:
      "Ma Promotion présente les promotions de l’EPCA, les profils des élèves par catégorie et filière, et recueille les témoignages des anciens après leur formation.",
  },
  {
    id: "faq-2",
    question: "Comment consulter une promotion ?",
    answer:
      "Ouvrez la page Promotions, choisissez une promotion, puis la catégorie et la filière qui vous intéressent pour voir les profils publiés.",
  },
  {
    id: "faq-3",
    question: "Je suis un ancien élève : comment témoigner ?",
    answer:
      "Ouvrez votre profil dans une promotion (catégorie → filière → votre nom), puis déposez votre témoignage depuis cette page. Il est publié après validation par l’administration.",
  },
  {
    id: "faq-4",
    question: "Les informations sont-elles officielles ?",
    answer:
      "Les contenus sont renseignés et publiés par l’administration de l’EPCA. Les effectifs et libellés évoluent au fur et à mesure des mises à jour du back-office.",
  },
];
