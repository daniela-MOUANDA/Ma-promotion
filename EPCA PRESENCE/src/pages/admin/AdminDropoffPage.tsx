import { AdminFilters } from "@/components/admin/AdminFilters";
import { CyberHead, CyberTable, Td, Th, Tr } from "@/components/admin/CyberTable";
import { ExportButtons } from "@/components/admin/ExportButtons";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { ApplicationStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
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
import { Megaphone, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

const ELIGIBLE: ApplicationStatus[] = ["SOUMISE", "DOSSIER_PHYSIQUE_ATTENDU"];

function resolvePeople(ids: string[]): Application[] {
  return ids.map((id) => getApplicationById(id)).filter((item): item is Application => Boolean(item));
}

export function AdminDropoffPage() {
  const { confirm, toast } = useFeedback();
  const applications = useApplications();
  const publications = usePublications().filter((item) => item.type === "depot");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const rows = useMemo(
    () => filterApplications(applications, filters, ELIGIBLE),
    [applications, filters],
  );
  const selection = useSelection(rows.map((item) => item.id));
  const competition = getOpenCompetition();

  const [title, setTitle] = useState("Liste de passage — dépôt physique");
  const [dropOffDate, setDropOffDate] = useState("2026-10-15");
  const [dropOffSlot, setDropOffSlot] = useState<"matin" | "soir">("matin");
  const [venue, setVenue] = useState("Secrétariat EPCA — Libreville");

  async function publish() {
    if (!selection.count || !competition) return;
    const ok = await confirm({
      title: "Publier la liste de passage ?",
      message: `${selection.count} candidat(s) seront convoqués le ${formatDate(dropOffDate)} (${dropOffSlot}) à ${venue}. La liste devient visible sur le portail.`,
      confirmLabel: "Publier",
    });
    if (!ok) return;
    const ids = selection.visibleSelected;
    updateManyApplications(ids, {
      status: "DOSSIER_PHYSIQUE_ATTENDU",
      dropOffDate,
      dropOffSlot,
      dropOffVenue: venue,
    });
    createPublication({
      type: "depot",
      title,
      competitionId: competition.id,
      categoryId: filters.categoryId || null,
      filiereId: filters.filiereId || null,
      dropOffDate,
      dropOffSlot,
      venue,
      applicationIds: ids,
      published: true,
    });
    selection.clear();
    toast({
      tone: "success",
      title: "Liste de passage publiée",
      message: "Les candidats peuvent consulter leur jour de dépôt sur le portail.",
    });
  }

  return (
    <div>
      <PageHeader
        kicker="Candidatures"
        title="Convocations de dépôt physique"
        description="Sélectionnez les candidats (par catégorie, filière ou période), fixez le jour de passage, puis publiez. La liste devient visible sur le portail et dans le suivi de candidature."
      />

      <div className="mt-6">
        <AdminFilters value={filters} onChange={setFilters} statuses={ELIGIBLE} />
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl border border-hairline bg-white p-5 shadow-card lg:grid-cols-4">
        <Field label="Intitulé de la liste">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="Jour de dépôt">
          <Input type="date" value={dropOffDate} onChange={(event) => setDropOffDate(event.target.value)} />
        </Field>
        <Field label="Créneau">
          <Select
            value={dropOffSlot}
            onChange={(event) => setDropOffSlot(event.target.value as "matin" | "soir")}
          >
            <option value="matin">Matin</option>
            <option value="soir">Après-midi</option>
          </Select>
        </Field>
        <Field label="Lieu">
          <Input value={venue} onChange={(event) => setVenue(event.target.value)} />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="brand">{rows.length} candidat(s)</Chip>
          <Chip tone={selection.count ? "mint" : "slate"}>{selection.count} sélectionné(s)</Chip>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButtons
            applications={selection.count ? resolvePeople(selection.visibleSelected) : rows}
            meta={{
              title,
              subtitle: publicationSubtitle(competition?.id ?? "", dropOffDate, venue),
              extra: dropOffSlot === "soir" ? "Après-midi" : "Matin",
            }}
          />
          <Button disabled={!selection.count} onClick={() => void publish()}>
            <Megaphone className="h-4 w-4" />
            Publier la liste de passage
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <CyberTable
          empty={
            rows.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="Aucun candidat éligible"
                message="Aucun dossier soumis ou déjà convoqué ne correspond à ces filtres."
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
                />
              </Th>
              <Th>Candidat</Th>
              <Th>Catégorie</Th>
              <Th>Filière</Th>
              <Th>Statut</Th>
              <Th>Jour prévu</Th>
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
                <Td>
                  <ApplicationStatusBadge status={item.status} />
                </Td>
                <Td>
                  {item.dropOffDate ? `${formatDate(item.dropOffDate)} · ${item.dropOffSlot ?? ""}` : "—"}
                </Td>
              </Tr>
            ))}
          </tbody>
        </CyberTable>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-base font-bold tracking-tight text-slate-900">Listes déjà publiées</h2>
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
                  {item.dropOffDate ? ` · ${formatDate(item.dropOffDate)}` : ""} · {item.dropOffSlot}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ExportButtons
                  applications={resolvePeople(item.applicationIds)}
                  meta={{
                    title: item.title,
                    subtitle: publicationSubtitle(item.competitionId, item.dropOffDate, item.venue),
                    extra: item.dropOffSlot === "soir" ? "Après-midi" : "Matin",
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
                      title: "Supprimer cette liste de passage ?",
                      message: "Elle disparaîtra du portail. Les convocations déjà notées sur les dossiers restent.",
                      confirmLabel: "Supprimer",
                      danger: true,
                    }).then((ok) => {
                      if (!ok) return;
                      deletePublication(item.id);
                      toast({ tone: "danger", title: "Liste de passage supprimée" });
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
          {publications.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune liste de dépôt publiée pour le moment.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
