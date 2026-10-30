import { getApplicationsSnapshot } from "@/lib/applications-store";
import { emitDataChanged } from "@/lib/data-events";
import { fullName } from "@/lib/roster";
import type {
  AttendanceMark,
  AttendanceSession,
  Classroom,
  Course,
  ScheduleEntry,
  ScheduleSlot,
  Teacher,
  TeachingAssignment,
  Timetable,
} from "@/types/domain";

const KEY = "epca.school.v1";
const SEED_KEY = "epca.school.seeded.v2";

export interface SchoolState {
  classrooms: Classroom[];
  teachers: Teacher[];
  courses: Course[];
  assignments: TeachingAssignment[];
  sessions: AttendanceSession[];
  timetables: Timetable[];
}

const EMPTY: SchoolState = {
  classrooms: [],
  teachers: [],
  courses: [],
  assignments: [],
  sessions: [],
  timetables: [],
};

export const DEFAULT_SLOTS: ScheduleSlot[] = [
  { start: "08:00", end: "10:00" },
  { start: "10:15", end: "12:15" },
  { start: "14:00", end: "16:00" },
  { start: "16:15", end: "18:15" },
];

export const DEFAULT_DAYS = [1, 2, 3, 4, 5];

export const DAY_LABELS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
};

let cache: SchoolState | null = null;

function readAll(): SchoolState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<SchoolState>;
    return {
      classrooms: parsed.classrooms ?? [],
      teachers: parsed.teachers ?? [],
      courses: parsed.courses ?? [],
      assignments: parsed.assignments ?? [],
      sessions: parsed.sessions ?? [],
      timetables: parsed.timetables ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

function persist(next: SchoolState) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  emitDataChanged();
}

function nowIso() {
  return new Date().toISOString();
}

export function ensureSchoolSeed() {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) {
    cache = readAll();
    return;
  }
  const admitted = getApplicationsSnapshot().filter((item) => item.status === "ADMIS");
  const byKey = (categoryId: string, filiereId: string) =>
    admitted.filter((item) => item.categoryId === categoryId && item.filiereId === filiereId);

  const classDouanes: Classroom = {
    id: crypto.randomUUID(),
    name: "Classe B1 Douanes 1",
    roomLabel: "Salle 12",
    quota: 30,
    categoryId: "cat-b1",
    filiereId: "fil-douanes",
    studentIds: byKey("cat-b1", "fil-douanes").map((item) => item.id),
    createdAt: nowIso(),
  };
  const classImpots: Classroom = {
    id: crypto.randomUUID(),
    name: "Classe A2 Impôts 1",
    roomLabel: "Salle 8",
    quota: 25,
    categoryId: "cat-a2",
    filiereId: "fil-impots",
    studentIds: byKey("cat-a2", "fil-impots").map((item) => item.id),
    createdAt: nowIso(),
  };

  const teacherA: Teacher = {
    id: crypto.randomUUID(),
    lastName: "MBA",
    firstNames: "Sylvie",
    email: "s.mba@epca.placeholder.ga",
    phone: "+241 00 00 00 00",
    createdAt: nowIso(),
  };
  const teacherB: Teacher = {
    id: crypto.randomUUID(),
    lastName: "OGANDAGA",
    firstNames: "Pierre",
    email: "p.ogandaga@epca.placeholder.ga",
    phone: "+241 00 00 00 00",
    createdAt: nowIso(),
  };

  const courseOrg: Course = {
    id: crypto.randomUUID(),
    code: "ORG-01",
    name: "Organisation administrative",
    createdAt: nowIso(),
  };
  const courseDroit: Course = {
    id: crypto.randomUUID(),
    code: "DRT-01",
    name: "Droit administratif",
    createdAt: nowIso(),
  };

  persist({
    classrooms: [classDouanes, classImpots],
    teachers: [teacherA, teacherB],
    courses: [courseOrg, courseDroit],
    assignments: [
      {
        id: crypto.randomUUID(),
        teacherId: teacherA.id,
        courseId: courseOrg.id,
        classroomIds: [classDouanes.id, classImpots.id],
        createdAt: nowIso(),
      },
      {
        id: crypto.randomUUID(),
        teacherId: teacherB.id,
        courseId: courseDroit.id,
        classroomIds: [classDouanes.id],
        createdAt: nowIso(),
      },
    ],
    sessions: [],
    timetables: [],
  });
  localStorage.setItem(SEED_KEY, "1");
}

export function getSchoolSnapshot(): SchoolState {
  if (!cache) {
    ensureSchoolSeed();
    cache = readAll();
  }
  return cache;
}

function update(patch: (current: SchoolState) => SchoolState) {
  persist(patch(getSchoolSnapshot()));
}

export function createClassroom(input: Omit<Classroom, "id" | "createdAt" | "studentIds"> & { studentIds?: string[] }) {
  const item: Classroom = {
    ...input,
    id: crypto.randomUUID(),
    studentIds: input.studentIds ?? [],
    createdAt: nowIso(),
  };
  update((current) => ({ ...current, classrooms: [item, ...current.classrooms] }));
  return item;
}

