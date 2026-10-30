import { ExportButtons } from "@/components/admin/ExportButtons";
import { GroupedNameList } from "@/components/lists/GroupedNameList";
import { Container, EmptyState, PageIntro } from "@/components/ui/LayoutBits";
import { getApplicationById } from "@/lib/applications-store";
import { getCategory, getCompetition, getFiliere } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { publicationSubtitle } from "@/lib/list-export";
import { useApplications, usePublications } from "@/lib/use-live-data";
import type { Application, Publication } from "@/types/domain";
import { CalendarClock, ShieldCheck } from "lucide-react";

function peopleOf(item: Publication, applications: Application[]) {
  const fromStore = item.applicationIds
    .map((id) => getApplicationById(id))
    .filter((application): application is Application => Boolean(application));
  if (fromStore.length) return fromStore;
  return applications.filter((application) => item.applicationIds.includes(application.id));
}

export function ListsPage() {
  const publications = usePublications().filter(
    (item) => (item.type === "depot" || item.type === "autorises") && item.published,
  );
  const applications = useApplications();
  const dropOff = publications.filter((item) => item.type === "depot");
  const authorized = publications.filter((item) => item.type === "autorises");

  return (
    <Container className="py-10 md:py-14">
      <PageIntro
        kicker="Convocations"
        title="Listes officielles"
        description="Jours de dépôt du dossier physique et listes définitives des candidats autorisés aux épreuves, dès publication par l’administration."
      />

      <section className="mt-10">
        <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          Dépôt physique
        </h2>
        <div className="mt-4 space-y-6">
          {dropOff.map((item) => {
            const people = peopleOf(item, applications);
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-hairline bg-white p-5 shadow-card sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-900 text-white">
                      <CalendarClock className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {getCompetition(item.competitionId)?.name}
                        {item.categoryId ? ` · ${getCategory(item.categoryId)?.code}` : ""}
                        {item.filiereId ? ` · ${getFiliere(item.filiereId)?.name}` : ""}
                      </p>
                      <p className="mt-3 text-sm font-medium text-slate-900">
                        {item.dropOffDate ? formatDate(item.dropOffDate) : "Date à confirmer"} ·{" "}
                        {item.dropOffSlot === "soir" ? "Après-midi" : "Matin"} · {item.venue}
                      </p>
                    </div>
                  </div>
                  <ExportButtons
                    applications={people}
                    meta={{
                      title: item.title,
                      subtitle: publicationSubtitle(item.competitionId, item.dropOffDate, item.venue),
                      extra: item.dropOffSlot === "soir" ? "Après-midi" : "Matin",
                    }}
                  />
                </div>
                <GroupedNameList applications={people} />
              </article>
            );
          })}
          {dropOff.length === 0 ? (
            <EmptyState
              title="Aucune convocation publiée"
              description="Dès que l’administration publiera les jours de dépôt, les listes apparaîtront ici."
            />
          ) : null}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          Autorisés aux épreuves
        </h2>
        <div className="mt-4 space-y-6">
          {authorized.map((item) => {
            const people = peopleOf(item, applications);
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-hairline bg-white p-5 shadow-card sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-900 text-white">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{getCompetition(item.competitionId)?.name}</p>
                    </div>
                  </div>
                  <ExportButtons
                    applications={people}
                    meta={{
                      title: item.title,
                      subtitle: publicationSubtitle(item.competitionId),
                      extra: "Liste définitive",
                    }}
                  />
                </div>
                <GroupedNameList applications={people} />
              </article>
            );
          })}
          {authorized.length === 0 ? (
            <EmptyState
              title="Aucune liste d’autorisés"
              description="La liste définitive des candidats autorisés aux épreuves sera publiée ici."
            />
          ) : null}
        </div>
      </section>
    </Container>
  );
}
