import { CyberHead, CyberTable, Td, Th, Tr } from "@/components/admin/CyberTable";
import { IconButton } from "@/components/admin/IconButton";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import {
  Avatar,
  AvatarStack,
  Card,
  CardHead,
  Chip,
  EmptyState,
  PageHeader,
  Progress,
  StatCard,
} from "@/components/ui/Surface";
import type { Gradient } from "@/components/ui/Surface";
import { getApplicationById } from "@/lib/applications-store";
import { getCategories, getCategory, getFiliere, getFilieresForCategory } from "@/lib/catalog";
import {
  assignStudentsToClassroom,
  createClassroom,
  deleteClassroom,
  fillClassroomQuota,
  removeStudentFromClassroom,
  unassignedAdmittedIds,
} from "@/lib/school-store";
import { fullName } from "@/lib/roster";
import { useApplications, useSchool } from "@/lib/use-live-data";
import { useSelection } from "@/lib/use-selection";
import type { Application, Classroom } from "@/types/domain";
import { Plus, School, Trash2, UserPlus, Users, X } from "lucide-react";
import { useMemo, useState } from "react";

const CARD_GRADIENT: Gradient = "brand";

function peopleOf(ids: string[]): Application[] {
  return ids.map((id) => getApplicationById(id)).filter((item): item is Application => Boolean(item));
}

