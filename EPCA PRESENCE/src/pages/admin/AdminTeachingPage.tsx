import { CyberHead, CyberTable, Td, Th, Tr } from "@/components/admin/CyberTable";
import { IconButton } from "@/components/admin/IconButton";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Avatar, Card, CardHead, Chip, EmptyState, PageHeader, StatCard } from "@/components/ui/Surface";
import { getCategory, getFiliere } from "@/lib/catalog";
import {
  createAssignment,
  createCourse,
  createTeacher,
  deleteAssignment,
  deleteCourse,
  deleteTeacher,
  teacherFullName,
} from "@/lib/school-store";
import { useSchool } from "@/lib/use-live-data";
import { BookOpen, Check, Link2, School, Trash2, UserRound, Users } from "lucide-react";
import { useState } from "react";

export function AdminTeachingPage() {
  const { confirm, toast } = useFeedback();
  const school = useSchool();

  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstNames, setFirstNames] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+241 00 00 00 00");
  const [teacherId, setTeacherId] = useState(school.teachers[0]?.id ?? "");
  const [courseId, setCourseId] = useState(school.courses[0]?.id ?? "");
  const [classroomIds, setClassroomIds] = useState<string[]>([]);

  function addCourse() {
    if (!courseCode.trim() || !courseName.trim()) return;
    createCourse({ code: courseCode.trim().toUpperCase(), name: courseName.trim() });
    setCourseCode("");
    setCourseName("");
    toast({ tone: "success", title: "Cours ajouté" });
  }

  function addTeacher() {
    if (!lastName.trim() || !firstNames.trim()) return;
    const item = createTeacher({
      lastName: lastName.trim().toUpperCase(),
      firstNames: firstNames.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    setLastName("");
    setFirstNames("");
    setEmail("");
    setTeacherId(item.id);
    toast({ tone: "success", title: "Enseignant enregistré" });
  }

  function assign() {
    if (!teacherId || !courseId || classroomIds.length === 0) return;
    createAssignment({ teacherId, courseId, classroomIds });
    setClassroomIds([]);
    toast({
      tone: "success",
      title: "Attribution enregistrée",
      message: "L’enseignant est rattaché au cours pour les salles choisies.",
    });
  }

  function toggleClassroom(id: string) {
    setClassroomIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Formation"
        title="Cours & enseignants"
        description="Ajoutez les matières et les enseignants, puis attribuez un enseignant à un cours pour une ou plusieurs classes. L’appel du surveillant général s’appuie sur ces rattachements."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cours au programme" value={school.courses.length} icon={BookOpen} gradient="brand" />
        <StatCard label="Enseignants" value={school.teachers.length} icon={UserRound} gradient="brand" />
        <StatCard label="Attributions" value={school.assignments.length} icon={Link2} gradient="mint" />
        <StatCard label="Classes couvertes" value={school.classrooms.length} icon={School} gradient="brand" />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHead title="Cours" subtitle="Matières enseignées dans la promotion" icon={BookOpen} />
          <div className="mt-5 grid gap-3 sm:grid-cols-[130px_1fr_auto] sm:items-end">
            <Field label="Code">
              <Input value={courseCode} onChange={(event) => setCourseCode(event.target.value)} placeholder="ORG-01" />
            </Field>
            <Field label="Intitulé">
              <Input
                value={courseName}
                onChange={(event) => setCourseName(event.target.value)}
                placeholder="Organisation administrative"
              />
            </Field>
            <Button onClick={addCourse}>Ajouter</Button>
          </div>
          <ul className="mt-5 space-y-2">
            {school.courses.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-hairline px-3 py-2.5 transition-colors hover:border-brand-200"
              >
                <span className="grad-brand grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="font-mono text-xs text-slate-400">{item.code}</p>
                </div>
                <IconButton
                  label="Supprimer"
                  tone="danger"
                  onClick={() =>
                    void confirm({
                      title: `Retirer ${item.name} ?`,
                      message: "Les attributions et appels liés à ce cours seront aussi retirés.",
                      confirmLabel: "Supprimer",
                      danger: true,
                    }).then((ok) => {
                      if (!ok) return;
                      deleteCourse(item.id);
                      toast({ tone: "danger", title: "Cours retiré" });
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </li>
            ))}
            {school.courses.length === 0 ? (
              <li>
                <EmptyState icon={BookOpen} title="Aucun cours" message="Ajoutez la première matière du programme." />
              </li>
            ) : null}
          </ul>
        </Card>

        <Card>
          <CardHead title="Enseignants" subtitle="Corps enseignant de l’école" icon={UserRound} gradient="brand" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Nom">
              <Input value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </Field>
            <Field label="Prénom(s)">
              <Input value={firstNames} onChange={(event) => setFirstNames(event.target.value)} />
            </Field>
            <Field label="E-mail">
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="Téléphone">
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
          </div>
          <div className="mt-4">
            <Button onClick={addTeacher}>
              <UserRound className="h-4 w-4" />
              Enregistrer l’enseignant
            </Button>
          </div>
          <ul className="mt-5 space-y-2">
            {school.teachers.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-hairline px-3 py-2.5 transition-colors hover:border-brand-200"
              >
                <Avatar name={teacherFullName(item)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-slate-900">
                    {teacherFullName(item)}
                  </p>
                  <p className="truncate text-xs text-slate-400">{item.email || "e-mail non renseigné"}</p>
                </div>
                <IconButton
                  label="Supprimer"
                  tone="danger"
                  onClick={() =>
                    void confirm({
                      title: `Retirer ${teacherFullName(item)} ?`,
                      message: "Ses attributions de cours seront supprimées.",
                      confirmLabel: "Supprimer",
                      danger: true,
                    }).then((ok) => {
                      if (!ok) return;
                      deleteTeacher(item.id);
                      toast({ tone: "danger", title: "Enseignant retiré" });
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </li>
            ))}
            {school.teachers.length === 0 ? (
              <li>
                <EmptyState icon={UserRound} title="Aucun enseignant" message="Enregistrez le premier intervenant." />
              </li>
            ) : null}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHead
          title="Attribuer un enseignant"
          subtitle="Un même enseignant peut assurer un cours dans plusieurs salles, ou plusieurs cours."
          icon={Link2}
          gradient="brand"
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Enseignant">
            <Select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
              <option value="">Choisir</option>
              {school.teachers.map((item) => (
                <option key={item.id} value={item.id}>
                  {teacherFullName(item)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cours">
            <Select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <option value="">Choisir</option>
              {school.courses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <p className="mt-5 text-[13px] font-semibold text-slate-700">Classes concernées</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {school.classrooms.map((item) => {
            const active = classroomIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleClassroom(item.id)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                  active
                    ? "border-brand-400 bg-brand-50 ring-4 ring-brand-500/10"
                    : "border-hairline bg-white hover:border-brand-200"
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    active ? "grad-brand text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {active ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-sm font-semibold text-slate-900">
                    {item.name}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {getCategory(item.categoryId)?.code} · {getFiliere(item.filiereId)?.name}
                  </span>
                </span>
              </button>
            );
          })}
          {school.classrooms.length === 0 ? (
            <p className="text-sm text-slate-400">Créez d’abord des classes.</p>
          ) : null}
        </div>

        <div className="mt-5">
          <Button disabled={!teacherId || !courseId || classroomIds.length === 0} onClick={assign}>
            <Link2 className="h-4 w-4" />
            Enregistrer l’attribution
          </Button>
        </div>
      </Card>

      <section>
        <h2 className="font-display text-base font-bold tracking-tight text-slate-900">Attributions en cours</h2>
        <div className="mt-3">
          <CyberTable
            minWidth="760px"
            empty={
              school.assignments.length === 0 ? (
                <EmptyState
                  icon={Link2}
                  title="Aucune attribution"
                  message="Reliez un enseignant à un cours et à ses classes."
                />
              ) : null
            }
          >
            <CyberHead>
              <tr>
                <Th>Enseignant</Th>
                <Th>Cours</Th>
                <Th>Classes</Th>
                <Th className="w-16">Retirer</Th>
              </tr>
            </CyberHead>
            <tbody>
              {school.assignments.map((item) => {
                const teacher = school.teachers.find((row) => row.id === item.teacherId);
                const course = school.courses.find((row) => row.id === item.courseId);
                const rooms = school.classrooms.filter((row) => item.classroomIds.includes(row.id));
                return (
                  <Tr key={item.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        {teacher ? <Avatar name={teacherFullName(teacher)} size="xs" /> : null}
                        <span className="font-medium text-slate-800">
                          {teacher ? teacherFullName(teacher) : "—"}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <span className="font-medium text-slate-800">{course?.name ?? "—"}</span>
                      <span className="mt-0.5 block font-mono text-xs text-slate-400">{course?.code}</span>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {rooms.map((row) => (
                          <Chip key={row.id} tone="brand">
                            {row.name}
                          </Chip>
                        ))}
                        {rooms.length === 0 ? <span className="text-slate-300">—</span> : null}
                      </div>
                    </Td>
                    <Td>
                      <IconButton
                        label="Supprimer"
                        tone="danger"
                        onClick={() => {
                          deleteAssignment(item.id);
                          toast({ tone: "info", title: "Attribution retirée" });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </CyberTable>
        </div>
      </section>
    </div>
  );
}
