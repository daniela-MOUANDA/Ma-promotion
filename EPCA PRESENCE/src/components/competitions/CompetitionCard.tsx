import { CompetitionStatusBadge } from "@/components/ui/Badge";
import { formatRange } from "@/lib/format";
import { getCategories, getFilieres } from "@/lib/catalog";
import type { Competition } from "@/types/domain";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CompetitionCard({ competition }: { competition: Competition }) {
  const categoryLabels = getCategories()
    .filter((item) => competition.categoryIds.includes(item.id))
    .map((item) => item.code)
    .join(" · ");
  const filiereCount = getFilieres().filter((item) => competition.filiereIds.includes(item.id)).length;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-hairline bg-white p-5 shadow-card transition-all hover:-translate-y-1 hover:border-brand-200 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Session {competition.year}
        </p>
        <CompetitionStatusBadge status={competition.status} />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-slate-900 sm:text-xl">{competition.name}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">{competition.summary}</p>
      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Candidatures</dt>
          <dd className="text-right font-medium text-slate-900">
            {formatRange(competition.opensAt, competition.closesAt)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Catégories</dt>
          <dd className="text-right font-medium text-slate-900">{categoryLabels || "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Filières</dt>
          <dd className="text-right font-medium text-slate-900">{filiereCount}</dd>
        </div>
      </dl>
      <Link
        to={`/concours/${competition.slug}`}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
      >
        Voir le concours
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