export function patchClassroom(id: string, patch: Partial<Classroom>) {
  update((current) => ({
    ...current,
    classrooms: current.classrooms.map((item) => (item.id === id ? { ...item, ...patch, id } : item)),
  }));
}

export function deleteClassroom(id: string) {
  update((current) => ({
    ...current,
    classrooms: current.classrooms.filter((item) => item.id !== id),
    assignments: current.assignments
      .map((item) => ({ ...item, classroomIds: item.classroomIds.filter((classroomId) => classroomId !== id) }))
      .filter((item) => item.classroomIds.length > 0),
    sessions: current.sessions.filter((item) => item.classroomId !== id),
    timetables: current.timetables.filter((item) => item.classroomId !== id),
  }));
}

export function assignStudentsToClassroom(classroomId: string, studentIds: string[]) {
  update((current) => {
    const classroom = current.classrooms.find((item) => item.id === classroomId);
    if (!classroom) return current;
    const unique = [...new Set([...classroom.studentIds, ...studentIds])].slice(0, classroom.quota);
    return {
      ...current,
      classrooms: current.classrooms.map((item) => {
        if (item.id === classroomId) return { ...item, studentIds: unique };
        return { ...item, studentIds: item.studentIds.filter((id) => !studentIds.includes(id)) };
      }),
    };
  });
}

export function removeStudentFromClassroom(classroomId: string, studentId: string) {
  update((current) => ({
    ...current,
    classrooms: current.classrooms.map((item) =>
      item.id === classroomId
        ? { ...item, studentIds: item.studentIds.filter((id) => id !== studentId) }
        : item,
    ),
  }));
}

export function fillClassroomQuota(classroomId: string, candidateIds: string[]) {
  const classroom = getSchoolSnapshot().classrooms.find((item) => item.id === classroomId);
  if (!classroom) return 0;
  const remaining = Math.max(0, classroom.quota - classroom.studentIds.length);
  const take = candidateIds.filter((id) => !classroom.studentIds.includes(id)).slice(0, remaining);
  if (take.length) assignStudentsToClassroom(classroomId, take);
  return take.length;
}

export function createTeacher(input: Omit<Teacher, "id" | "createdAt">) {
  const item: Teacher = { ...input, id: crypto.randomUUID(), createdAt: nowIso() };
  update((current) => ({ ...current, teachers: [item, ...current.teachers] }));
  return item;
}

export function patchTeacher(id: string, patch: Partial<Teacher>) {
  update((current) => ({
    ...current,
    teachers: current.teachers.map((item) => (item.id === id ? { ...item, ...patch, id } : item)),
  }));
}

export function deleteTeacher(id: string) {
  update((current) => ({
    ...current,
    teachers: current.teachers.filter((item) => item.id !== id),
    assignments: current.assignments.filter((item) => item.teacherId !== id),
    timetables: current.timetables.map((table) => ({
      ...table,
      entries: table.entries.map((entry) =>
        entry.teacherId === id ? { ...entry, teacherId: null } : entry,
      ),
    })),
  }));
}

export function createCourse(input: Omit<Course, "id" | "createdAt">) {
  const item: Course = { ...input, id: crypto.randomUUID(), createdAt: nowIso() };
  update((current) => ({ ...current, courses: [item, ...current.courses] }));
  return item;
}

export function deleteCourse(id: string) {
  update((current) => ({
    ...current,
    courses: current.courses.filter((item) => item.id !== id),
    assignments: current.assignments.filter((item) => item.courseId !== id),
    sessions: current.sessions.filter((item) => item.courseId !== id),
    timetables: current.timetables.map((table) => ({
      ...table,
      entries: table.entries.filter((entry) => entry.courseId !== id),
    })),
  }));
}

export function createAssignment(input: Omit<TeachingAssignment, "id" | "createdAt">) {
  const item: TeachingAssignment = { ...input, id: crypto.randomUUID(), createdAt: nowIso() };
  update((current) => ({ ...current, assignments: [item, ...current.assignments] }));
  return item;
}

export function deleteAssignment(id: string) {
  update((current) => ({
    ...current,
    assignments: current.assignments.filter((item) => item.id !== id),
  }));
}

export function findAttendanceSession(classroomId: string, date: string, courseId: string | null) {
  return getSchoolSnapshot().sessions.find(
    (item) => item.classroomId === classroomId && item.date === date && (item.courseId ?? null) === courseId,
  );
}

