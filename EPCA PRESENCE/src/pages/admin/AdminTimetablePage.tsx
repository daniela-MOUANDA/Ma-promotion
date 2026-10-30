import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Card, CardHead, EmptyState, PageHeader, Progress, StatCard } from "@/components/ui/Surface";
import { getCategory, getFiliere, getFilieres } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import {
  DAY_LABELS,
  DEFAULT_DAYS,
  DEFAULT_SLOTS,
  deleteTimetable,
  findTimetable,
  generateTimetable,
  saveTimetable,
  teacherBusyAt,
  teacherFullName,
} from "@/lib/school-store";
import { useSchool } from "@/lib/use-live-data";
import type { ScheduleEntry, ScheduleSlot, Timetable } from "@/types/domain";
import {
  CalendarDays,
  Clock,
  Layers,
  Plus,
  Printer,
  RefreshCw,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const ALL_DAYS = [1, 2, 3, 4, 5, 6];

function mondayOf(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

function dayDate(weekStart: string, day: number) {
  const date = new Date(`${weekStart}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + (day - 1));
  return date.toISOString().slice(0, 10);
}

function hoursOf(slot: ScheduleSlot) {
  const [sh, sm] = slot.start.split(":").map(Number);
  const [eh, em] = slot.end.split(":").map(Number);
  const minutes = eh * 60 + em - (sh * 60 + sm);
  return Number.isFinite(minutes) ? Math.max(0, minutes) / 60 : 0;
}

export function AdminTimetablePage() {
  const { confirm, toast } = useFeedback();
  const school = useSchool();
  const filieres = getFilieres();

  const [filiereId, setFiliereId] = useState("");
  const classrooms = useMemo(
    () => (filiereId ? school.classrooms.filter((item) => item.filiereId === filiereId) : school.classrooms),
    [filiereId, school.classrooms],
  );

  const [classroomId, setClassroomId] = useState(school.classrooms[0]?.id ?? "");
  const classroom = school.classrooms.find((item) => item.id === classroomId) ?? classrooms[0] ?? null;

  const [weekStart, setWeekStart] = useState(mondayOf(new Date().toISOString().slice(0, 10)));
  const [days, setDays] = useState<number[]>(DEFAULT_DAYS);
  const [slots, setSlots] = useState<ScheduleSlot[]>(DEFAULT_SLOTS);
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [cell, setCell] = useState<{ day: number; slotIndex: number } | null>(null);

  const timetable = classroom ? findTimetable(classroom.id, weekStart) : undefined;
  const activeDays = timetable?.days ?? days;
  const activeSlots = timetable?.slots ?? slots;

  const classCourses = useMemo(() => {
    if (!classroom) return [];
    const list = school.assignments
      .filter((item) => item.classroomIds.includes(classroom.id))
      .map((item) => ({
        course: school.courses.find((row) => row.id === item.courseId),
        teacher: school.teachers.find((row) => row.id === item.teacherId),
      }))
      .filter((item) => Boolean(item.course));
    return [...new Map(list.map((item) => [item.course!.id, item])).values()];
  }, [classroom, school.assignments, school.courses, school.teachers]);

  const entryAt = (day: number, slotIndex: number): ScheduleEntry | undefined =>
    timetable?.entries.find((item) => item.day === day && item.slotIndex === slotIndex);

  const weeklyHours = timetable
    ? timetable.entries.reduce((sum, entry) => sum + hoursOf(activeSlots[entry.slotIndex] ?? { start: "0:0", end: "0:0" }), 0)
    : 0;

  const perCourse = useMemo(() => {
    if (!timetable) return [];
    const map = new Map<string, number>();
    for (const entry of timetable.entries) {
      map.set(entry.courseId, (map.get(entry.courseId) ?? 0) + hoursOf(activeSlots[entry.slotIndex] ?? { start: "0:0", end: "0:0" }));
    }
    return [...map.entries()]
      .map(([courseId, hours]) => ({
        course: school.courses.find((item) => item.id === courseId),
        hours,
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [timetable, activeSlots, school.courses]);

  const conflicts = useMemo(() => {
    if (!timetable || !classroom) return 0;
    return timetable.entries.filter(
      (entry) =>
        entry.teacherId && teacherBusyAt(weekStart, entry.day, entry.slotIndex, entry.teacherId, classroom.id),
    ).length;
  }, [timetable, classroom, weekStart]);

  function generate() {
    if (!classroom) return;
    if (classCourses.length === 0) {
      toast({
        tone: "danger",
        title: "Aucun cours attribué",
        message: "Attribuez d’abord des enseignants et des cours à cette classe.",
      });
      return;
    }
    const table = generateTimetable({
      classroomId: classroom.id,
      weekStart,
      label: `${classroom.name} — semaine du ${formatDate(weekStart)}`,
      days,
      slots,
      room: classroom.roomLabel,
      courseIds: moduleIds.length ? moduleIds : undefined,
    });
    toast({
      tone: "success",
      title: "Emploi du temps généré",
      message: `${table.entries.length} séance(s) placée(s) pour ${classroom.name}.`,
    });
  }

  function generateForFiliere() {
    const target = filiereId ? school.classrooms.filter((item) => item.filiereId === filiereId) : [];
    if (!target.length) {
      toast({ tone: "info", title: "Choisissez une filière", message: "Aucune classe pour cette filière." });
      return;
    }
    let placed = 0;
    for (const item of target) {
      const table = generateTimetable({
        classroomId: item.id,
        weekStart,
        label: `${item.name} — semaine du ${formatDate(weekStart)}`,
        days,
        slots,
        room: item.roomLabel,
      });
      placed += table.entries.length;
    }
    toast({
      tone: "success",
      title: "Emplois du temps générés",
      message: `${target.length} classe(s) · ${placed} séance(s) au total.`,
    });
  }

  function upsertEntry(next: Omit<ScheduleEntry, "id">) {
    if (!classroom) return;
    const base: Timetable = timetable ?? {
      id: crypto.randomUUID(),
      classroomId: classroom.id,
      label: `${classroom.name} — semaine du ${formatDate(weekStart)}`,
      weekStart,
      days,
      slots,
      entries: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const existing = base.entries.find(
      (item) => item.day === next.day && item.slotIndex === next.slotIndex,
    );
    const entries = existing
      ? base.entries.map((item) => (item.id === existing.id ? { ...item, ...next } : item))
      : [...base.entries, { ...next, id: crypto.randomUUID() }];
    saveTimetable({ ...base, entries });
  }

  function clearEntry(day: number, slotIndex: number) {
    if (!timetable) return;
    saveTimetable({
      ...timetable,
      entries: timetable.entries.filter((item) => !(item.day === day && item.slotIndex === slotIndex)),
    });
  }

  async function removeTable() {
    if (!timetable) return;
    const ok = await confirm({
      title: "Supprimer cet emploi du temps ?",
      message: "La grille de la semaine sera effacée pour cette classe.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    deleteTimetable(timetable.id);
    toast({ tone: "danger", title: "Emploi du temps supprimé" });
  }

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort(),
    );
  }

  function toggleModule(id: string) {
    setModuleIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <div className="space-y-6">
      <div className="no-print space-y-6">
        <PageHeader
          kicker="Formation"
          title="Emplois du temps"
          description="Générez la grille hebdomadaire d’une classe à partir des cours et des enseignants attribués, ajustez chaque créneau, puis imprimez."
          actions={
            <>
              <Button variant="secondary" size="sm" disabled={!timetable} onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
              <Button size="sm" disabled={!classroom} onClick={generate}>
                <Sparkles className="h-4 w-4" />
                {timetable ? "Régénérer" : "Générer"}
              </Button>
            </>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Séances placées"
            value={timetable?.entries.length ?? 0}
            icon={CalendarDays}
            gradient="brand"
          />
          <StatCard
            label="Heures hebdomadaires"
            value={`${weeklyHours.toFixed(1)} h`}
            icon={Clock}
            gradient="brand"
          />
          <StatCard label="Modules couverts" value={perCourse.length} icon={Layers} gradient="mint" />
          <StatCard
            label="Conflits enseignants"
            value={conflicts}
            hint={conflicts ? "Un enseignant est pris ailleurs" : "Aucun chevauchement"}
            icon={TriangleAlert}
            gradient={conflicts ? "blush" : "brand"}
          />
        </section>

        <Card>
          <CardHead
            title="Paramètres de génération"
            subtitle="Filière, classe, semaine, jours et créneaux horaires"
            icon={CalendarDays}
          />

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <Field label="Filière">
              <Select
                value={filiereId}
                onChange={(event) => {
                  const next = event.target.value;
                  setFiliereId(next);
                  const first = next
                    ? school.classrooms.find((item) => item.filiereId === next)
                    : school.classrooms[0];
                  if (first) setClassroomId(first.id);
                }}
              >
                <option value="">Toutes les filières</option>
                {filieres.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Classe">
              <Select value={classroom?.id ?? ""} onChange={(event) => setClassroomId(event.target.value)}>
                <option value="">Choisir</option>
                {classrooms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.roomLabel}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Semaine du" hint="La date est ramenée au lundi.">
              <Input
                type="date"
                value={weekStart}
                onChange={(event) => setWeekStart(mondayOf(event.target.value))}
              />
            </Field>
            <Field label="Filière ciblée">
              <Button variant="secondary" className="w-full" disabled={!filiereId} onClick={generateForFiliere}>
                <RefreshCw className="h-4 w-4" />
                Générer toute la filière
              </Button>
            </Field>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-[13px] font-semibold text-slate-700">Jours ouvrés</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => {
                  const active = days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors ${
                        active
                          ? "bg-brand-500 text-white"
                          : "border border-hairline bg-white text-slate-500 hover:border-brand-200"
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>

              <p className="mt-5 text-[13px] font-semibold text-slate-700">
                Modules à inclure
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {moduleIds.length ? `${moduleIds.length} sélectionné(s)` : "tous les cours attribués"}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {classCourses.map(({ course }) => {
                  const active = moduleIds.includes(course!.id);
                  return (
                    <button
                      key={course!.id}
                      type="button"
                      onClick={() => toggleModule(course!.id)}
                      className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                        active ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {course!.code}
                    </button>
                  );
                })}
                {classCourses.length === 0 ? (
                  <span className="text-sm text-slate-400">
                    Aucun cours attribué à cette classe — passez par « Cours & enseignants ».
                  </span>
                ) : null}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-slate-700">Créneaux horaires</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSlots((current) => [...current, { start: "18:30", end: "20:30" }])}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {slots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 text-xs font-semibold text-slate-400">S{index + 1}</span>
                    <Input
                      type="time"
                      value={slot.start}
                      onChange={(event) =>
                        setSlots((current) =>
                          current.map((item, i) => (i === index ? { ...item, start: event.target.value } : item)),
                        )
                      }
                    />
                    <Input
                      type="time"
                      value={slot.end}
                      onChange={(event) =>
                        setSlots((current) =>
                          current.map((item, i) => (i === index ? { ...item, end: event.target.value } : item)),
                        )
                      }
                    />
                    <button
                      type="button"
                      aria-label="Retirer le créneau"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => setSlots((current) => current.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {classroom ? (
        <>
          <div className="print-only-block mb-4">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">EPCA — Emploi du temps</p>
            <h2 className="mt-1 font-serif text-3xl text-navy-900">{classroom.name}</h2>
            <p className="mt-1 text-sm">
              Semaine du {formatDate(weekStart)} · {classroom.roomLabel} ·{" "}
              {getCategory(classroom.categoryId)?.code} · {getFiliere(classroom.filiereId)?.name}
            </p>
          </div>

          <Card padded={false}>
            <div className="no-print p-5">
              <CardHead
                title={`Grille · ${classroom.name}`}
                subtitle={`Semaine du ${formatDate(weekStart)} · ${getFiliere(classroom.filiereId)?.name}`}
                icon={CalendarDays}
                gradient="brand"
                action={
                  timetable ? (
                    <Button size="sm" variant="danger" onClick={() => void removeTable()}>
                      <Trash2 className="h-4 w-4" />
                      Supprimer la semaine
                    </Button>
                  ) : null
                }
              />
            </div>

            {timetable ? (
              <div className="scroll-slim overflow-x-auto px-5 pb-5">
                <table className="w-full border-separate border-spacing-1" style={{ minWidth: "820px" }}>
                  <thead>
                    <tr>
                      <th className="w-28 rounded-lg bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                        Créneau
                      </th>
                      {activeDays.map((day) => (
                        <th
                          key={day}
                          className="rounded-lg bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500"
                        >
                          {DAY_LABELS[day]}
                          <span className="ml-2 font-normal normal-case text-slate-400">
                            {formatDate(dayDate(weekStart, day))}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeSlots.map((slot, slotIndex) => (
                      <tr key={`${slot.start}-${slotIndex}`}>
                        <td className="rounded-lg bg-slate-50 px-3 py-3 align-top">
                          <p className="font-display text-sm font-bold text-slate-900">{slot.start}</p>
                          <p className="text-xs text-slate-400">{slot.end}</p>
                        </td>
                        {activeDays.map((day) => {
                          const entry = entryAt(day, slotIndex);
                          const course = entry ? school.courses.find((item) => item.id === entry.courseId) : null;
                          const teacher = entry
                            ? school.teachers.find((item) => item.id === entry.teacherId)
                            : null;
                          const busy =
                            entry?.teacherId &&
                            teacherBusyAt(weekStart, day, slotIndex, entry.teacherId, classroom.id);
                          return (
                            <td key={day} className="align-top">
                              <button
                                type="button"
                                onClick={() => setCell({ day, slotIndex })}
                                className={`h-full w-full rounded-xl border p-3 text-left transition-all ${
                                  entry
                                    ? busy
                                      ? "border-rose-200 bg-rose-50 hover:border-rose-400"
                                      : "border-brand-100 bg-brand-50 hover:border-brand-400"
                                    : "border-dashed border-slate-200 bg-white hover:border-brand-300"
                                }`}
                              >
                                {entry ? (
                                  <>
                                    <p className="font-display text-sm font-bold text-slate-900">
                                      {course?.name ?? "Cours retiré"}
                                    </p>
                                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">{course?.code}</p>
                                    <p className="mt-2 text-xs text-slate-500">
                                      {teacher ? teacherFullName(teacher) : "Enseignant à désigner"}
                                    </p>
                                    <p className="text-xs text-slate-400">{entry.room || classroom.roomLabel}</p>
                                    {busy ? (
                                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                                        <TriangleAlert className="h-3.5 w-3.5" />
                                        Enseignant occupé
                                      </span>
                                    ) : null}
                                  </>
                                ) : (
                                  <span className="no-print inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                                    <Plus className="h-3.5 w-3.5" />
                                    Placer un cours
                                  </span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={CalendarDays}
                  title="Pas encore d’emploi du temps"
                  message="Choisissez les jours et les créneaux, puis lancez la génération pour cette semaine."
                  action={
                    <Button onClick={generate} disabled={!classroom}>
                      <Sparkles className="h-4 w-4" />
                      Générer la semaine
                    </Button>
                  }
                />
              </div>
            )}
          </Card>

          {perCourse.length ? (
            <Card className="no-print">
              <CardHead title="Volume horaire par module" subtitle="Sur la semaine affichée" icon={Layers} />
              <div className="mt-5 space-y-3">
                {perCourse.map((item) => (
                  <div key={item.course?.id ?? "?"}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {item.course?.name ?? "Cours retiré"}
                        <span className="ml-2 font-mono text-xs text-slate-400">{item.course?.code}</span>
                      </span>
                      <span className="font-display font-bold text-slate-900">{item.hours.toFixed(1)} h</span>
                    </div>
                    <Progress
                      className="mt-2"
                      value={weeklyHours ? Math.round((item.hours / weeklyHours) * 100) : 0}
                      tone="brand"
                    />
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      ) : (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="Aucune classe"
            message="Créez une salle de classe et attribuez-lui des cours pour bâtir un emploi du temps."
          />
        </Card>
      )}

      {cell && classroom ? (
        <CellEditor
          courses={school.courses}
          teachers={school.teachers}
          assignments={school.assignments}
          classroomId={classroom.id}
          defaultRoom={classroom.roomLabel}
          entry={entryAt(cell.day, cell.slotIndex)}
          day={cell.day}
          slotIndex={cell.slotIndex}
          slot={activeSlots[cell.slotIndex]}
          onClose={() => setCell(null)}
          onClear={() => {
            clearEntry(cell.day, cell.slotIndex);
            setCell(null);
            toast({ tone: "info", title: "Créneau libéré" });
          }}
          onSave={(value) => {
            upsertEntry({ ...value, day: cell.day, slotIndex: cell.slotIndex });
            setCell(null);
            toast({ tone: "success", title: "Créneau enregistré" });
          }}
        />
      ) : null}
    </div>
  );
}

function CellEditor({
  courses,
  teachers,
  assignments,
  classroomId,
  defaultRoom,
  entry,
  day,
  slot,
  onClose,
  onClear,
  onSave,
}: {
  courses: { id: string; code: string; name: string }[];
  teachers: { id: string; lastName: string; firstNames: string }[];
  assignments: { courseId: string; teacherId: string; classroomIds: string[] }[];
  classroomId: string;
  defaultRoom: string;
  entry?: ScheduleEntry;
  day: number;
  slotIndex: number;
  slot?: ScheduleSlot;
  onClose: () => void;
  onClear: () => void;
  onSave: (value: { courseId: string; teacherId: string | null; room: string }) => void;
}) {
  const [courseId, setCourseId] = useState(entry?.courseId ?? courses[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(
    entry?.teacherId ??
      assignments.find((item) => item.courseId === courseId && item.classroomIds.includes(classroomId))
        ?.teacherId ??
      "",
  );
  const [room, setRoom] = useState(entry?.room ?? defaultRoom);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="dialog-pop relative w-full max-w-lg overflow-hidden rounded-2xl border border-hairline bg-white shadow-float"
      >
        <div className="grad-brand flex items-start justify-between gap-4 p-5 text-white">
          <div>
            <p className="font-display text-lg font-extrabold tracking-tight">
              {DAY_LABELS[day]} · {slot ? `${slot.start} – ${slot.end}` : "Créneau"}
            </p>
            <p className="mt-0.5 text-sm text-white/70">Choisissez le module, l’enseignant et la salle.</p>
          </div>
          <button type="button" className="text-white/70 hover:text-white" aria-label="Fermer" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <Field label="Module">
            <Select
              value={courseId}
              onChange={(event) => {
                const next = event.target.value;
                setCourseId(next);
                const auto = assignments.find(
                  (item) => item.courseId === next && item.classroomIds.includes(classroomId),
                );
                if (auto) setTeacherId(auto.teacherId);
              }}
            >
              <option value="">Choisir un module</option>
              {courses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Enseignant">
            <Select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
              <option value="">À désigner</option>
              {teachers.map((item) => (
                <option key={item.id} value={item.id}>
                  {teacherFullName(item)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Salle">
            <Input value={room} onChange={(event) => setRoom(event.target.value)} />
          </Field>
        </div>

        <div className="flex flex-wrap justify-between gap-2 border-t border-hairline bg-slate-50 px-5 py-4">
          <Button variant="secondary" onClick={onClear} disabled={!entry}>
            <Trash2 className="h-4 w-4" />
            Libérer le créneau
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button disabled={!courseId} onClick={() => onSave({ courseId, teacherId: teacherId || null, room })}>
              Enregistrer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
