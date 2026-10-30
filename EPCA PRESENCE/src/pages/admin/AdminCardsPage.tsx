import { SchoolIdCard } from "@/components/admin/SchoolIdCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/Surface";
import { getCategory, getFiliere } from "@/lib/catalog";
import { fullName } from "@/lib/roster";
import { useApplications } from "@/lib/use-live-data";
import { IdCard, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function AdminCardsPage() {
  const applications = useApplications();
  const admitted = useMemo(
    () => applications.filter((item) => item.status === "ADMIS"),
    [applications],
  );
  const [params, setParams] = useSearchParams();
  const [categoryId, setCategoryId] = useState("");
  const [filiereId, setFiliereId] = useState("");

  const visible = admitted.filter((item) => {
    if (categoryId && item.categoryId !== categoryId) return false;
    if (filiereId && item.filiereId !== filiereId) return false;
    return true;
  });
  const selectedId = params.get("id") ?? visible[0]?.id ?? "";
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0];

  return (
    <div>
      <div className="no-print">
        <PageHeader
          kicker="Scolarité"
          title="Cartes scolaires"
          description="Génération pour les étudiants admis. Sélectionnez une fiche, puis imprimez. Document de démonstration — le modèle officiel sera paramétré plus tard."
          actions={
            <Button disabled={!selected} onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimer la carte
            </Button>
          }
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="no-print rounded-2xl border border-hairline bg-white p-4 shadow-card">
          <p className="font-display text-sm font-bold text-slate-900">
            Effectif admis
            <span className="ml-2 text-xs font-medium text-slate-400">{visible.length} fiche(s)</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">Catégorie</option>
              {[...new Set(admitted.map((item) => item.categoryId))].map((id) => (
                <option key={id} value={id}>
                  {getCategory(id)?.code}
                </option>
              ))}
            </Select>
            <Select value={filiereId} onChange={(event) => setFiliereId(event.target.value)}>
              <option value="">Filière</option>
              {[...new Set(admitted.map((item) => item.filiereId))].map((id) => (
                <option key={id} value={id}>
                  {getFiliere(id)?.name}
                </option>
              ))}
            </Select>
          </div>
          <ul className="scroll-slim mt-4 max-h-[480px] space-y-1 overflow-auto pr-1">
            {visible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setParams({ id: item.id })}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    selected?.id === item.id
                      ? "grad-brand text-white shadow-glow"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Avatar name={fullName(item)} size="xs" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{fullName(item)}</span>
                    <span className="block truncate text-[11px] opacity-70">
                      {getFiliere(item.filiereId)?.name}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {visible.length === 0 ? (
              <li>
                <EmptyState icon={IdCard} title="Aucun admis à cartographier" />
              </li>
            ) : null}
          </ul>
        </aside>

        <div className="flex justify-center rounded-2xl border border-hairline bg-slate-50 p-6">
          {selected ? (
            <SchoolIdCard student={selected} />
          ) : (
            <EmptyState
              icon={IdCard}
              title="Aucune carte disponible"
              message="Publiez des résultats pour générer des cartes scolaires."
            />
          )}
        </div>
      </div>
    </div>
  );
}
