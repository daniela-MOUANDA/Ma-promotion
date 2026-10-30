import { DashboardAlerts } from "@/components/admin/AdminAlerts";
import { ColumnChart, Donut, Legend } from "@/components/charts/Charts";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader, StatCard } from "@/components/ui/Surface";
import { cn } from "@/lib/cn";
import { cohortOf, cohortSwitchCopy } from "@/lib/cohort";
import { setPromotionCohort } from "@/lib/promotions-store";
import {
  usePromotionCategories,
  usePromotions,
  usePromotionStudents,
} from "@/lib/use-live-data";
import type { PublicStudent } from "@/types/domain";
import { GraduationCap, UserMinus, Users, UserX } from "lucide-react";
import { useMemo, useState } from "react";

function countsOf(list: PublicStudent[]) {
  return {
    cohort: list.filter((item) => item.status === "EN_FORMATION" || item.status === "DIPLOME").length,
    abandon: list.filter((item) => item.status === "ABANDON").length,
    exclu: list.filter((item) => item.status === "EXCLU").length,
    interne: list.filter((item) => item.origin === "INTERNE").length,
    externe: list.filter((item) => item.origin === "EXTERNE").length,
  };
}

export function AdminDashboardPage() {
  const { confirm, toast } = useFeedback();
  const promotions = usePromotions();
  const students = usePromotionStudents();
  const categories = usePromotionCategories();
  const [pickedId, setPickedId] = useState<string | null>(null);

  const selected = promotions.find((item) => item.id === pickedId) ?? promotions[0];
  const scoped = useMemo(
    () => (selected ? students.filter((item) => item.promotionId === selected.id) : []),
    [students, selected],
  );
  const counts = useMemo(() => countsOf(scoped), [scoped]);
  const cohort = selected ? cohortOf(selected) : "EN_FORMATION";
  const inTraining = cohort === "EN_FORMATION";

  const slices = [
    {
      label: inTraining ? "En formation" : "Diplômés",
      value: counts.cohort,
      color: inTraining ? "#1c4270" : "#0f8a5f",
    },
    { label: "Abandons", value: counts.abandon, color: "#c98a1e" },
    { label: "Exclus", value: counts.exclu, color: "#c0392f" },
  ];

  const byCategory = useMemo(
    () =>
      categories.map((category) => {
        const list = scoped.filter((item) => item.categoryId === category.id);
        const n = countsOf(list);
        return {
          label: category.code,
          value: list.length,
          caption: `${n.abandon} abd. · ${n.exclu} excl.`,
          color: "#1c4270",
        };
      }),
    [categories, scoped],
  );

  async function toggleCohort() {
    if (!selected) return;
    const next = inTraining ? "terminee" : "en_cours";
    const copy = cohortSwitchCopy(next);
    const ok = await confirm(copy);
    if (!ok) return;
    setPromotionCohort(selected.id, next);
    toast({
      tone: "success",
      title: next === "terminee" ? "Promotion diplômée" : "Promotion en formation",
      message: selected.label,
    });
  }

  if (!selected) {
    return (
      <div className="space-y-6">
        <PageHeader kicker="Pilotage" title="Tableau de bord" description="Aucune promotion enregistrée." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Pilotage"
        title={selected.label}
        description={
          inTraining
            ? `${selected.academicYear} · encore en formation. Les abandons et les exclus se suivent à part.`
            : `${selected.academicYear} · promotion diplômée. Les abandons et les exclus restent visibles.`
        }
        actions={
          <Button variant={inTraining ? "primary" : "secondary"} size="sm" onClick={() => void toggleCohort()}>
            {inTraining ? "Marquer diplômée" : "Remettre en formation"}
          </Button>
        }
      />

      <DashboardAlerts />

      <div className="flex flex-wrap gap-2">
        {promotions.map((item) => {
          const active = item.id === selected.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPickedId(item.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-navy-900 text-white"
                  : "border border-hairline bg-white text-slate-600 hover:border-navy-900/30 hover:text-navy-900",
              )}
            >
              {item.label.replace(" promotion", "")}
              <span className={cn("ml-2 text-[11px] font-medium", active ? "text-white/70" : "text-slate-400")}>
                {item.academicYear}
              </span>
            </button>
          );
        })}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Effectif"
          value={scoped.length}
          hint={`${counts.interne} internes · ${counts.externe} externes`}
          icon={Users}
          gradient="brand"
        />
        <StatCard
          label={inTraining ? "En formation" : "Diplômés"}
          value={counts.cohort}
          hint={share(counts.cohort, scoped.length)}
          icon={GraduationCap}
          gradient={inTraining ? "sky" : "mint"}
        />
        <StatCard
          label="Abandons"
          value={counts.abandon}
          hint={share(counts.abandon, scoped.length)}
          icon={UserMinus}
          gradient="sunset"
        />
        <StatCard
          label="Exclus"
          value={counts.exclu}
          hint={share(counts.exclu, scoped.length)}
          icon={UserX}
          gradient="blush"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="font-display text-base font-bold text-slate-900">Répartition</h2>
          <p className="mt-1 text-sm text-slate-500">
            {inTraining ? "En formation" : "Diplômés"}, abandons et exclus — {selected.label}.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-8">
            <Donut data={slices} centerValue={scoped.length} centerLabel="élèves" size={172} />
            <Legend data={slices} total={scoped.length} />
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-base font-bold text-slate-900">Par catégorie</h2>
          <p className="mt-1 text-sm text-slate-500">Effectif de {selected.label}.</p>
          <div className="mt-5">
            <ColumnChart data={byCategory} height={168} />
          </div>
        </Card>
      </div>

    </div>
  );
}

function share(part: number, total: number) {
  if (!total) return "—";
  return `${Math.round((part / total) * 100)} % de l’effectif`;
}
