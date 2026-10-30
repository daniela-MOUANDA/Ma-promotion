import { CyberHead, CyberTable, Td, Th, Tr } from "@/components/admin/CyberTable";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { AttendanceMarkBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import {
  Avatar,
  Card,
  CardHead,
  Chip,
  EmptyState,
  PageHeader,
  Progress,
  StatCard,
} from "@/components/ui/Surface";
import { ATTENDANCE_MARK_LABEL } from "@/constants/labels";
import { getApplicationById } from "@/lib/applications-store";
import { getCategory, getFiliere } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { deleteAttendanceSession, findAttendanceSession, saveAttendanceSession } from "@/lib/school-store";
import { fullName } from "@/lib/roster";
import { useSchool } from "@/lib/use-live-data";
import type { Application, AttendanceMark, AttendanceSession } from "@/types/domain";
import { CalendarDays, CheckCheck, ClipboardCheck, History, Printer, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const MARKS: AttendanceMark[] = ["present", "absent"];

const MARK_ACTIVE: Record<AttendanceMark, string> = {
  present: "bg-emerald-600 text-white",
  absent: "bg-rose-600 text-white",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function peopleOf(ids: string[]): Application[] {
  return ids
    .map((id) => getApplicationById(id))
    .filter((item): item is Application => Boolean(item))
    .sort((a, b) => fullName(a).localeCompare(fullName(b), "fr"));
}

function countMarks(marks: Record<string, AttendanceMark>, ids: string[]) {
  const totals = { present: 0, absent: 0, empty: 0 };
  for (const id of ids) {
    const mark = marks[id];
    if (!mark) totals.empty += 1;
    else if (mark === "absent") totals.absent += 1;
    else totals.present += 1;
  }
  return totals;
}

export function AdminAttendancePage() {
  const { confirm, toast } = useFeedback();
  const school = useSchool();
  const [classroomId, setClassroomId] = useState(school.classrooms[0]?.id ?? "");
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const classroom = school.classrooms.find((item) => item.id === classroomId) ?? null;
  const students = classroom ? peopleOf(classroom.studentIds) : [];
  const existing = classroom ? findAttendanceSession(classroom.id, date, courseId || null) : undefined;
  const [marks, setMarks] = useState<Record<string, AttendanceMark>>({});

  useEffect(() => {
    const found = classroomId ? findAttendanceSession(classroomId, date, courseId || null) : undefined;
    setMarks(found?.marks ?? {});
    setNotes(found?.notes ?? "");
  }, [classroomId, date, courseId, school.sessions]);

  const totals = countMarks(
    marks,
    students.map((item) => item.id),
  );
  const done = students.length ? Math.round(((students.length - totals.empty) / students.length) * 100) : 0;
  const presenceRate = students.length
    ? Math.round((totals.present / students.length) * 100)
    : 0;

  const classStats = useMemo(() => {
    return school.classrooms.map((item) => {
      const sessions = school.sessions.filter((session) => session.classroomId === item.id);
      const present = sessions.reduce(
        (sum, session) =>
          sum + Object.values(session.marks).filter((mark) => mark === "present").length,
        0,
      );
      const total = sessions.reduce((sum, session) => sum + Object.keys(session.marks).length, 0);
      return {
        classroom: item,
        sessions: sessions.length,
        rate: total ? Math.round((present / total) * 100) : null,
      };
    });
  }, [school.classrooms, school.sessions]);

  const todaySessions = school.sessions.filter((item) => item.date === todayIso());

  function setAll(mark: AttendanceMark) {
    const next: Record<string, AttendanceMark> = {};
    for (const student of students) next[student.id] = mark;
    setMarks(next);
  }

  function save() {
    if (!classroom) return;
    saveAttendanceSession({
      classroomId: classroom.id,
      courseId: courseId || null,
      date,
      marks,
      notes,
    });
    toast({
      tone: "success",
      title: "Appel enregistré",
      message: `${classroom.name} · ${formatDate(date)} · présence ${presenceRate} %.`,
    });
  }

  const coursesForClass = school.assignments
    .filter((item) => item.classroomIds.includes(classroomId))
    .map((item) => school.courses.find((course) => course.id === item.courseId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const uniqueCourses = [...new Map(coursesForClass.map((item) => [item.id, item])).values()];

  return (
    <div className="space-y-6">
      <div className="no-print space-y-6">
        <PageHeader
          kicker="Surveillant général"
          title="Feuille d’appel"
          description="Pointez la classe du jour : présents ou absents. Les statistiques portent sur tous les appels déjà saisis."
          actions={
            <>
              <Button variant="secondary" size="sm" disabled={!students.length} onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
              <Button size="sm" disabled={!students.length} onClick={save}>
                <ClipboardCheck className="h-4 w-4" />
                Enregistrer l’appel
              </Button>
            </>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Appels aujourd’hui" value={todaySessions.length} icon={CalendarDays} gradient="brand" />
          <StatCard label="Présents (feuille)" value={totals.present} icon={CheckCheck} gradient="mint" />
          <StatCard
            label="Absents"
            value={totals.absent}
            icon={Users}
            gradient="blush"
          />
          <StatCard
            label="Taux de présence"
            value={`${presenceRate} %`}
            hint={`Saisie ${done} % terminée`}
            icon={ClipboardCheck}
            gradient="brand"
          />
        </section>

        <Card>
          <CardHead
            title="Paramètres de la feuille"
            subtitle="Classe, date et cours concernés"
            icon={CalendarDays}
            gradient="brand"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label="Classe">
              <Select value={classroomId} onChange={(event) => setClassroomId(event.target.value)}>
                <option value="">Choisir</option>
                {school.classrooms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.studentIds.length}/{item.quota})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </Field>
            <Field label="Cours (optionnel)" hint="Laissez vide pour un appel général de la classe.">
              <Select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                <option value="">Appel général</option>
                {uniqueCourses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} — {item.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {existing ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              <CheckCheck className="h-4 w-4" />
              Feuille déjà enregistrée le {formatDate(existing.updatedAt.slice(0, 10))} — vous pouvez la corriger.
            </p>
          ) : null}
        </Card>
      </div>

      {classroom ? (
        <Card padded={false}>
          <div className="no-print p-5">
            <CardHead
              title={classroom.name}
              subtitle={`${students.length} élève(s) · ${classroom.roomLabel} · ${
                getCategory(classroom.categoryId)?.code
              } · ${getFiliere(classroom.filiereId)?.name}`}
              icon={Users}
              gradient="mint"
              action={
                <>
                  <Chip tone="mint">{totals.present} présents</Chip>
                  <Chip tone="rose">{totals.absent} absents</Chip>
                  <Button size="sm" variant="secondary" disabled={!students.length} onClick={() => setAll("present")}>
                    Tous présents
                  </Button>
                </>
              }
            />
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Progression de la saisie</span>
                <span className="font-display font-bold text-slate-900">{done} %</span>
              </div>
              <Progress className="mt-1.5" value={done} tone="brand" />
            </div>
          </div>

          <div className="print-only-block mb-6 border-b border-navy-900 px-5 pb-4">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">EPCA — Surveillant général</p>
            <h2 className="mt-1 font-serif text-3xl text-navy-900">{classroom.name}</h2>
            <p className="mt-1 text-sm">
              {formatDate(date)}
              {courseId ? ` · ${school.courses.find((item) => item.id === courseId)?.name}` : " · Appel général"}
            </p>
          </div>

          <div className="px-5 pb-5">
            <CyberTable
              className="shadow-none"
              minWidth="820px"
              empty={
                students.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Classe vide"
                    message="Cette classe n’a pas encore d’étudiants. Répartissez d’abord les admis."
                  />
                ) : null
              }
            >
              <CyberHead>
                <tr>
                  <Th className="w-12">N°</Th>
                  <Th>Étudiant</Th>
                  <Th>Matricule</Th>
                  <Th>Pointage</Th>
                  <Th className="w-28">État</Th>
                </tr>
              </CyberHead>
              <tbody>
                {students.map((item, index) => (
                  <Tr key={item.id}>
                    <Td className="font-mono text-xs text-slate-400">{index + 1}</Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={fullName(item)} size="xs" />
                        <span className="font-medium text-slate-800">{fullName(item)}</span>
                      </div>
                    </Td>
                    <Td className="font-mono text-xs">{item.number}</Td>
                    <Td>
                      <div className="no-print inline-flex rounded-xl bg-slate-100 p-1">
                        {MARKS.map((mark) => {
                          const active = marks[item.id] === mark;
                          return (
                            <button
                              key={mark}
                              type="button"
                              onClick={() => setMarks((current) => ({ ...current, [item.id]: mark }))}
                              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                                active ? MARK_ACTIVE[mark] : "text-slate-500 hover:text-slate-900"
                              }`}
                            >
                              {ATTENDANCE_MARK_LABEL[mark]}
                            </button>
                          );
                        })}
                      </div>
                      <span className="print-only">
                        {marks[item.id] ? ATTENDANCE_MARK_LABEL[marks[item.id]] : "—"}
                      </span>
                    </Td>
                    <Td>
                      {marks[item.id] ? (
                        <AttendanceMarkBadge mark={marks[item.id]} />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </CyberTable>

            <div className="no-print mt-4 max-w-2xl">
              <Field label="Observation du surveillant">
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
              </Field>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={Users}
            title="Aucune classe"
            message="Créez d’abord une salle de classe et répartissez les admis pour pouvoir faire l’appel."
          />
        </Card>
      )}

      <section className="no-print">
        <h2 className="font-display text-base font-bold tracking-tight text-slate-900">Présence par classe</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classStats.map((item) => (
            <Card key={item.classroom.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-slate-900">{item.classroom.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {item.classroom.studentIds.length} élève(s) · {item.sessions} appel(s)
                  </p>
                </div>
                <span className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
                  {item.rate == null ? "—" : `${item.rate} %`}
                </span>
              </div>
              <Progress
                className="mt-4"
                value={item.rate ?? 0}
                tone={item.rate != null && item.rate >= 80 ? "mint" : item.rate != null && item.rate >= 60 ? "sunset" : "blush"}
              />
              <p className="mt-2 text-xs text-slate-400">Présence cumulée sur les appels enregistrés</p>
            </Card>
          ))}
          {classStats.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <EmptyState icon={Users} title="Pas encore de classe" />
            </Card>
          ) : null}
        </div>
      </section>

      <section className="no-print">
        <h2 className="font-display text-base font-bold tracking-tight text-slate-900">Historique des appels</h2>
        <div className="mt-3">
          <CyberTable
            minWidth="720px"
            empty={
              school.sessions.length === 0 ? (
                <EmptyState icon={History} title="Aucun appel enregistré" />
              ) : null
            }
          >
            <CyberHead>
              <tr>
                <Th>Date</Th>
                <Th>Classe</Th>
                <Th>Cours</Th>
                <Th>Présence</Th>
                <Th>Par</Th>
              </tr>
            </CyberHead>
            <tbody>
              {[...school.sessions]
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((session) => (
                  <HistoryRow
                    key={session.id}
                    session={session}
                    classroomName={school.classrooms.find((item) => item.id === session.classroomId)?.name ?? "—"}
                    courseName={
                      session.courseId
                        ? (school.courses.find((item) => item.id === session.courseId)?.name ?? "—")
                        : "Appel général"
                    }
                    onDelete={() =>
                      void confirm({
                        title: "Supprimer cet appel ?",
                        message: "Les pointages de cette feuille seront perdus.",
                        confirmLabel: "Supprimer",
                        danger: true,
                      }).then((ok) => {
                        if (!ok) return;
                        deleteAttendanceSession(session.id);
                        toast({ tone: "danger", title: "Appel supprimé" });
                      })
                    }
                  />
                ))}
            </tbody>
          </CyberTable>
        </div>
      </section>
    </div>
  );
}

function HistoryRow({
  session,
  classroomName,
  courseName,
  onDelete,
}: {
  session: AttendanceSession;
  classroomName: string;
  courseName: string;
  onDelete: () => void;
}) {
  const ids = Object.keys(session.marks);
  const present = ids.filter((id) => session.marks[id] === "present").length;
  const rate = ids.length ? Math.round((present / ids.length) * 100) : 0;
  return (
    <Tr>
      <Td className="whitespace-nowrap font-medium text-slate-700">{formatDate(session.date)}</Td>
      <Td className="font-display font-semibold text-slate-900">{classroomName}</Td>
      <Td>{courseName}</Td>
      <Td>
        <div className="flex items-center gap-3">
          <Progress className="w-24" value={rate} tone={rate >= 80 ? "mint" : rate >= 60 ? "sunset" : "blush"} />
          <span className="whitespace-nowrap text-xs font-semibold text-slate-600">
            {present}/{ids.length} · {rate} %
          </span>
        </div>
      </Td>
      <Td>
        <div className="flex items-center justify-between gap-2">
          <Chip tone="slate">Surveillant général</Chip>
          <button
            type="button"
            className="text-xs font-semibold text-rose-500 transition-colors hover:text-rose-700"
            onClick={onDelete}
          >
            Retirer
          </button>
        </div>
      </Td>
    </Tr>
  );
}