export function AdminClassroomsPage() {
  const { confirm, toast } = useFeedback();
  const applications = useApplications();
  const school = useSchool();
  const admitted = applications.filter((item) => item.status === "ADMIS");
  const [selectedId, setSelectedId] = useState(school.classrooms[0]?.id ?? "");
  const selected = school.classrooms.find((item) => item.id === selectedId) ?? school.classrooms[0] ?? null;

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("Classe B1 1");
  const [roomLabel, setRoomLabel] = useState("Salle 1");
  const [quota, setQuota] = useState(30);
  const [categoryId, setCategoryId] = useState(getCategories()[0]?.id ?? "");
  const [filiereId, setFiliereId] = useState(getFilieresForCategory(getCategories()[0]?.id ?? "")[0]?.id ?? "");

  const assignedIds = useMemo(
    () => new Set(school.classrooms.flatMap((item) => item.studentIds)),
    [school.classrooms],
  );
  const pool = useMemo(() => {
    if (!selected) return [];
    return admitted.filter(
      (item) =>
        !assignedIds.has(item.id) &&
        item.categoryId === selected.categoryId &&
        item.filiereId === selected.filiereId,
    );
  }, [admitted, assignedIds, selected]);
  const roster = selected ? peopleOf(selected.studentIds) : [];
  const selection = useSelection(pool.map((item) => item.id));
  const remaining = selected ? Math.max(0, selected.quota - selected.studentIds.length) : 0;
  const unassignedTotal = unassignedAdmittedIds(admitted.map((item) => item.id)).length;
  const freeSeats = school.classrooms.reduce(
    (sum, item) => sum + Math.max(0, item.quota - item.studentIds.length),
    0,
  );

  function create() {
    if (!name.trim() || quota < 1 || !categoryId || !filiereId) return;
    const item = createClassroom({
      name: name.trim(),
      roomLabel: roomLabel.trim(),
      quota,
      categoryId,
      filiereId,
    });
    setSelectedId(item.id);
    setFormOpen(false);
    toast({ tone: "success", title: "Classe créée", message: `${item.name} · quota ${item.quota}` });
  }

  async function removeClass(item: Classroom) {
    const ok = await confirm({
      title: `Supprimer ${item.name} ?`,
      message: "Les étudiants redeviennent disponibles pour une autre classe. Les appels de cette salle sont retirés.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    deleteClassroom(item.id);
    if (selectedId === item.id) setSelectedId(school.classrooms.find((row) => row.id !== item.id)?.id ?? "");
    toast({ tone: "danger", title: "Classe supprimée" });
  }

  function dispatchSelected() {
    if (!selected || !selection.count) return;
    const take = selection.visibleSelected.slice(0, remaining);
    assignStudentsToClassroom(selected.id, take);
    selection.clear();
    toast({
      tone: "success",
      title: "Étudiants affectés",
      message: `${take.length} admis placé(s) dans ${selected.name}.`,
    });
  }

  function fill() {
    if (!selected) return;
    const added = fillClassroomQuota(
      selected.id,
      pool.map((item) => item.id),
    );
    toast({
      tone: added ? "success" : "info",
      title: added ? "Quota complété" : "Aucun siège libre",
      message: added
        ? `${added} étudiant(s) ajouté(s) automatiquement.`
        : "La classe est déjà pleine ou le vivier est vide.",
    });
  }

  const filieres = getFilieresForCategory(categoryId);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Formation"
        title="Salles de classe"
        description="Créez les classes de la promotion, fixez le quota, puis répartissez les admis du concours. Un étudiant n’appartient qu’à une seule classe."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Créer une classe
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Classes ouvertes" value={school.classrooms.length} icon={School} gradient="brand" />
        <StatCard label="Admis à placer" value={unassignedTotal} icon={UserPlus} gradient="sunset" />
        <StatCard label="Places restantes" value={freeSeats} icon={Users} gradient="brand" />
        <StatCard
          label="Étudiants en classe"
          value={school.classrooms.reduce((sum, item) => sum + item.studentIds.length, 0)}
          icon={Users}
          gradient="mint"
        />
      </section>

      <section>
        <h2 className="font-display text-base font-bold tracking-tight text-slate-900">Toutes les classes</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {school.classrooms.map((item) => {
            const ratio = item.quota ? Math.min(100, Math.round((item.studentIds.length / item.quota) * 100)) : 0;
            const active = selected?.id === item.id;
            const gradient = CARD_GRADIENT;
            const names = peopleOf(item.studentIds).map((person) => fullName(person));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`overflow-hidden rounded-2xl border bg-white text-left shadow-card transition-all hover:-translate-y-0.5 ${
                  active ? "border-brand-400 ring-4 ring-brand-500/10" : "border-hairline hover:border-brand-200"
                }`}
              >
                <div className={`relative h-24 px-5 py-4 text-white grad-${gradient}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-lg font-extrabold tracking-tight">{item.name}</p>
                      <p className="mt-0.5 truncate text-xs text-white/75">
                        {item.roomLabel} · {getCategory(item.categoryId)?.code}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">
                      {item.studentIds.length}/{item.quota}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="truncate text-xs font-medium text-slate-500">{getFiliere(item.filiereId)?.name}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Remplissage</span>
                    <span className="font-display font-bold text-slate-900">{ratio} %</span>
                  </div>
                  <Progress className="mt-1.5" value={ratio} tone={ratio >= 100 ? "mint" : gradient} />
                  <div className="mt-4 flex items-center justify-between">
                    <AvatarStack names={names} max={5} size="xs" />
                    <Chip tone={ratio >= 100 ? "mint" : "slate"}>
                      {Math.max(0, item.quota - item.studentIds.length)} libre(s)
                    </Chip>
                  </div>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 p-6 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Plus className="h-6 w-6" />
            </span>
            <span className="font-display text-sm font-bold text-slate-700">Nouvelle classe</span>
            <span className="text-xs text-slate-400">Nom, salle, quota, catégorie et filière</span>
          </button>
        </div>
      </section>

      {selected ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card padded={false}>
            <div className="p-5">
              <CardHead
                title={`Effectif · ${selected.name}`}
                subtitle={`${roster.length} étudiant(s) · ${remaining} place(s) libre(s)`}
                icon={Users}
                gradient="mint"
                action={
                  <>
                    <Button size="sm" variant="secondary" disabled={!pool.length || remaining === 0} onClick={fill}>
                      <Users className="h-4 w-4" />
                      Remplir le quota
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void removeClass(selected)}>
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  </>
                }
              />
            </div>
            <div className="px-5 pb-5">
              <CyberTable
                className="shadow-none"
                minWidth="520px"
                empty={
                  roster.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="Aucun étudiant affecté"
                      message="Sélectionnez des admis dans le vivier pour remplir cette classe."
                    />
                  ) : null
                }
              >
                <CyberHead>
                  <tr>
                    <Th>Étudiant</Th>
                    <Th>Matricule</Th>
                    <Th>Filière</Th>
                    <Th className="w-16">Retirer</Th>
                  </tr>
                </CyberHead>
                <tbody>
                  {roster.map((item) => (
                    <Tr key={item.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={fullName(item)} size="xs" />
                          <span className="font-medium text-slate-800">{fullName(item)}</span>
                        </div>
                      </Td>
                      <Td className="font-mono text-xs">{item.number}</Td>
                      <Td>{getFiliere(item.filiereId)?.name}</Td>
                      <Td>
                        <IconButton
                          label="Retirer"
                          tone="danger"
                          onClick={() => {
                            removeStudentFromClassroom(selected.id, item.id);
                            toast({ tone: "info", title: `${fullName(item)} retiré(e) de la classe` });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </CyberTable>
            </div>
          </Card>

          <Card padded={false}>
            <div className="p-5">
              <CardHead
                title="Vivier des admis"
                subtitle={`${pool.length} disponible(s) · ${selection.count} sélectionné(s)`}
                icon={UserPlus}
                gradient="brand"
                action={
                  <Button size="sm" disabled={!selection.count || remaining === 0} onClick={dispatchSelected}>
                    <UserPlus className="h-4 w-4" />
                    Affecter ({selection.count})
                  </Button>
                }
              />
            </div>
            <div className="px-5 pb-5">
              <CyberTable
                className="shadow-none"
                minWidth="520px"
                empty={
                  pool.length === 0 ? (
                    <EmptyState
                      icon={UserPlus}
                      title="Vivier vide"
                      message="Tous les admis de cette catégorie et filière sont déjà en classe, ou le quota est atteint."
                    />
                  ) : null
                }
              >
                <CyberHead>
                  <tr>
                    <Th className="w-10">
                      <input
                        type="checkbox"
                        checked={selection.allVisibleSelected}
                        onChange={selection.toggleAllVisible}
                        aria-label="Tout sélectionner"
                        className="h-4 w-4 rounded accent-indigo-500"
                      />
                    </Th>
                    <Th>Étudiant</Th>
                    <Th>Matricule</Th>
                    <Th>Catégorie</Th>
                  </tr>
                </CyberHead>
                <tbody>
                  {pool.map((item) => (
                    <Tr key={item.id}>
                      <Td>
                        <input
                          type="checkbox"
                          checked={selection.selected.has(item.id)}
                          onChange={() => selection.toggle(item.id)}
                          className="h-4 w-4 rounded accent-indigo-500"
                        />
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={fullName(item)} size="xs" />
                          <span className="font-medium text-slate-800">{fullName(item)}</span>
                        </div>
                      </Td>
                      <Td className="font-mono text-xs">{item.number}</Td>
                      <Td>{getCategory(item.categoryId)?.code}</Td>
                    </Tr>
                  ))}
                </tbody>
              </CyberTable>
            </div>
          </Card>
        </div>
      ) : null}

      {formOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Fermer"
            onClick={() => setFormOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="dialog-pop relative w-full max-w-2xl overflow-hidden rounded-2xl border border-hairline bg-white shadow-float"
          >
            <div className="grad-brand flex items-start justify-between gap-4 p-5 text-white">
              <div>
                <p className="font-display text-lg font-extrabold tracking-tight">Nouvelle classe</p>
                <p className="mt-0.5 text-sm text-white/75">
                  Les admis proposés dépendront de la catégorie et de la filière choisies.
                </p>
              </div>
              <button
                type="button"
                className="text-white/70 transition-colors hover:text-white"
                aria-label="Fermer"
                onClick={() => setFormOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Intitulé">
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <Field label="Salle">
                <Input value={roomLabel} onChange={(event) => setRoomLabel(event.target.value)} />
              </Field>
              <Field label="Quota">
                <Input
                  type="number"
                  min={1}
                  value={quota}
                  onChange={(event) => setQuota(Math.max(1, Number(event.target.value) || 1))}
                />
              </Field>
              <Field label="Catégorie">
                <Select
                  value={categoryId}
                  onChange={(event) => {
                    const next = event.target.value;
                    setCategoryId(next);
                    setFiliereId(getFilieresForCategory(next)[0]?.id ?? "");
                  }}
                >
                  {getCategories().map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Filière" className="sm:col-span-2">
                <Select value={filiereId} onChange={(event) => setFiliereId(event.target.value)}>
                  {filieres.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-hairline bg-slate-50 px-5 py-4">
              <Button variant="secondary" onClick={() => setFormOpen(false)}>
                Annuler
              </Button>
              <Button onClick={create}>
                <School className="h-4 w-4" />
                Créer la classe
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
