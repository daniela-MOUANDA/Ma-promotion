import { Aurora } from "@/components/motion/Aurora";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { TestimonyStage } from "@/components/promotions/TestimonyStage";
import { Container, PageHero } from "@/components/ui/LayoutBits";
import { getPublishedAlumni } from "@/lib/alumni-store";
import { getPublicStudent, studentProfilePath } from "@/lib/catalog";
import { useAlumni, usePromotionsCatalog } from "@/lib/use-live-data";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function AlumniPage() {
  usePromotionsCatalog();
  useAlumni();
  const alumni = getPublishedAlumni();

  return (
    <div>
      <PageHero
        kicker="Témoignages"
        title="Les parcours racontés par ceux qui les ont vécus."
        description="Chaque témoignage est lié à un profil. Pour en déposer un, ouvrez d’abord votre fiche élève."
        image="/gallery/evt-03.jpg"
      >
        <Magnetic>
          <Link
            to="/promotions"
            className="inline-flex items-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-navy-900 shadow-glow"
          >
            Trouver mon profil
          </Link>
        </Magnetic>
      </PageHero>

      <section className="relative overflow-hidden bg-navy-950 py-20 text-white md:py-28">
        <Aurora />
        <Container className="relative">
          <TestimonyStage items={alumni} />
        </Container>
      </section>

      <Container className="py-20 md:py-28">
        <Reveal>
          <h2 className="font-display text-4xl font-extrabold tracking-[-0.03em] text-navy-900">
            Tous les témoignages
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {alumni.length === 0 ? (
            <p className="text-sm text-ink-soft">Aucun témoignage publié pour le moment.</p>
          ) : (
            alumni.map((item, index) => {
              const student = getPublicStudent(item.studentId);
              const body = (
                <>
                  <p className="font-display text-xl font-semibold leading-snug text-navy-900">
                    “{item.experience}”
                  </p>
                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
                    <div>
                      <p className="text-sm font-bold text-navy-900">{item.fullName}</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {[item.careerTitle, item.careerOrganization].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {student ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky">
                        Profil <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                </>
              );

              return (
                <Reveal key={item.id} delay={index * 0.05}>
                  {student ? (
                    <Link
                      to={studentProfilePath(student)}
                      className="surface block h-full rounded-[1.75rem] p-7 transition-transform hover:-translate-y-1"
                    >
                      {body}
                    </Link>
                  ) : (
                    <article className="surface h-full rounded-[1.75rem] p-7">{body}</article>
                  )}
                </Reveal>
              );
            })
          )}
        </div>
      </Container>
    </div>
  );
}
