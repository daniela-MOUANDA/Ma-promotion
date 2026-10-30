import { AdminFilters } from "@/components/admin/AdminFilters";
import { CyberHead, CyberTable, Td, Th, Tr } from "@/components/admin/CyberTable";
import { ExportButtons } from "@/components/admin/ExportButtons";
import { IconButton } from "@/components/admin/IconButton";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { ApplicationStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/Surface";
import {
  getApplicationById,
  updateApplicationStatus,
  updateManyApplications,
} from "@/lib/applications-store";
import { getCategory, getCompetition, getFiliere, getOpenCompetition } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { publicationSubtitle } from "@/lib/list-export";
import { createPublication, deletePublication, patchPublication } from "@/lib/publications-store";
import { EMPTY_FILTERS, filterApplications, fullName } from "@/lib/roster";
import { useApplications, usePublications } from "@/lib/use-live-data";
import { useSelection } from "@/lib/use-selection";
import type { Application, ApplicationStatus } from "@/types/domain";
import { Check, CircleCheck, Inbox, Megaphone, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

const STATUSES: ApplicationStatus[] = [
  "DOSSIER_PHYSIQUE_ATTENDU",
  "DOSSIER_PHYSIQUE_DEPOSE",
  "DOSSIER_PHYSIQUE_VALIDE",
  "DOSSIER_PHYSIQUE_REJETE",
  "AUTORISE_CONCOURS",
];

function resolvePeople(ids: string[]): Application[] {
  return ids.map((id) => getApplicationById(id)).filter((item): item is Application => Boolean(item));
}

export function AdminPhysicalPage() {
  const { confirm, toast } = useFeedback();
  const applications = useApplications();
  const publications = usePublications().filter((item) => item.type === "autorises");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const rows = useMemo(
    () => filterApplications(applications, filters, STATUSES),
    [applications, filters],
  );
  const selection = useSelection(rows.map((item) => item.id));
  const competition = getOpenCompetition();
  const [title, setTitle] = useState("Liste des candidats autorisés aux épreuves");

  async function applyStatus(
    ids: string[],
    status: ApplicationStatus,
    prompt: { title: string; message: string; confirmLabel: string; danger?: boolean; success: string },
  ) {
    if (!ids.length) return;
    const ok = await confirm({
      title: prompt.title,
      message: prompt.message,
      confirmLabel: prompt.confirmLabel,
      danger: prompt.danger,
    });
    if (!ok) return;
    if (ids.length === 1) updateApplicationStatus(ids[0], status);
    else updateManyApplications(ids, { status });
    selection.clear();
    toast({ tone: prompt.danger ? "danger" : "success", title: prompt.success });
  }

  async function publishAuthorized() {
    const ids = selection.count ? selection.visibleSelected : applications.filter((item) => item.status === "AUTORISE_CONCOURS").map((item) => item.id);
    if (!ids.length || !competition) return;
    const ok = await confirm({
      title: "Publier la liste des autorisés ?",
      message: `${ids.length} candidat(s) figureront sur le portail et seront marqués comme autorisés aux épreuves.`,
      confirmLabel: "Publier la liste",
    });
    if (!ok) return;
    updateManyApplications(ids, { status: "AUTORISE_CONCOURS" });
    createPublication({
      type: "autorises",
      title,
      competitionId: competition.id,
      categoryId: filters.categoryId || null,
      filiereId: filters.filiereId || null,
      dropOffDate: null,
      dropOffSlot: null,
      venue: "",
      applicationIds: ids,
      published: true,
    });
    selection.clear();
    toast({
      tone: "success",
      title: "Liste des autorisés publiée",
      message: "Les candidats concernés peuvent la consulter sur le portail.",
    });
  }

  return (
    <div>
      <PageHeader
        kicker="Candidatures"
        title="Dossiers physiques"
        description="Quand le candidat s’est présenté, marquez le dépôt comme reçu, validez le dossier complet, puis publiez la liste définitive des autorisés aux épreuves — ou rejetez le dossier."
      />

      <div className="mt-6">
        <AdminFilters value={filters} onChange={setFilters} statuses={STATUSES} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={!selection.count}
            onClick={() =>
              void applyStatus(selection.visibleSelected, "DOSSIER_PHYSIQUE_DEPOSE", {
                title: "Marquer comme reçu ?",
                message: `${selection.count} dossier(s) seront indiqués comme déposés au secrétariat.`,
                confirmLabel: "Marquer reçu",
                success: "Dossier(s) marqué(s) comme reçu(s)",
              })
            }
          >
            <Inbox className="h-4 w-4" />
            Marquer reçu
          </Button>
          <Button
            size="sm"
            disabled={!selection.count}
            onClick={() =>
              void applyStatus(selection.visibleSelected, "DOSSIER_PHYSIQUE_VALIDE", {
                title: "Valider les dossiers complets ?",
                message: `${selection.count} dossier(s) seront marqués comme complets.`,
                confirmLabel: "Valider",
                success: "Dossier(s) marqué(s) comme complet(s)",
              })
            }
          >
            <CircleCheck className="h-4 w-4" />
            Dossier complet
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!selection.count}
            onClick={() =>
              void applyStatus(selection.visibleSelected, "AUTORISE_CONCOURS", {
                title: "Autoriser au concours ?",
                message: `${selection.count} candidat(s) seront autorisés à composer.`,
                confirmLabel: "Autoriser",
                success: "Candidat(s) autorisé(s) au concours",
              })
            }
          >
            Autoriser au concours
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={!selection.count}
            onClick={() =>
              void applyStatus(selection.visibleSelected, "DOSSIER_PHYSIQUE_REJETE", {
                title: "Rejeter le(s) dossier(s) ?",
                message:
                  "Cette décision sera visible dans le suivi du candidat. Confirmez uniquement si le dossier est irrecevable.",
                confirmLabel: "Oui, rejeter",
                danger: true,
                success: "Dossier(s) rejeté(s)",
              })
            }
          >
            <X className="h-4 w-4" />
            Rejeter
          </Button>
        </div>
        <ExportButtons
          applications={selection.count ? resolvePeople(selection.visibleSelected) : rows}
          meta={{
            title: "Registre des dossiers physiques",
            subtitle: competition?.name,
            extra: `${selection.count || rows.length} ligne(s)`,
          }}
        />
      </div>

      <div className="mt-4">
        <CyberTable
          empty={
            rows.length === 0 ? (
              <EmptyState icon={Inbox} title="Aucun dossier physique pour ces filtres" />
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
                />
              </Th>
              <Th>Candidat</Th>
              <Th>Catégorie</Th>
              <Th>Filière</Th>
              <Th>Lieu / jour</Th>
              <Th>Statut</Th>
              <Th>Actions</Th>
            </tr>
          </CyberHead>
          <tbody>
            {rows.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selection.selected.has(item.id)}
                    onChange={() => selection.toggle(item.id)}
                  />
                </Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={fullName(item)} size="xs" />
                    <div className="min-w-0">
                      <p className="font-display text-sm font-semibold text-slate-900">{fullName(item)}</p>
                      <p className="font-mono text-xs text-slate-400">{item.number}</p>
                    </div>
                  </div>
                </Td>
                <Td>{getCategory(item.categoryId)?.code ?? "—"}</Td>
                <Td>{getFiliere(item.filiereId)?.name ?? "—"}</Td>
                <Td className="text-xs text-slate-400">
                  {item.dropOffVenue ?? "—"}
                  {item.dropOffDate ? ` · ${formatDate(item.dropOffDate)}` : ""}
                  {item.dropOffSlot ? ` · ${item.dropOffSlot}` : ""}
                </Td>
                <Td>
                  <ApplicationStatusBadge status={item.status} />
                </Td>
                <Td>
                  <div className="flex">
                    <IconButton
                      label="Reçu"
                      onClick={() =>
                        void applyStatus([item.id], "DOSSIER_PHYSIQUE_DEPOSE", {
                          title: `Marquer ${fullName(item)} comme reçu ?`,
                          message: "Le statut passera à « dossier physique déposé ».",
                          confirmLabel: "Marquer reçu",
                          success: `${fullName(item)} : dossier marqué comme reçu`,
                        })
                      }
                    >
                      <Inbox className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label="Dossier complet"
                      tone="green"
                      onClick={() =>
                        void applyStatus([item.id], "DOSSIER_PHYSIQUE_VALIDE", {
                          title: `Valider le dossier de ${fullName(item)} ?`,
                          message: "Le dossier sera marqué comme complet.",
                          confirmLabel: "Valider",
                          success: `${fullName(item)} : dossier marqué comme complet`,
                        })
                      }
                    >
                      <Check className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label="Rejeter"
                      tone="danger"
                      onClick={() =>
                        void applyStatus([item.id], "DOSSIER_PHYSIQUE_REJETE", {
                          title: `Rejeter le dossier de ${fullName(item)} ?`,
                          message: "Cette décision sera visible dans le suivi du candidat.",
                          confirmLabel: "Oui, rejeter",
                          danger: true,
                          success: `${fullName(item)} : dossier rejeté`,
                        })
                      }
                    >
                      <X className="h-4 w-4" />
                    </IconButton>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </CyberTable>
      </div>

      <section className="mt-10 rounded-2xl border border-hairline bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-bold tracking-tight text-slate-900">
          Liste définitive des autorisés au concours
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Publiez les candidats retenus pour composer. L’export PDF / Excel groupe les noms par catégorie
          puis par filière.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Field label="Intitulé de la liste">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Button onClick={() => void publishAuthorized()}>
            <Megaphone className="h-4 w-4" />
            Publier les autorisés
          </Button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-base font-bold tracking-tight text-slate-900">Listes publiées</h2>
        <div className="mt-4 space-y-3">
          {publications.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-white p-4 shadow-card"
            >
              <div>
                <p className="font-display text-sm font-bold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">
                  {getCompetition(item.competitionId)?.name} · {item.applicationIds.length} candidat(s)
                  {item.published ? " · visible" : " · masquée"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ExportButtons
                  applications={resolvePeople(item.applicationIds)}
                  meta={{
                    title: item.title,
                    subtitle: publicationSubtitle(item.competitionId),
                    extra: item.published ? "Liste officielle" : "Brouillon",
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    patchPublication(item.id, { published: !item.published });
                    toast({
                      tone: "info",
                      title: item.published ? "Liste dépubliée" : "Liste republicée",
                    });
                  }}
                >
                  {item.published ? "Dépublier" : "Republier"}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    void confirm({
                      title: "Supprimer cette liste ?",
                      message: "La publication sera retirée. Les statuts des candidats restent inchangés.",
                      confirmLabel: "Supprimer",
                      danger: true,
                    }).then((ok) => {
                      if (!ok) return;
                      deletePublication(item.id);
                      toast({ tone: "danger", title: "Liste supprimée" });
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
          {publications.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune liste d’autorisés publiée pour le moment.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