export function saveAttendanceSession(input: {
  classroomId: string;
  courseId: string | null;
  date: string;
  marks: Record<string, AttendanceMark>;
  notes: string;
}) {
  const existing = findAttendanceSession(input.classroomId, input.date, input.courseId);
  const stamp = nowIso();
  if (existing) {
    update((current) => ({
      ...current,
      sessions: current.sessions.map((item) =>
        item.id === existing.id ? { ...item, marks: input.marks, notes: input.notes, updatedAt: stamp } : item,
      ),
    }));
    return existing.id;
  }
  const item: AttendanceSession = {
    id: crypto.randomUUID(),
    classroomId: input.classroomId,
    courseId: input.courseId,
    date: input.date,
    takenBy: "surveillant_general",
    marks: input.marks,
    notes: input.notes,
    createdAt: stamp,
    updatedAt: stamp,
  };
  update((current) => ({ ...current, sessions: [item, ...current.sessions] }));
  return item.id;
}

export function deleteAttendanceSession(id: string) {
  update((current) => ({
    ...current,
    sessions: current.sessions.filter((item) => item.id !== id),
  }));
}

export function findTimetable(classroomId: string, weekStart: string) {
  return getSchoolSnapshot().timetables.find(
    (item) => item.classroomId === classroomId && item.weekStart === weekStart,
  );
}

export function saveTimetable(table: Timetable) {
  const stamp = nowIso();
  update((current) => {
    const exists = current.timetables.some((item) => item.id === table.id);
    const next = { ...table, updatedAt: stamp };
    return {
      ...current,
      timetables: exists
        ? current.timetables.map((item) => (item.id === table.id ? next : item))
        : [next, ...current.timetables],
    };
  });
}

export function deleteTimetable(id: string) {
  update((current) => ({ ...current, timetables: current.timetables.filter((item) => item.id !== id) }));
}

export function teacherBusyAt(
  weekStart: string,
  day: number,
  slotIndex: number,
  teacherId: string,
  exceptClassroomId?: string,
) {
  return getSchoolSnapshot().timetables.some(
    (table) =>
      table.weekStart === weekStart &&
      table.classroomId !== exceptClassroomId &&
      table.entries.some(
        (entry) => entry.day === day && entry.slotIndex === slotIndex && entry.teacherId === teacherId,
      ),
  );
}

/**
 * Répartit les cours attribués à la classe sur la grille jour × créneau.
 * Un enseignant déjà occupé sur le même créneau dans une autre salle est ignoré.
 */
export function generateTimetable(input: {
  classroomId: string;
  weekStart: string;
  label: string;
  days: number[];
  slots: ScheduleSlot[];
  room: string;
  courseIds?: string[];
}): Timetable {
  const state = getSchoolSnapshot();
  const existing = findTimetable(input.classroomId, input.weekStart);

  const pairs = state.assignments
    .filter((item) => item.classroomIds.includes(input.classroomId))
    .filter((item) => (input.courseIds?.length ? input.courseIds.includes(item.courseId) : true))
    .map((item) => ({ courseId: item.courseId, teacherId: item.teacherId }));

  const unique = [...new Map(pairs.map((item) => [`${item.courseId}:${item.teacherId}`, item])).values()];
  const load = new Map(unique.map((item) => [`${item.courseId}:${item.teacherId}`, 0]));
  const entries: ScheduleEntry[] = [];

  for (const day of input.days) {
    const usedToday = new Set<string>();
    for (let slotIndex = 0; slotIndex < input.slots.length; slotIndex += 1) {
      const ranked = [...unique].sort(
        (a, b) =>
          (load.get(`${a.courseId}:${a.teacherId}`) ?? 0) - (load.get(`${b.courseId}:${b.teacherId}`) ?? 0),
      );
      const pick =
        ranked.find(
          (item) =>
            !usedToday.has(item.courseId) &&
            !teacherBusyAt(input.weekStart, day, slotIndex, item.teacherId, input.classroomId),
        ) ??
        ranked.find(
          (item) => !teacherBusyAt(input.weekStart, day, slotIndex, item.teacherId, input.classroomId),
        );
      if (!pick) continue;
      usedToday.add(pick.courseId);
      load.set(`${pick.courseId}:${pick.teacherId}`, (load.get(`${pick.courseId}:${pick.teacherId}`) ?? 0) + 1);
      entries.push({
        id: crypto.randomUUID(),
        day,
        slotIndex,
        courseId: pick.courseId,
        teacherId: pick.teacherId,
        room: input.room,
      });
    }
  }

  const stamp = nowIso();
  const table: Timetable = {
    id: existing?.id ?? crypto.randomUUID(),
    classroomId: input.classroomId,
    label: input.label,
    weekStart: input.weekStart,
    days: input.days,
    slots: input.slots,
    entries,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
  };
  saveTimetable(table);
  return table;
}

export function getClassroomForStudent(studentId: string) {
  return getSchoolSnapshot().classrooms.find((item) => item.studentIds.includes(studentId));
}

export function unassignedAdmittedIds(admittedIds: string[]) {
  const assigned = new Set(getSchoolSnapshot().classrooms.flatMap((item) => item.studentIds));
  return admittedIds.filter((id) => !assigned.has(id));
}

export function teacherFullName(teacher: Pick<Teacher, "lastName" | "firstNames">) {
  return fullName(teacher);
}
