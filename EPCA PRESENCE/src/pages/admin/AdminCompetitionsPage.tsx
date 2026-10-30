import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { CompetitionStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Card, Chip, EmptyState, PageHeader, StatCard } from "@/components/ui/Surface";
import { COMPETITION_STATUS_LABEL } from "@/constants/labels";
import { getCategories, getFilieres } from "@/lib/catalog";
import { createCompetition, deleteCompetition, patchCompetition } from "@/lib/competitions-store";
import { formatDate, formatRange } from "@/lib/format";
import { useApplications, useCompetitions } from "@/lib/use-live-data";
import type { Competition, CompetitionStatus } from "@/types/domain";
import {
  CalendarRange,
  Check,
  ExternalLink,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const STATUSES: CompetitionStatus[] = ["open", "upcoming", "closed"];

interface DraftState {
  id: string | null;
  name: string;
  year: number;
  status: CompetitionStatus;
  opensAt: string;
  closesAt: string;
  examAt: string;
  seats: string;
  summary: string;
  instructions: string;
  categoryIds: string[];
  filiereIds: string[];
}

function emptyDraft(): DraftState {
  const year = new Date().getFullYear();
  return {
    id: null,
    name: `Concours d’entrée ${year}`,
    year,
    status: "upcoming",
    opensAt: `${year}-09-01`,
    closesAt: `${year}-10-15`,
    examAt: "",
    seats: "",
    summary: "",
    instructions: "",
    categoryIds: [],
    filiereIds: [],
  };
}

function draftFrom(item: Competition): DraftState {
  return {
    id: item.id,
    name: item.name,
    year: item.year,
    status: item.status,
    opensAt: item.opensAt.slice(0, 10),
    closesAt: item.closesAt.slice(0, 10),
    examAt: item.examAt?.slice(0, 10) ?? "",
    seats: item.seats == null ? "" : String(item.seats),
    summary: item.summary,
    instructions: item.instructions,
    categoryIds: item.categoryIds,
    filiereIds: item.filiereIds,
  };
}

export function AdminCompetitionsPage() {
  const { confirm, toast } = useFeedback();
  const competitions = useCompetitions();
  const applications = useApplications();
  const categories = getCategories();
  const filieres = getFilieres();

  const [draft, setDraft] = useState<DraftState | null>(null);

  function set<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function toggleIn(key: "categoryIds" | "filiereIds", id: string) {
    setDraft((current) => {
      if (!current) return current;
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
      };
    });
  }

  function save() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.opensAt || !draft.closesAt) {
      toast({ tone: "danger", title: "Champs manquants", message: "Intitulé et période de candidature requis." });
      return;
    }
    const payload = {
      name: draft.name.trim(),
      year: draft.year,
      status: draft.status,
      opensAt: draft.opensAt,
      closesAt: draft.closesAt,
      examAt: draft.examAt || null,
      seats: draft.seats ? Number(draft.seats) : null,
      summary: draft.summary.trim(),
      instructions: draft.instructions.trim(),
      categoryIds: draft.categoryIds,
      filiereIds: draft.filiereIds,
      conditions: [] as string[],
      documents: [] as string[],
      calendar: [] as { label: string; date: string }[],
    };

    if (draft.id) {
      const existing = competitions.find((item) => item.id === draft.id);
      patchCompetition(draft.id, {
        ...payload,
        conditions: existing?.conditions ?? [],
        documents: existing?.documents ?? [],
        calendar: existing?.calendar ?? [],
      });
      toast({ tone: "success", title: "Session mise à jour", message: payload.name });
    } else {
      createCompetition(payload);
      toast({ tone: "success", title: "Session créée", message: payload.name });
    }
    setDraft(null);
  }

  async function remove(item: Competition) {
    const linked = applications.filter((row) => row.competitionId === item.id).length;
    const ok = await confirm({
      title: `Supprimer « ${item.name} » ?`,
      message: linked
        ? `${linked} candidature(s) sont rattachées à cette session. Elles resteront dans la base mais perdront leur session de rattachement.`
        : "La session disparaîtra du portail public et des écrans d’administration.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    deleteCompetition(item.id);
    toast({ tone: "danger", title: "Session supprimée" });
  }

  async function toggleStatus(item: Competition, status: CompetitionStatus) {
    if (status === "open" && competitions.some((row) => row.status === "open" && row.id !== item.id)) {
      const ok = await confirm({
        title: "Ouvrir cette session ?",
        message: "Une autre session est déjà ouverte. Les deux resteront ouvertes ; le portail proposera la première.",
        confirmLabel: "Ouvrir quand même",
      });
      if (!ok) return;
    }
    patchCompetition(item.id, { status });
    toast({ tone: "info", title: `Session ${COMPETITION_STATUS_LABEL[status].toLowerCase()}` });
  }

  const openCount = competitions.filter((item) => item.status === "open").length;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Concours"
        title="Sessions de concours"
        description="Créez, modifiez ou retirez les sessions. Le portail public, le formulaire de candidature et les publications s’appuient sur cette liste."
        actions={
          <Button onClick={() => setDraft(emptyDraft())}>
            <Plus className="h-4 w-4" />
            Nouvelle session
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Sessions enregistrées" value={competitions.length} icon={CalendarRange} gradient="brand" />
        <StatCard label="Sessions ouvertes" value={openCount} icon={Check} gradient="mint" />
        <StatCard label="Candidatures reçues" value={applications.length} icon={FolderOpen} gradient="brand" />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {competitions.map((item) => {
          const count = applications.filter((row) => row.competitionId === item.id).length;
          return (
            <Card key={item.id} padded={false} className="overflow-hidden">
              <div className="grad-brand flex items-start justify-between gap-3 p-5 text-white">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                    Session {item.year}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-extrabold tracking-tight">{item.name}</h2>
                  <p className="mt-1 text-xs text-white/70">{formatRange(item.opensAt, item.closesAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    title="Modifier"
                    aria-label="Modifier"
                    onClick={() => setDraft(draftFrom(item))}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Supprimer"
                    aria-label="Supprimer"
                    onClick={() => void remove(item)}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white transition-colors hover:bg-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <CompetitionStatusBadge status={item.status} />
                  <Chip tone="slate" icon={Users}>
                    {count} candidature(s)
                  </Chip>
                  {item.seats ? <Chip tone="slate">{item.seats} place(s)</Chip> : null}
                  {item.examAt ? <Chip tone="slate">Épreuves : {formatDate(item.examAt)}</Chip> : null}
                </div>

                {item.summary ? <p className="text-sm leading-6 text-slate-500">{item.summary}</p> : null}

                <div className="flex flex-wrap gap-1.5">
                  {item.categoryIds.map((id) => (
                    <Chip key={id} tone="brand">
                      {categories.find((row) => row.id === id)?.code ?? id}
                    </Chip>
                  ))}
                  {item.categoryIds.length === 0 ? (
                    <span className="text-xs text-slate-400">Aucune catégorie rattachée</span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-4">
                  <div className="flex flex-wrap gap-1">
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => void toggleStatus(item, status)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                          item.status === status
                            ? "bg-brand-500 text-white"
                            : "bg-slate-100 text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {COMPETITION_STATUS_LABEL[status]}
                      </button>
                    ))}
                  </div>
                  <Link
                    to={`/concours/${item.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Portail
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}

        {competitions.length === 0 ? (
          <Card className="md:col-span-2">
            <EmptyState
              icon={CalendarRange}
              title="Aucune session"
              message="Créez la première session de concours pour ouvrir les candidatures."
              action={
                <Button onClick={() => setDraft(emptyDraft())}>
                  <Plus className="h-4 w-4" />
                  Nouvelle session
                </Button>
              }
            />
          </Card>
        ) : null}
      </div>

      {draft ? (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 py-10">
          <button
            type="button"
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Fermer"
            onClick={() => setDraft(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="dialog-pop relative w-full max-w-3xl overflow-hidden rounded-2xl border border-hairline bg-white shadow-float"
          >
            <div className="grad-brand flex items-start justify-between gap-4 p-5 text-white">
              <div>
                <p className="font-display text-lg font-extrabold tracking-tight">
                  {draft.id ? "Modifier la session" : "Nouvelle session de concours"}
                </p>
                <p className="mt-0.5 text-sm text-white/70">
                  Ces informations alimentent le portail public et le formulaire de candidature.
                </p>
              </div>
              <button
                type="button"
                className="text-white/70 transition-colors hover:text-white"
                aria-label="Fermer"
                onClick={() => setDraft(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto scroll-slim p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Intitulé" className="sm:col-span-2">
                  <Input value={draft.name} onChange={(event) => set("name", event.target.value)} />
                </Field>
                <Field label="Année">
                  <Input
                    type="number"
                    value={draft.year}
                    onChange={(event) => set("year", Number(event.target.value) || new Date().getFullYear())}
                  />
                </Field>
                <Field label="Statut">
                  <Select
                    value={draft.status}
                    onChange={(event) => set("status", event.target.value as CompetitionStatus)}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {COMPETITION_STATUS_LABEL[status]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Ouverture des candidatures">
                  <Input type="date" value={draft.opensAt} onChange={(event) => set("opensAt", event.target.value)} />
                </Field>
                <Field label="Clôture des candidatures">
                  <Input type="date" value={draft.closesAt} onChange={(event) => set("closesAt", event.target.value)} />
                </Field>
                <Field label="Date des épreuves" hint="Facultatif">
                  <Input type="date" value={draft.examAt} onChange={(event) => set("examAt", event.target.value)} />
                </Field>
                <Field label="Places offertes" hint="Facultatif">
                  <Input
                    type="number"
                    min={0}
                    value={draft.seats}
                    onChange={(event) => set("seats", event.target.value)}
                  />
                </Field>
                <Field label="Résumé public" className="sm:col-span-2">
                  <Textarea
                    rows={3}
                    value={draft.summary}
                    onChange={(event) => set("summary", event.target.value)}
                    placeholder="Présentation courte affichée sur le portail."
                  />
                </Field>
                <Field label="Instructions aux candidats" className="sm:col-span-2">
                  <Textarea
                    rows={3}
                    value={draft.instructions}
                    onChange={(event) => set("instructions", event.target.value)}
                  />
                </Field>
              </div>

              <p className="mt-6 text-[13px] font-semibold text-slate-700">Catégories ouvertes</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {categories.map((item) => {
                  const active = draft.categoryIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleIn("categoryIds", item.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                        active
                          ? "border-brand-400 bg-brand-50 text-brand-700"
                          : "border-hairline text-slate-600 hover:border-brand-200"
                      }`}
                    >
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${
                          active ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {active ? <Check className="h-3.5 w-3.5" /> : null}
                      </span>
                      <span className="min-w-0 truncate font-medium">{item.code}</span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-6 text-[13px] font-semibold text-slate-700">Filières proposées</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {filieres.map((item) => {
                  const active = draft.filiereIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleIn("filiereIds", item.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                        active
                          ? "border-brand-400 bg-brand-50 text-brand-700"
                          : "border-hairline text-slate-600 hover:border-brand-200"
                      }`}
                    >
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${
                          active ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {active ? <Check className="h-3.5 w-3.5" /> : null}
                      </span>
                      <span className="min-w-0 truncate font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-hairline bg-slate-50 px-5 py-4">
              <Button variant="secondary" onClick={() => setDraft(null)}>
                Annuler
              </Button>
              <Button onClick={save}>
                <Check className="h-4 w-4" />
                {draft.id ? "Enregistrer les modifications" : "Créer la session"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
