import { AdminFilters } from "@/components/admin/AdminFilters";
import { CyberHead, CyberTable, Td, Th, Tr } from "@/components/admin/CyberTable";
import { IconButton } from "@/components/admin/IconButton";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { ApplicationStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getCategory, getFiliere } from "@/lib/catalog";
import { deleteManyApplications } from "@/lib/applications-store";
import { formatDate } from "@/lib/format";
import { Avatar, Chip, EmptyState, PageHeader } from "@/components/ui/Surface";
import { EMPTY_FILTERS, filterApplications, fullName } from "@/lib/roster";
import { useApplications } from "@/lib/use-live-data";
import { useSelection } from "@/lib/use-selection";
import { Eye, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export function AdminApplicationsPage() {
  const { confirm, toast } = useFeedback();
  const applications = useApplications();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, q: params.get("q") ?? "" });

  useEffect(() => {
    const q = params.get("q");
    if (q !== null) setFilters((current) => ({ ...current, q }));
  }, [params]);
  const rows = useMemo(() => filterApplications(applications, filters), [applications, filters]);
  const selection = useSelection(rows.map((item) => item.id));

  async function removeSelected() {
    if (!selection.count) return;
    const ok = await confirm({
      title: `Supprimer ${selection.count} candidature(s) ?`,
      message: "Cette action est locale à ce navigateur et ne pourra pas être annulée.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    deleteManyApplications(selection.visibleSelected);
    selection.clear();
    toast({ tone: "danger", title: "Candidature(s) supprimée(s)" });
  }

  return (
    <div>
      <PageHeader
        kicker="Candidatures"
        title="Réception des candidatures"
        description="Toutes les candidatures en ligne arrivent ici. Filtrez par catégorie, filière et période, puis ouvrez un dossier ou préparez une liste de dépôt."
        actions={
          <Button variant="danger" size="sm" disabled={!selection.count} onClick={() => void removeSelected()}>
            <Trash2 className="h-4 w-4" />
            Supprimer ({selection.count})
          </Button>
        }
      />

      <div className="mt-6">
        <AdminFilters value={filters} onChange={setFilters} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip tone="brand">{rows.length} dossier(s)</Chip>
        <Chip tone={selection.count ? "mint" : "slate"}>{selection.count} sélectionné(s)</Chip>
      </div>

      <div className="mt-4">
        <CyberTable
          empty={
            rows.length === 0 ? (
              <EmptyState
                icon={Eye}
                title="Aucun dossier pour ces filtres"
                message="Modifiez la recherche, la catégorie ou la période."
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
              <Th>Numéro</Th>
              <Th>Catégorie</Th>
              <Th>Filière</Th>
              <Th>Déposée</Th>
              <Th>Statut</Th>
              <Th className="w-24">Actions</Th>
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
                    aria-label={`Sélectionner ${fullName(item)}`}
                  />
                </Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={fullName(item)} size="sm" />
                    <div className="min-w-0">
                      <p className="font-display text-sm font-semibold text-slate-900">{fullName(item)}</p>
                      <p className="truncate text-xs text-slate-400">{item.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="font-mono text-xs">{item.number}</Td>
                <Td>{getCategory(item.categoryId)?.code ?? "—"}</Td>
                <Td>{getFiliere(item.filiereId)?.name ?? "—"}</Td>
                <Td>{formatDate(item.submittedAt.slice(0, 10))}</Td>
                <Td>
                  <ApplicationStatusBadge status={item.status} />
                </Td>
                <Td>
                  <div className="flex items-center">
                    <Link to={`/admin/candidatures/${item.number}`}>
                      <IconButton label="Ouvrir">
                        <Eye className="h-4 w-4" />
                      </IconButton>
                    </Link>
                    <IconButton
                      label="Supprimer"
                      tone="danger"
                      onClick={() =>
                        void confirm({
                          title: `Supprimer ${fullName(item)} ?`,
                          message: "Le dossier sera retiré de la réception.",
                          confirmLabel: "Supprimer",
                          danger: true,
                        }).then((ok) => {
                          if (!ok) return;
                          deleteManyApplications([item.id]);
                          toast({ tone: "danger", title: "Candidature supprimée" });
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </CyberTable>
      </div>
    </div>
  );
}
