import { AdminFilters } from "@/components/admin/AdminFilters";
import { CyberHead, CyberTable, Td, Th, Tr } from "@/components/admin/CyberTable";
import { ExportButtons } from "@/components/admin/ExportButtons";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { ApplicationStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Avatar, Chip, EmptyState, PageHeader } from "@/components/ui/Surface";
import { getApplicationById, updateManyApplications } from "@/lib/applications-store";
import { getCategory, getCompetition, getFiliere, getOpenCompetition } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { publicationSubtitle } from "@/lib/list-export";
import { createPublication, deletePublication, patchPublication } from "@/lib/publications-store";
import { EMPTY_FILTERS, filterApplications, fullName } from "@/lib/roster";
import { useApplications, usePublications } from "@/lib/use-live-data";
import { useSelection } from "@/lib/use-selection";
import type { Application, ApplicationStatus } from "@/types/domain";
import { Medal, Megaphone, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

const POOL: ApplicationStatus[] = [
  "AUTORISE_CONCOURS",
  "DOSSIER_PHYSIQUE_VALIDE",
  "ADMIS",
  "NON_ADMIS",
];

function resolvePeople(ids: string[]): Application[] {
  return ids.map((id) => getApplicationById(id)).filter((item): item is Application => Boolean(item));
}

export function AdminResultsManagePage() {
  const { confirm, toast } = useFeedback();
  const applications = useApplications();
  const publications = usePublications().filter((item) => item.type === "resultats");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const rows = useMemo(() => filterApplications(applications, filters, POOL), [applications, filters]);
  const winners = useSelection(rows.map((item) => item.id));
  const competition = getOpenCompetition();
  const [title, setTitle] = useState("Liste des admis — session de démonstration");
  const [markOthers, setMarkOthers] = useState(true);

  async function publish() {
    if (!winners.count || !competition) return;
    const ok = await confirm({
      title: "Publier les résultats ?",
      message: markOthers
        ? `${winners.count} candidat(s) seront admis. Les autres de la liste filtrée seront marqués non admis.`
        : `${winners.count} candidat(s) seront publiés comme admis.`,
      confirmLabel: "Publier les admis",
    });
    if (!ok) return;
    const winIds = winners.visibleSelected;
    const rest = rows.filter((item) => !winIds.includes(item.id)).map((item) => item.id);
    updateManyApplications(winIds, { status: "ADMIS" });
    if (markOthers && rest.length) updateManyApplications(rest, { status: "NON_ADMIS" });
    createPublication({
      type: "resultats",
      title,
      competitionId: competition.id,
      categoryId: filters.categoryId || null,
      filiereId: filters.filiereId || null,
      dropOffDate: null,
      dropOffSlot: null,
      venue: "",
      applicationIds: winIds,
      published: true,
    });
    winners.clear();
    toast({
      tone: "success",
      title: "Résultats publiés",
      message: "La liste des admis est visible sur le portail.",
    });
  }

  return (
    <div>
      <PageHeader
        kicker="Concours"
        title="Publication des résultats"
        description="Après les épreuves, filtrez par catégorie et filière, cochez les candidats admis, puis publiez. La liste apparaît sur le portail public."
      />

      <div className="mt-6">
        <AdminFilters value={filters} onChange={setFilters} statuses={POOL} />
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl border border-hairline bg-white p-5 shadow-card lg:grid-cols-[1fr_auto]">
        <Field label="Intitulé de la liste d’admis">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={markOthers}
            onChange={(event) => setMarkOthers(event.target.checked)}
          />
          Marquer les non sélectionnés comme non admis
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="brand">{rows.length} dans le vivier</Chip>
          <Chip tone={winners.count ? "mint" : "slate"}>{winners.count} admis sélectionné(s)</Chip>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButtons
            applications={winners.count ? resolvePeople(winners.visibleSelected) : rows.filter((item) => item.status === "ADMIS")}
            meta={{
              title,
              subtitle: publicationSubtitle(competition?.id ?? ""),
              extra: "Liste des admis",
            }}
          />
          <Button disabled={!winners.count} onClick={() => void publish()}>
            <Megaphone className="h-4 w-4" />
            Publier les admis
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <CyberTable
          empty={
            rows.length === 0 ? (
              <EmptyState icon={Medal} title="Aucun candidat autorisé ou déjà noté pour ces filtres" />
            ) : null
          }
        >
          <CyberHead>
            <tr>
              <Th className="w-10">
                <input
                  type="checkbox"
                  checked={winners.allVisibleSelected}
                  onChange={winners.toggleAllVisible}
                  aria-label="Tout sélectionner"
                />
              </Th>
              <Th>Candidat</Th>
              <Th>Catégorie</Th>
              <Th>Filière</Th>
              <Th>Statut</Th>
            </tr>
          </CyberHead>
          <tbody>
            {rows.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <input
                    type="checkbox"
                    checked={winners.selected.has(item.id)}
                    onChange={() => winners.toggle(item.id)}
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
                <Td>
                  <ApplicationStatusBadge status={item.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </CyberTable>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-base font-bold tracking-tight text-slate-900">Listes publiées</h2>
        <div className="mt-4 space-y-3">
          {publications.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-white p-4 shadow-card"
            >
              <div className="flex items-start gap-3">
                <span className="grad-sunset grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white">
                  <Medal className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">
                    {getCompetition(item.competitionId)?.name} · {item.applicationIds.length} admis ·{" "}
                    {formatDate(item.createdAt.slice(0, 10))}
                    {item.published ? " · visible" : " · masquée"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <ExportButtons
                  applications={resolvePeople(item.applicationIds)}
                  meta={{
                    title: item.title,
                    subtitle: publicationSubtitle(item.competitionId),
                    extra: "Résultats officiels",
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    patchPublication(item.id, { published: !item.published });
                    toast({
                      tone: "info",
                      title: item.published ? "Résultats dépubliés" : "Résultats republicés",
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
                      title: "Supprimer cette liste de résultats ?",
                      message: "Elle disparaîtra du portail. Les statuts ADMIS / NON ADMIS restent.",
                      confirmLabel: "Supprimer",
                      danger: true,
                    }).then((ok) => {
                      if (!ok) return;
                      deletePublication(item.id);
                      toast({ tone: "danger", title: "Liste de résultats supprimée" });
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
          {publications.length === 0 ? <p className="text-sm text-slate-400">Aucun résultat publié.</p> : null}
        </div>
      </section>
    </div>
  );
}
