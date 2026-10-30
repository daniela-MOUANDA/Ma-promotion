import { ExportButtons } from "@/components/admin/ExportButtons";
import { GroupedNameList } from "@/components/lists/GroupedNameList";
import { Container, EmptyState, PageIntro } from "@/components/ui/LayoutBits";
import { getApplicationById } from "@/lib/applications-store";
import { getCategory, getCompetition, getFiliere } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { publicationSubtitle } from "@/lib/list-export";
import { useApplications, usePublications } from "@/lib/use-live-data";
import type { Application } from "@/types/domain";
import { Medal } from "lucide-react";

export function ResultsPage() {
  const publications = usePublications().filter((item) => item.type === "resultats" && item.published);
  const applications = useApplications();

  return (
    <Container className="py-10 md:py-14">
      <PageIntro
        kicker="Résultats"
        title="Publication des résultats"
        description="Les listes d’admis ne sont visibles que lorsqu’une session a été officiellement publiée par l’administration."
      />
      <div className="mt-10 space-y-6">
        {publications.map((item) => {
          const people = item.applicationIds
            .map((id) => getApplicationById(id))
            .filter((application): application is Application => Boolean(application));
          const fallback = applications.filter((application) => item.applicationIds.includes(application.id));
          const list = people.length ? people : fallback;
          return (
            <article
              key={item.id}
              className="rounded-2xl border border-hairline bg-white p-5 shadow-card sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-900 text-white">
                    <Medal className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-bold text-slate-900 sm:text-lg">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {getCompetition(item.competitionId)?.name}
                      {item.categoryId ? ` · ${getCategory(item.categoryId)?.code}` : ""}
                      {item.filiereId ? ` · ${getFiliere(item.filiereId)?.name}` : ""}
                      {" · "}
                      {formatDate(item.createdAt.slice(0, 10))}
                    </p>
                  </div>
                </div>
                <ExportButtons
                  applications={list}
                  meta={{
                    title: item.title,
                    subtitle: publicationSubtitle(item.competitionId),
                    extra: "Résultats officiels",
                  }}
                />
              </div>
              <GroupedNameList applications={list} />
            </article>
          );
        })}
        {publications.length === 0 ? (
          <EmptyState
            title="Aucune liste publiée"
            description="Dès qu’un concours aura une liste d’admis rendue publique, elle apparaîtra ici."
          />
        ) : null}
      </div>
    </Container>
  );
}
