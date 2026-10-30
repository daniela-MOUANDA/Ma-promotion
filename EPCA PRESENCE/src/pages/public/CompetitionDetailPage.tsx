import { CompetitionStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container, PageIntro } from "@/components/ui/LayoutBits";
import { getCategories, getCompetition, getFilieres } from "@/lib/catalog";
import { formatDate, formatRange } from "@/lib/format";
import { ArrowRight, CalendarClock, FileText, ListChecks, MapPin, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

export function CompetitionDetailPage() {
  const { slug = "" } = useParams();
  const competition = getCompetition(slug);

  if (!competition) {
    return (
      <Container className="py-16">
        <PageIntro title="Concours introuvable" description="Cette session n’existe pas ou n’est plus publiée." />
        <Link to="/concours" className="mt-6 inline-block text-sm font-semibold text-brand-600">
          Retour aux concours
        </Link>
      </Container>
    );
  }

  const cats = getCategories().filter((item) => competition.categoryIds.includes(item.id));
  const filieres = getFilieres().filter((item) => competition.filiereIds.includes(item.id));
  const canApply = competition.status === "open";

  return (
    <div className="bg-canvas pb-16">
      <section className="mesh-hero relative overflow-hidden text-white">
        <div className="grid-lines absolute inset-0" aria-hidden />
        <Container className="relative py-10 md:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Session {competition.year}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              {competition.name}
            </h1>
            <CompetitionStatusBadge status={competition.status} />
          </div>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-white/70 sm:text-base">
            {competition.summary}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {canApply ? (
              <Link to={`/candidature?concours=${competition.slug}`} className="w-full sm:w-auto">
                <Button size="lg" variant="light" className="w-full sm:w-auto">
                  Candidater à cette session
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="w-full sm:w-auto" disabled>
                Candidatures fermées
              </Button>
            )}
            <Link to="/candidature/suivi" className="w-full sm:w-auto">
              <Button variant="onDark" size="lg" className="w-full sm:w-auto">
                Suivre une candidature
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
            <HeroFact icon={CalendarClock} label="Candidatures">
              {formatRange(competition.opensAt, competition.closesAt)}
            </HeroFact>
            <HeroFact icon={MapPin} label="Épreuves">
              {competition.examAt ? formatDate(competition.examAt) : "Date à publier"}
            </HeroFact>
            <HeroFact icon={Users} label="Places offertes">
              {competition.seats ? `${competition.seats} places` : "À préciser"}
            </HeroFact>
          </div>
        </Container>
      </section>

      <Container className="mt-8 grid gap-4 sm:gap-5 md:mt-10 lg:grid-cols-3">
        <Panel title="Conditions" icon={ListChecks}>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-500">
            {competition.conditions.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {competition.conditions.length === 0 ? <li>Conditions à publier.</li> : null}
          </ul>
        </Panel>
        <Panel title="Pièces demandées" icon={FileText}>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-500">
            {competition.documents.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {competition.documents.length === 0 ? <li>Liste à publier.</li> : null}
          </ul>
        </Panel>
        <Panel title="Calendrier" icon={CalendarClock}>
          <ol className="space-y-2 text-sm">
            {competition.calendar.map((item) => (
              <li key={item.label} className="flex justify-between gap-4 border-b border-hairline py-2 last:border-0">
                <span className="text-slate-700">{item.label}</span>
                <span className="text-slate-500">{formatDate(item.date)}</span>
              </li>
            ))}
            {competition.calendar.length === 0 ? (
              <li className="text-slate-500">Calendrier à publier.</li>
            ) : null}
          </ol>
        </Panel>
      </Container>

      <Container className="mt-4 grid gap-4 sm:gap-5 md:mt-5 md:grid-cols-2">
        <Panel title="Catégories ouvertes" icon={Users}>
          <ul className="space-y-2 text-sm">
            {cats.map((item) => (
              <li key={item.id} className="flex items-start gap-2">
                <span className="mt-0.5 rounded-md bg-brand-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-700">
                  {item.code}
                </span>
                <span className="text-slate-600">{item.name}</span>
              </li>
            ))}
            {cats.length === 0 ? <li className="text-slate-500">Aucune catégorie rattachée.</li> : null}
          </ul>
        </Panel>
        <Panel title="Filières proposées" icon={ListChecks}>
          <ul className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            {filieres.map((item) => (
              <li key={item.id} className="rounded-xl bg-slate-50 px-3 py-2">
                {item.name}
              </li>
            ))}
            {filieres.length === 0 ? <li className="text-slate-500">Aucune filière rattachée.</li> : null}
          </ul>
        </Panel>
      </Container>

      {competition.instructions ? (
        <Container className="mt-5">
          <p className="rounded-2xl border border-brand-100 bg-brand-50 p-5 text-sm leading-6 text-brand-700">
            {competition.instructions}
          </p>
        </Container>
      ) : null}
    </div>
  );
}

function HeroFact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Users;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{label}</p>
        <p className="text-sm font-semibold">{children}</p>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Users;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-hairline bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-900 text-white">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}
