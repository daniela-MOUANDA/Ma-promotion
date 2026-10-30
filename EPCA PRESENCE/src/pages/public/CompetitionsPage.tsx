import { CompetitionCard } from "@/components/competitions/CompetitionCard";
import { Container, PageIntro } from "@/components/ui/LayoutBits";
import { getCompetitions } from "@/lib/catalog";
import { useCompetitions } from "@/lib/use-live-data";

export function CompetitionsPage() {
  const competitions = useCompetitions();
  const open = competitions.filter((item) => item.status === "open");
  const upcoming = competitions.filter((item) => item.status === "upcoming");
  const closed = competitions.filter((item) => item.status === "closed");

  return (
    <Container className="py-10 md:py-14">
      <PageIntro
        kicker="Concours"
        title="Les sessions de recrutement"
        description="Consultez les concours ouverts, à venir et clos. Seule une session ouverte permet de déposer une candidature en ligne."
      />
      <Section title="Ouverts" items={open} empty="Aucun concours n’est ouvert pour le moment." />
      <Section title="À venir" items={upcoming} empty="Aucune session à venir n’est publiée." />
      <Section title="Clos" items={closed} empty="Aucun historique publié." />
    </Container>
  );
}

function Section({
  title,
  items,
  empty,
}: {
  title: string;
  items: ReturnType<typeof getCompetitions>;
  empty: string;
}) {
  return (
    <section className="mt-10 md:mt-12">
      <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:gap-5 md:grid-cols-2">
          {items.map((competition) => (
            <CompetitionCard key={competition.id} competition={competition} />
          ))}
        </div>
      )}
    </section>
  );
}
