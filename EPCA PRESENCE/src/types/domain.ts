export type CompetitionStatus = "open" | "upcoming" | "closed";

export type ApplicationStatus =
  | "BROUILLON"
  | "SOUMISE"
  | "DOSSIER_PHYSIQUE_ATTENDU"
  | "DOSSIER_PHYSIQUE_DEPOSE"
  | "DOSSIER_PHYSIQUE_VALIDE"
  | "DOSSIER_PHYSIQUE_REJETE"
  | "AUTORISE_CONCOURS"
  | "NON_AUTORISE"
  | "ADMIS"
  | "NON_ADMIS"
  | "ANNULEE";

export type StudentPublicStatus = "EN_FORMATION" | "DIPLOME" | "ABANDON" | "EXCLU";

/** Interne : formé à l’EPCA dans le cadre interne · Externe : candidat venu de l’extérieur. */
export type StudentOrigin = "INTERNE" | "EXTERNE";

export type TimeSlot = "matin" | "soir";

export interface Category {
  id: string;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

export interface Regie {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface Filiere {
  id: string;
  code: string;
  name: string;
  description: string;
  regieId: string;
  categoryIds: string[];
}

export interface Competition {
  id: string;
  slug: string;
  name: string;
  year: number;
  status: CompetitionStatus;
  opensAt: string;
  closesAt: string;
  examAt: string | null;
  seats: number | null;
  summary: string;
  conditions: string[];
  documents: string[];
  calendar: { label: string; date: string }[];
  categoryIds: string[];
  filiereIds: string[];
  instructions: string;
}

export interface Application {
  id: string;
  number: string;
  competitionId: string;
  categoryId: string;
  filiereId: string;
  lastName: string;
  firstNames: string;
  birthDate: string;
  sex: "F" | "M";
  phone: string;
  email: string;
  status: ApplicationStatus;
  submittedAt: string;
  dropOffDate?: string | null;
  dropOffSlot?: "matin" | "soir" | null;
  dropOffVenue?: string | null;
  notes?: string;
  demo?: boolean;
}

export type PublicationType = "depot" | "autorises" | "resultats";

export interface Publication {
  id: string;
  type: PublicationType;
  title: string;
  competitionId: string;
  categoryId: string | null;
  filiereId: string | null;
  dropOffDate: string | null;
  dropOffSlot: "matin" | "soir" | null;
  venue: string;
  applicationIds: string[];
  published: boolean;
  createdAt: string;
}

export interface Promotion {
  id: string;
  number: number;
  label: string;
  /** Ex. 2024-2026 pour la 31e. */
  academicYear: string;
  status: "en_cours" | "terminee";
  studentCount: number;
  summary: string;
}

export interface PublicStudent {
  id: string;
  promotionId: string;
  categoryId: string;
  filiereId: string;
  fullName: string;
  birthDate: string;
  status: StudentPublicStatus;
  /** Élève interne ou externe */
  origin: StudentOrigin;
  photoLabel: string;
  /** Portrait de l’élève : chemin public ou data-URL. Vide = pas de photo. */
  photoUrl?: string;
  /** Photo proposée par l’élève, en attente de validation. Jamais affichée publiquement. */
  photoPending?: string;
  photoSubmittedAt?: string;
  /** Poste / métier actuel (anciens) */
  careerTitle?: string;
  /** Structure / administration actuelle */
  careerOrganization?: string;
  /** Visible sur le portail public */
  published?: boolean;
  /** Contact relationnel publié sur le profil (collègues, services). */
  email?: string;
  phone?: string;
  /** Proposition de contact envoyée par l’élève, en attente de validation. */
  contactPending?: { email: string; phone: string };
  contactSubmittedAt?: string;
}

export type AlumniFeedbackStatus = "pending" | "published" | "hidden";

/** Témoignage rattaché au profil d’un élève / ancien */
export interface AlumniFeedback {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  promotionId: string | null;
  categoryId: string | null;
  filiereId: string | null;
  trainingYears: string;
  careerTitle: string;
  careerOrganization: string;
  careerPath: string;
  experience: string;
  status: AlumniFeedbackStatus;
  createdAt: string;
}

/** Photo de la galerie, alimentée par l’administration. */
export interface GalleryPhoto {
  id: string;
  title: string;
  caption: string;
  /** Événement ou album (ex. « Remise des diplômes 2025 ») */
  event: string;
  /** AAAA-MM-JJ */
  eventDate: string;
  /** URL publique ou data-URL */
  src: string;
  published: boolean;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export type AttendanceMark = "present" | "absent";

export interface Classroom {
  id: string;
  name: string;
  roomLabel: string;
  quota: number;
  categoryId: string;
  filiereId: string;
  studentIds: string[];
  createdAt: string;
}

export interface Teacher {
  id: string;
  lastName: string;
  firstNames: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface TeachingAssignment {
  id: string;
  teacherId: string;
  courseId: string;
  classroomIds: string[];
  createdAt: string;
}

export interface ScheduleSlot {
  start: string;
  end: string;
}

export interface ScheduleEntry {
  id: string;
  day: number;
  slotIndex: number;
  courseId: string;
  teacherId: string | null;
  room: string;
}

export interface Timetable {
  id: string;
  classroomId: string;
  label: string;
  weekStart: string;
  days: number[];
  slots: ScheduleSlot[];
  entries: ScheduleEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSession {
  id: string;
  classroomId: string;
  courseId: string | null;
  date: string;
  takenBy: "surveillant_general";
  marks: Record<string, AttendanceMark>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
