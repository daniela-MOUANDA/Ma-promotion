import { CyberHead, CyberTable, Td, Th, Tr } from "@/components/admin/CyberTable";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/Surface";
import { uniqueAutoCode, uniqueFiliereCode } from "@/lib/filiere-code";
import {
  createCategory,
  createFiliere,
  createRegie,
  deleteCategory,
  deleteFiliere,
  deleteRegie,
  patchCategory,
  patchFiliere,
  patchRegie,
} from "@/lib/promotions-store";
import {
  usePromotionCategories,
  usePromotionFilieres,
  usePromotionStudents,
  usePromotionsCatalog,
} from "@/lib/use-live-data";
import { cn } from "@/lib/cn";
import type { Category, Filiere, Regie } from "@/types/domain";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Landmark, Layers, Pencil, Plus, Trash2, Waypoints } from "lucide-react";
import { useMemo, useState } from "react";

type CatalogView = "categories" | "regies" | "filieres";

const emptyFiliere = {
  name: "",
  description: "",
  regieId: "",
  categoryIds: [] as string[],
};

const emptyCategory = { code: "" };
const emptyRegie = { name: "", description: "" };

export function AdminCatalogPage() {
  const { confirm, toast } = useFeedback();
  const catalog = usePromotionsCatalog();
  const categories = usePromotionCategories();
  const filieres = usePromotionFilieres();
  const students = usePromotionStudents();
  const regies = catalog.regies;

  const [filiereOpen, setFiliereOpen] = useState(false);
  const [filiereId, setFiliereId] = useState<string | null>(null);
  const [filiereForm, setFiliereForm] = useState(emptyFiliere);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);

  const [regieOpen, setRegieOpen] = useState(false);
  const [regieId, setRegieId] = useState<string | null>(null);
  const [regieForm, setRegieForm] = useState(emptyRegie);
  const [view, setView] = useState<CatalogView | null>(null);
  const [pickedCategoryId, setPickedCategoryId] = useState<string | null>(null);

  const activeRegie = filiereForm.regieId || regies[0]?.id || "";
  const previewCode = useMemo(() => {
    const taken = filieres.filter((item) => item.id !== filiereId).map((item) => item.code);
    return uniqueFiliereCode(filiereForm.name, taken);
  }, [filiereForm.name, filieres, filiereId]);
  const previewRegieCode = useMemo(() => {
    const taken = regies.filter((item) => item.id !== regieId).map((item) => item.code);
    return uniqueAutoCode(regieForm.name, taken, "REG");
  }, [regieForm.name, regies, regieId]);

  function closeFiliere() {
    setFiliereOpen(false);
    setFiliereId(null);
    setFiliereForm(emptyFiliere);
  }

  function closeCategory() {
    setCategoryOpen(false);
    setCategoryId(null);
    setCategoryForm(emptyCategory);
  }

  function closeRegie() {
    setRegieOpen(false);
    setRegieId(null);
    setRegieForm(emptyRegie);
  }

  function startCreateFiliere() {
    setFiliereId(null);
    setFiliereForm({ ...emptyFiliere, regieId: regies[0]?.id ?? "" });
    setFiliereOpen(true);
  }

  function startEditFiliere(item: Filiere) {
    setFiliereId(item.id);
    setFiliereForm({
      name: item.name,
      description: item.description,
      regieId: item.regieId,
      categoryIds: [...item.categoryIds],
    });
    setFiliereOpen(true);
  }

  function startCreateCategory() {
    setCategoryId(null);
    setCategoryForm(emptyCategory);
    setCategoryOpen(true);
  }

  function startEditCategory(item: Category) {
    setCategoryId(item.id);
    setCategoryForm({ code: item.code });
    setCategoryOpen(true);
  }

  function startCreateRegie() {
    setRegieId(null);
    setRegieForm(emptyRegie);
    setRegieOpen(true);
  }

  function startEditRegie(item: Regie) {
    setRegieId(item.id);
    setRegieForm({ name: item.name, description: item.description });
    setRegieOpen(true);
  }

  function toggleCategory(id: string) {
    setFiliereForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(id)
        ? current.categoryIds.filter((item) => item !== id)
        : [...current.categoryIds, id],
    }));
  }

  function saveFiliere(event: React.FormEvent) {
    event.preventDefault();
    if (!filiereForm.name.trim() || !activeRegie) {
      toast({ tone: "danger", title: "Champs incomplets", message: "Le nom et la régie sont requis." });
      return;
    }
    const payload = {
      code: previewCode,
      name: filiereForm.name.trim(),
      description: filiereForm.description.trim(),
      regieId: activeRegie,
      categoryIds: filiereForm.categoryIds,
    };
    if (filiereId) {
      patchFiliere(filiereId, payload);
      toast({ tone: "success", title: "Filière mise à jour", message: payload.name });
    } else {
      createFiliere(payload);
      toast({ tone: "success", title: "Filière créée", message: `${payload.name} · ${payload.code}` });
    }
    closeFiliere();
  }

  function saveCategory(event: React.FormEvent) {
    event.preventDefault();
    const code = categoryForm.code.trim().toUpperCase().replace(/\s+/g, "");
    if (!code) {
      toast({ tone: "danger", title: "Code manquant", message: "Indiquez C1, A2…" });
      return;
    }
    const duplicate = categories.some((item) => item.id !== categoryId && item.code.toUpperCase() === code);
    if (duplicate) {
      toast({ tone: "danger", title: "Code déjà utilisé", message: code });
      return;
    }
    if (categoryId) {
      patchCategory(categoryId, { code, name: code });
      toast({ tone: "success", title: "Catégorie mise à jour", message: code });
    } else {
      const sortOrder = (categories.at(-1)?.sortOrder ?? 0) + 1;
      createCategory({ code, name: code, description: "", sortOrder, active: true });
      toast({ tone: "success", title: "Catégorie ajoutée", message: code });
    }
    closeCategory();
  }

  function saveRegie(event: React.FormEvent) {
    event.preventDefault();
    if (!regieForm.name.trim()) {
      toast({ tone: "danger", title: "Nom manquant", message: "Indiquez le nom de la régie." });
      return;
    }
    const payload = {
      code: previewRegieCode,
      name: regieForm.name.trim(),
      description: regieForm.description.trim(),
    };
    if (regieId) {
      patchRegie(regieId, payload);
      toast({ tone: "success", title: "Régie mise à jour", message: payload.name });
    } else {
      createRegie(payload);
      toast({ tone: "success", title: "Régie créée", message: payload.name });
    }
    closeRegie();
  }

  async function removeFiliere(item: Filiere) {
    const used = students.some((student) => student.filiereId === item.id);
    if (used) {
      toast({
        tone: "danger",
        title: "Filière utilisée",
        message: "Des profils y sont encore rattachés.",
      });
      return;
    }
    const ok = await confirm({ title: "Supprimer la filière ?", message: item.name, confirmLabel: "Supprimer" });
    if (!ok) return;
    deleteFiliere(item.id);
    toast({ tone: "success", title: "Filière supprimée", message: item.name });
    if (filiereId === item.id) closeFiliere();
  }

  async function removeCategory(item: Category) {
    const used = students.some((student) => student.categoryId === item.id);
    if (used) {
      toast({
        tone: "danger",
        title: "Catégorie utilisée",
        message: "Des profils y sont encore rattachés.",
      });
      return;
    }
    const ok = await confirm({ title: "Supprimer la catégorie ?", message: item.code, confirmLabel: "Supprimer" });
    if (!ok) return;
    deleteCategory(item.id);
    toast({ tone: "success", title: "Catégorie supprimée", message: item.code });
    if (categoryId === item.id) closeCategory();
  }

  async function removeRegie(item: Regie) {
    const used = filieres.some((filiere) => filiere.regieId === item.id);
    if (used) {
      toast({
        tone: "danger",
        title: "Régie utilisée",
        message: "Des filières y sont encore rattachées.",
      });
      return;
    }
    const ok = await confirm({ title: "Supprimer la régie ?", message: item.name, confirmLabel: "Supprimer" });
    if (!ok) return;
    deleteRegie(item.id);
    toast({ tone: "success", title: "Régie supprimée", message: item.name });
    if (regieId === item.id) closeRegie();
  }

  const titles: Record<CatalogView, { title: string; description: string; add: string; onAdd: () => void }> = {
    categories: {
      title: "Catégories",
      description: "Choisissez une catégorie.",
      add: "Ajouter",
      onAdd: startCreateCategory,
    },
    regies: {
      title: "Régies",
      description: "Le code est attribué à partir du nom.",
      add: "Ajouter",
      onAdd: startCreateRegie,
    },
    filieres: {
      title: "Filières",
      description: "Le code est attribué à partir du nom.",
      add: "Nouvelle filière",
      onAdd: startCreateFiliere,
    },
  };
  const current = view ? titles[view] : null;
  const activeCategoryId = categories.some((item) => item.id === pickedCategoryId)
    ? pickedCategoryId
    : (categories[0]?.id ?? null);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Ma Promotion"
        title={current?.title ?? "Catégories & filières"}
        description={
          current?.description ?? "Choisissez un référentiel pour ouvrir son tableau."
        }
        actions={
          current ? (
            <>
              <Button variant="secondary" onClick={() => setView(null)}>
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button onClick={current.onAdd}>
                <Plus className="h-4 w-4" />
                {current.add}
              </Button>
            </>
          ) : null
        }
      />

      {view === null ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <ChoiceCard
            icon={Layers}
            title="Catégories"
            value={categories.length}
            hint="C2, C1, B2, B1, A2"
            onClick={() => setView("categories")}
          />
          <ChoiceCard
            icon={Landmark}
            title="Régies"
            value={regies.length}
            hint="Rattachement des filières"
            onClick={() => setView("regies")}
          />
          <ChoiceCard
            icon={Waypoints}
            title="Filières"
            value={filieres.length}
            hint="Douanes, Impôts…"
            onClick={() => setView("filieres")}
          />
        </div>
      ) : null}

      {view === "categories" ? (
        categories.length === 0 ? (
          <EmptyRow>Aucune catégorie.</EmptyRow>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {categories.map((item) => {
              const selected = activeCategoryId === item.id;
              const count = students.filter((student) => student.categoryId === item.id).length;
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: selected ? 0 : -6 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className={cn(
                    "relative flex min-h-[9rem] flex-col items-center justify-center rounded-[1.75rem] border px-4 py-6 text-center shadow-card",
                    selected
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "cursor-pointer border-hairline bg-white text-navy-900",
                  )}
                  onClick={() => setPickedCategoryId(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setPickedCategoryId(item.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-label={item.code}
                >
                  <span className="font-display text-4xl font-extrabold tracking-tight">{item.code}</span>
                  <span className={cn("mt-2 text-[11px]", selected ? "text-white/55" : "text-slate-400")}>
                    {count} profil{count > 1 ? "s" : ""}
                  </span>
                  {selected ? (
                    <div className="mt-3 flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={() => startEditCategory(item)}
                        aria-label={`Modifier ${item.code}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-rose-200"
                        onClick={() => void removeCategory(item)}
                        aria-label={`Supprimer ${item.code}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        )
      ) : null}

      {view === "regies" ? (
        <CyberTable minWidth="520px" empty={regies.length === 0 ? <EmptyRow>Aucune régie.</EmptyRow> : null}>
          <CyberHead>
            <tr>
              <Th>Régie</Th>
              <Th>Code</Th>
              <Th>Filières</Th>
              <Th>Actions</Th>
            </tr>
          </CyberHead>
          <tbody>
            {regies.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <p className="font-display font-semibold text-slate-900">{item.name}</p>
                </Td>
                <Td>{item.code}</Td>
                <Td>{filieres.filter((filiere) => filiere.regieId === item.id).length}</Td>
                <Td>
                  <RowActions
                    onEdit={() => startEditRegie(item)}
                    onDelete={() => void removeRegie(item)}
                    editLabel={`Modifier ${item.name}`}
                    deleteLabel={`Supprimer ${item.name}`}
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </CyberTable>
      ) : null}

      {view === "filieres" ? (
        <CyberTable minWidth="720px" empty={filieres.length === 0 ? <EmptyRow>Aucune filière.</EmptyRow> : null}>
          <CyberHead>
            <tr>
              <Th>Filière</Th>
              <Th>Code</Th>
              <Th>Régie</Th>
              <Th>Catégories</Th>
              <Th>Profils</Th>
              <Th>Actions</Th>
            </tr>
          </CyberHead>
          <tbody>
            {filieres.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <p className="font-display font-semibold text-slate-900">{item.name}</p>
                </Td>
                <Td>{item.code}</Td>
                <Td>{regies.find((regie) => regie.id === item.regieId)?.name ?? "—"}</Td>
                <Td>
                  {item.categoryIds
                    .map((id) => categories.find((category) => category.id === id)?.code)
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </Td>
                <Td>{students.filter((student) => student.filiereId === item.id).length}</Td>
                <Td>
                  <RowActions
                    onEdit={() => startEditFiliere(item)}
                    onDelete={() => void removeFiliere(item)}
                    editLabel={`Modifier ${item.name}`}
                    deleteLabel={`Supprimer ${item.name}`}
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </CyberTable>
      ) : null}

      {categoryOpen ? (
        <Modal
          title={categoryId ? "Modifier la catégorie" : "Nouvelle catégorie"}
          subtitle="Un code suffit : C2, C1, B2, B1, A2…"
          onClose={closeCategory}
          footer={
            <>
              <Button variant="secondary" onClick={closeCategory}>
                Annuler
              </Button>
              <Button type="submit" form="category-form">
                {categoryId ? "Enregistrer" : "Ajouter"}
              </Button>
            </>
          }
        >
          <form id="category-form" className="space-y-4" onSubmit={saveCategory}>
            <Field label="Catégorie" hint="Ex. C1, A2">
              <Input
                required
                value={categoryForm.code}
                onChange={(event) => setCategoryForm({ code: event.target.value })}
                placeholder="C1"
                autoFocus
              />
            </Field>
          </form>
        </Modal>
      ) : null}

      {regieOpen ? (
        <Modal
          title={regieId ? "Modifier la régie" : "Nouvelle régie"}
          subtitle="Le code est généré à partir du nom."
          onClose={closeRegie}
          footer={
            <>
              <Button variant="secondary" onClick={closeRegie}>
                Annuler
              </Button>
              <Button type="submit" form="regie-form">
                {regieId ? "Enregistrer" : "Ajouter"}
              </Button>
            </>
          }
        >
          <form id="regie-form" className="space-y-4" onSubmit={saveRegie}>
            <Field label="Nom">
              <Input
                required
                value={regieForm.name}
                onChange={(event) => setRegieForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Régie financière"
                autoFocus
              />
            </Field>
            <p className="rounded-xl bg-slate-50 px-3.5 py-2 text-sm text-slate-500">
              Code attribué :{" "}
              <span className="font-display font-bold text-slate-900">{previewRegieCode || "—"}</span>
            </p>
            <Field label="Description">
              <Textarea
                rows={2}
                value={regieForm.description}
                onChange={(event) => setRegieForm((current) => ({ ...current, description: event.target.value }))}
              />
            </Field>
          </form>
        </Modal>
      ) : null}

      {filiereOpen ? (
        <Modal
          title={filiereId ? "Modifier la filière" : "Nouvelle filière"}
          subtitle="Le code est généré à partir du nom."
          onClose={closeFiliere}
          footer={
            <>
              <Button variant="secondary" onClick={closeFiliere}>
                Annuler
              </Button>
              <Button type="submit" form="filiere-form">
                {filiereId ? "Enregistrer" : "Créer la filière"}
              </Button>
            </>
          }
        >
          <form id="filiere-form" className="space-y-4" onSubmit={saveFiliere}>
            <Field label="Nom">
              <Input
                required
                value={filiereForm.name}
                onChange={(event) => setFiliereForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Douanes"
              />
            </Field>
            <p className="rounded-xl bg-slate-50 px-3.5 py-2 text-sm text-slate-500">
              Code attribué :{" "}
              <span className="font-display font-bold text-slate-900">{previewCode || "—"}</span>
            </p>
            {regies.length === 0 ? (
              <p className="rounded-xl bg-amber-50 px-3.5 py-2 text-sm text-amber-800">
                Créez d’abord une régie pour rattacher cette filière.
              </p>
            ) : (
              <Field label="Régie">
                <Select
                  value={activeRegie}
                  onChange={(event) => setFiliereForm((current) => ({ ...current, regieId: event.target.value }))}
                >
                  {regies.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Description">
              <Textarea
                rows={2}
                value={filiereForm.description}
                onChange={(event) =>
                  setFiliereForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </Field>
            <fieldset>
              <legend className="text-[13px] font-semibold text-slate-700">Catégories concernées</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((item) => {
                  const on = filiereForm.categoryIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleCategory(item.id)}
                      className={
                        on
                          ? "rounded-xl bg-navy-900 px-3 py-1.5 text-sm font-semibold text-white"
                          : "rounded-xl border border-hairline px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-navy-900/30"
                      }
                    >
                      {item.code}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function ChoiceCard({
  icon: Icon,
  title,
  value,
  hint,
  onClick,
}: {
  icon: typeof Layers;
  title: string;
  value: number;
  hint: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -10, scale: 1.02 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className="group rounded-2xl border border-hairline bg-white p-6 text-left shadow-card hover:border-navy-900/30 hover:shadow-float"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:scale-110 group-hover:bg-navy-900 group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-navy-900 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">
        Ouvrir le tableau
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </motion.button>
  );
}

function EmptyRow({ children }: { children: string }) {
  return <p className="px-4 py-8 text-center text-sm text-slate-400">{children}</p>;
}

function RowActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-900"
        onClick={onEdit}
        aria-label={editLabel}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        onClick={onDelete}
        aria-label={deleteLabel}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
