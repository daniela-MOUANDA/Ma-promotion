import { CyberHead, CyberTable, Td, Th, Tr } from "@/components/admin/CyberTable";
import { ImportStudentsModal } from "@/components/admin/students/ImportStudentsModal";
import { ContactReviewModal } from "@/components/admin/students/ContactReviewModal";
import { PhotoReviewModal } from "@/components/admin/students/PhotoReviewModal";
import { StudentFormModal } from "@/components/admin/students/StudentFormModal";
import { StudentProfileModal } from "@/components/admin/students/StudentProfileModal";
import { STATUS_OPTIONS } from "@/lib/cohort";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { StudentAvatar } from "@/components/promotions/StudentAvatar";
import { StudentStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Card, PageHeader } from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { deleteStudent } from "@/lib/promotions-store";
import {
  usePromotionCategories,
  usePromotionFilieres,
  usePromotions,
  usePromotionStudents,
} from "@/lib/use-live-data";
import { normalizeText } from "@/lib/student-import";
import { OriginBadge } from "@/components/ui/OriginBadge";
import type { PublicStudent, StudentOrigin, StudentPublicStatus } from "@/types/domain";
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  ImageIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const PAGE_SIZES = [10, 25, 50, 100];

type Filters = {
  query: string;
  promotionId: string;
  categoryId: string;
  filiereId: string;
  status: "" | StudentPublicStatus;
  origin: "" | StudentOrigin;
};

const noFilters: Filters = {
  query: "",
  promotionId: "",
  categoryId: "",
  filiereId: "",
  status: "",
  origin: "",
};

/** 1 … 4 5 [6] 7 8 … 20 */
function pageList(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) out.push("gap");
    out.push(page);
  });
  return out;
}

