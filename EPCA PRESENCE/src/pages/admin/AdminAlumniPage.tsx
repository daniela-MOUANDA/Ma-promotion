import { AlumniReviewModal, StatusChip } from "@/components/admin/alumni/AlumniReviewModal";
import { ContactReviewModal } from "@/components/admin/students/ContactReviewModal";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Surface";
import { StudentAvatar } from "@/components/promotions/StudentAvatar";
import { promotionDisplay } from "@/lib/academic-year";
import { cn } from "@/lib/cn";
import { deleteAlumniFeedback, patchAlumniFeedback } from "@/lib/alumni-store";
import { formatShortDate } from "@/lib/format";
import { useAlumni, usePromotionStudents, usePromotions } from "@/lib/use-live-data";
import type { AlumniFeedback } from "@/types/domain";
import { ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { useMemo, useState } from "react";

const PAGE_SIZE = 10;

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

type Filter = "all" | "pending" | "published" | "hidden";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "pending", label: "En attente" },
  { id: "published", label: "Publiés" },
  { id: "hidden", label: "Masqués" },
];

export function AdminAlumniPage() {
  const { confirm, toast } = useFeedback();
  const alumni = useAlumni();
  const promotions = usePromotions();
  const students = usePromotionStudents();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [contactReviewOpen, setContactReviewOpen] = useState(false);

  const counts = useMemo(
    () => ({
      all: alumni.length,
      pending: alumni.filter((item) => item.status === "pending").length,
      published: alumni.filter((item) => item.status === "published").length,
      hidden: alumni.filter((item) => item.status === "hidden").length,
    }),
    [alumni],
  );

  const list = useMemo(() => {
    const filtered = filter === "all" ? alumni : alumni.filter((item) => item.status === filter);
    return [...filtered].sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (b.status === "pending" && a.status !== "pending") return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [alumni, filter]);

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const rows = list.slice(start, start + PAGE_SIZE);
  const selected = openId ? (alumni.find((item) => item.id === openId) ?? null) : null;
  const pendingContacts = students.filter((item) => item.contactPending).length;

  function setStatus(item: AlumniFeedback, status: AlumniFeedback["status"]) {
    patchAlumniFeedback(item.id, { status });
    toast({
      tone: "success",
      title: status === "published" ? "Témoignage publié" : "Témoignage masqué",
      message: item.fullName,
    });
  }

  async function remove(item: AlumniFeedback) {
    const ok = await confirm({
      title: "Supprimer ce témoignage ?",
      message: item.fullName,
      confirmLabel: "Supprimer",
    });
    if (!ok) return;
    deleteAlumniFeedback(item.id);
    setOpenId(null);
    toast({ tone: "success", title: "Témoignage supprimé", message: item.fullName });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Ma Promotion"
        title="Parcours des anciens"
        description="Lisez, publiez ou masquez les témoignages."
      />

      {pendingContacts > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-600 text-white">
            <Phone className="h-4 w-4" />
          </span>
          <p className="min-w-0 flex-1 text-sm text-navy-900">
            <strong>
              {pendingContacts} contact{pendingContacts > 1 ? "s" : ""}
            </strong>{" "}
            en attente de validation : proposé{pendingContacts > 1 ? "s" : ""} depuis les profils.
          </p>
          <Button size="sm" onClick={() => setContactReviewOpen(true)}>
            Examiner
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFilter(item.id);
                setPage(1);
              }}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                active ? "bg-navy-900 text-white" : "bg-white text-slate-600 ring-1 ring-hairline hover:text-navy-900",
              )}
            >
              {item.label}
              <span className={cn("ml-1.5 text-xs", active ? "text-white/60" : "text-slate-400")}>
                {counts[item.id]}
              </span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center text-sm text-slate-400">
          Aucun témoignage dans ce filtre.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
        <ul className="divide-y divide-slate-100">
          {rows.map((item) => {
            const student = students.find((entry) => entry.id === item.studentId);
            const promotion = promotionDisplay(item.promotionId ?? student?.promotionId, promotions);
            const role = [item.careerTitle, item.careerOrganization].filter(Boolean).join(" · ");
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(item.id)}
                  className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/80"
                >
                  <span className="mt-0.5 h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <StudentAvatar photoUrl={student?.photoUrl} fullName={item.fullName} textClass="text-xs" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-display font-semibold text-slate-900">{item.fullName}</span>
                      <StatusChip status={item.status} />
                      {student?.contactPending ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                          Contact à valider
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-500">
                      {role || "Parcours non renseigné"}
                      {promotion !== "—" ? ` · ${promotion}` : ""}
                    </span>
                    <span className="mt-2 block line-clamp-2 text-sm leading-6 text-slate-700">
                      “{item.experience}”
                    </span>
                  </span>
                  <span className="shrink-0 pt-1 text-xs text-slate-400">
                    {formatShortDate(item.createdAt.slice(0, 10))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {list.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3 text-sm text-slate-500">
            <span>
              {start + 1}–{Math.min(start + PAGE_SIZE, list.length)} sur {list.length}
            </span>
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
        </div>
      )}

      {contactReviewOpen ? <ContactReviewModal onClose={() => setContactReviewOpen(false)} /> : null}
      {selected ? (
        <AlumniReviewModal
          item={selected}
          onClose={() => setOpenId(null)}
          onPublish={() => setStatus(selected, "published")}
          onHide={() => setStatus(selected, "hidden")}
          onDelete={() => void remove(selected)}
        />
      ) : null}
    </div>
  );
}