export function AdminStudentsPage() {
  const { confirm, toast } = useFeedback();
  const promotions = usePromotions();
  const students = usePromotionStudents();
  const categories = usePromotionCategories();
  const filieres = usePromotionFilieres();

  const [filters, setFilters] = useState<Filters>(noFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<PublicStudent | null | undefined>(undefined);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState<false | "photo" | "contact">(false);

  const promotionById = useMemo(() => new Map(promotions.map((item) => [item.id, item])), [promotions]);
  const categoryById = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const filiereById = useMemo(() => new Map(filieres.map((item) => [item.id, item])), [filieres]);

  const filiereOptions = useMemo(
    () =>
      filters.categoryId ? filieres.filter((item) => item.categoryIds.includes(filters.categoryId)) : filieres,
    [filieres, filters.categoryId],
  );

  const filtered = useMemo(() => {
    const needle = normalizeText(filters.query);
    return students.filter((item) => {
      if (filters.promotionId && item.promotionId !== filters.promotionId) return false;
      if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
      if (filters.filiereId && item.filiereId !== filters.filiereId) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.origin && item.origin !== filters.origin) return false;
      if (needle && !normalizeText(item.fullName).includes(needle)) return false;
      return true;
    });
  }, [students, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);
  const viewing = viewingId ? (students.find((item) => item.id === viewingId) ?? null) : null;
  const pendingPhotos = students.filter((item) => item.photoPending).length;
  const pendingContacts = students.filter((item) => item.contactPending).length;
  const hasFilters = Object.values(filters).some(Boolean);

  function patchFilters(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  async function remove(item: PublicStudent) {
    const ok = await confirm({
      title: "Supprimer ce profil ?",
      message: item.fullName,
      confirmLabel: "Supprimer",
    });
    if (!ok) return;
    deleteStudent(item.id);
    toast({ tone: "success", title: "Profil supprimé", message: item.fullName });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Ma Promotion"
        title="Élèves & profils"
        description="Tous les élèves visibles sur Ma Promotion. Filtrez, ajoutez un élève ou importez une liste Excel."
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" />
              Importer Excel
            </Button>
            <Button onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" />
              Ajouter un élève
            </Button>
          </>
        }
      />

      {pendingPhotos > 0 || pendingContacts > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky/30 bg-sky/10 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky text-white">
            <ImageIcon className="h-4.5 w-4.5" />
          </span>
          <p className="min-w-0 flex-1 text-sm text-navy-900">
            {[
              pendingPhotos
                ? `${pendingPhotos} photo${pendingPhotos > 1 ? "s" : ""}`
                : null,
              pendingContacts
                ? `${pendingContacts} contact${pendingContacts > 1 ? "s" : ""}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}{" "}
            en attente de validation, proposés depuis les profils publics.
          </p>
          <div className="flex flex-wrap gap-2">
            {pendingPhotos > 0 ? (
              <Button size="sm" onClick={() => setReviewOpen("photo")}>
                Photos
              </Button>
            ) : null}
            {pendingContacts > 0 ? (
              <Button size="sm" variant={pendingPhotos > 0 ? "secondary" : "primary"} onClick={() => setReviewOpen("contact")}>
                Contacts
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <Card padded={false}>
        <div className="border-b border-hairline p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_repeat(5,1fr)]">
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={filters.query}
                onChange={(e) => patchFilters({ query: e.target.value })}
                placeholder="Rechercher un nom…"
                className="pl-10"
              />
            </div>
            <Select value={filters.promotionId} onChange={(e) => patchFilters({ promotionId: e.target.value })}>
              <option value="">Toutes les promotions</option>
              {promotions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
            <Select
              value={filters.categoryId}
              onChange={(e) => patchFilters({ categoryId: e.target.value, filiereId: "" })}
            >
              <option value="">Toutes les catégories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code}
                </option>
              ))}
            </Select>
            <Select value={filters.filiereId} onChange={(e) => patchFilters({ filiereId: e.target.value })}>
              <option value="">Toutes les filières</option>
              {filiereOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select
              value={filters.status}
              onChange={(e) => patchFilters({ status: e.target.value as Filters["status"] })}
            >
              <option value="">Tous les statuts</option>
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
            <Select
              value={filters.origin}
              onChange={(e) => patchFilters({ origin: e.target.value as Filters["origin"] })}
            >
              <option value="">Interne et externe</option>
              <option value="INTERNE">Internes</option>
              <option value="EXTERNE">Externes</option>
            </Select>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
            <p>
              <strong className="text-slate-800">{filtered.length}</strong> élève{filtered.length > 1 ? "s" : ""}
              {hasFilters ? ` sur ${students.length}` : ""}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setFilters(noFilters);
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:text-sky"
              >
                <X className="h-3.5 w-3.5" />
                Réinitialiser les filtres
              </button>
            ) : null}
          </div>
        </div>

        <CyberTable
          className="rounded-none border-0 shadow-none"
          minWidth="960px"
          empty={
            filtered.length === 0 ? (
              <p className="px-4 py-14 text-center text-sm text-slate-500">
                {hasFilters ? "Aucun élève ne correspond à ces filtres." : "Aucun élève pour le moment."}
              </p>
            ) : null
          }
        >
          <CyberHead>
            <tr>
              <Th>Élève</Th>
              <Th>Promotion</Th>
              <Th>Catégorie</Th>
              <Th>Filière</Th>
              <Th>Statut</Th>
              <Th>Interne / Externe</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </CyberHead>
          <tbody>
            {rows.map((item) => (
              <Tr key={item.id} onClick={() => setViewingId(item.id)} className="hover:bg-brand-50/60">
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                      <StudentAvatar photoUrl={item.photoUrl} fullName={item.fullName} textClass="text-xs" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display font-semibold text-slate-900 group-hover:text-navy-900">
                        {item.fullName}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs">
                        {item.photoPending ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setReviewOpen("photo");
                            }}
                            className="font-semibold text-sky hover:underline"
                          >
                            Photo à valider
                          </button>
                        ) : null}
                        {item.contactPending ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setReviewOpen("contact");
                            }}
                            className="font-semibold text-sky hover:underline"
                          >
                            Contact à valider
                          </button>
                        ) : null}
                        {item.published === false ? <span className="text-amber-600">Non publié</span> : null}
                      </div>
                    </div>
                  </div>
                </Td>
                <Td className="whitespace-nowrap text-sm">{promotionById.get(item.promotionId)?.label ?? "—"}</Td>
                <Td>
                  <span className="rounded-md bg-navy-900/5 px-2 py-0.5 text-xs font-bold text-navy-900">
                    {categoryById.get(item.categoryId)?.code ?? "—"}
                  </span>
                </Td>
                <Td className="text-sm">{filiereById.get(item.filiereId)?.name ?? "—"}</Td>
                <Td>
                  <StudentStatusBadge status={item.status} />
                </Td>
                <Td>
                  <OriginBadge origin={item.origin} />
                </Td>
                <Td>
                  <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      aria-label={`Modifier ${item.fullName}`}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-900"
                      onClick={() => setEditing(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Supprimer ${item.fullName}`}
                      className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => remove(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </CyberTable>

        {filtered.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3 text-sm text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                {start + 1}–{Math.min(start + pageSize, filtered.length)} sur {filtered.length}
              </span>
              <Select
                aria-label="Élèves par page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="!w-auto !rounded-xl !py-1.5 !pl-3 !pr-8 text-sm"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </Select>
            </div>
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                aria-label="Page précédente"
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageList(currentPage, pageCount).map((entry, index) =>
                entry === "gap" ? (
                  <span key={`gap-${index}`} className="px-1 text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setPage(entry)}
                    aria-current={entry === currentPage ? "page" : undefined}
                    className={cn(
                      "h-9 min-w-9 rounded-xl px-2 text-sm font-semibold transition-colors",
                      entry === currentPage ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {entry}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}
                aria-label="Page suivante"
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        ) : null}
      </Card>

      {viewing ? (
        <StudentProfileModal
          student={viewing}
          onClose={() => setViewingId(null)}
          onEdit={() => {
            setViewingId(null);
            setEditing(viewing);
          }}
        />
      ) : null}
      {editing !== undefined ? (
        <StudentFormModal
          key={editing?.id ?? "new"}
          student={editing}
          defaults={{ promotionId: filters.promotionId, categoryId: filters.categoryId }}
          onClose={() => setEditing(undefined)}
        />
      ) : null}
      {importOpen ? <ImportStudentsModal onClose={() => setImportOpen(false)} /> : null}
      {reviewOpen === "photo" ? <PhotoReviewModal onClose={() => setReviewOpen(false)} /> : null}
      {reviewOpen === "contact" ? <ContactReviewModal onClose={() => setReviewOpen(false)} /> : null}
    </div>
  );
}
