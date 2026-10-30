import { Aurora } from "@/components/motion/Aurora";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { StudentCard } from "@/components/promotions/StudentCard";
import { Container, EmptyState } from "@/components/ui/LayoutBits";
import { getCategories, getFilieres, getPromotion, getPublicStudents } from "@/lib/catalog";
import { usePromotionsCatalog } from "@/lib/use-live-data";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export function PromotionExplorePage() {
  usePromotionsCatalog();
  const { promotionId = "", categoryId, filiereId } = useParams();
  const promotion = getPromotion(promotionId);
  const categories = getCategories();
  const selectedCategory = categories.find((item) => item.id === categoryId || item.code === categoryId);
  const filieres = selectedCategory
    ? getFilieres().filter((item) => item.categoryIds.includes(selectedCategory.id))
    : [];
  const selectedFiliere = filieres.find((item) => item.id === filiereId || item.code === filiereId);

  if (!promotion) {
    return (
      <Container className="pb-14 pt-36">
        <h1 className="font-display text-3xl font-semibold text-navy-900">Promotion introuvable</h1>
        <Link to="/promotions" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy-900">
          <ArrowLeft className="h-4 w-4" />
          Retour aux promotions
        </Link>
      </Container>
    );
  }

  const students = selectedFiliere
    ? getPublicStudents({
        promotionId: promotion.id,
        categoryId: selectedCategory?.id,
        filiereId: selectedFiliere.id,
      })
    : [];

  return (
    <div>
      <section className="stage relative overflow-hidden text-white">
        <Aurora />
        <Container className="relative pb-10 pt-28 md:pb-12 md:pt-32">
          <nav className="flex flex-wrap items-center gap-x-2 text-sm text-white/55">
            <Link to="/promotions" className="transition-colors hover:text-white">
              Promotions
            </Link>
            <span>/</span>
            <Link to={`/promotions/${promotion.number}`} className="transition-colors hover:text-white">
              {promotion.label}
            </Link>
            {selectedCategory ? (
              <>
                <span>/</span>
                <Link
                  to={`/promotions/${promotion.number}/${selectedCategory.code}`}
                  className="transition-colors hover:text-white"
                >
                  {selectedCategory.code}
                </Link>
              </>
            ) : null}
            {selectedFiliere ? (
              <>
                <span>/</span>
                <span className="text-white">{selectedFiliere.name}</span>
              </>
            ) : null}
          </nav>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-glow">
            {promotion.academicYear}
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
            <SplitText text={promotion.label} />
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">{promotion.summary}</p>
        </Container>
      </section>

      <Container className="py-14 md:py-20">
        {!selectedCategory ? (
          <>
            <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-navy-900">
              Choisissez une catégorie
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {categories.map((item, index) => (
                <Reveal key={item.id} delay={index * 0.05}>
                  <Link
                    to={`/promotions/${promotion.number}/${item.code}`}
                    className="group flex min-h-[9rem] flex-col items-center justify-center rounded-[1.75rem] border border-line bg-paper px-4 py-8 text-center transition-all duration-500 hover:-translate-y-1.5 hover:border-navy-900 hover:bg-navy-900"
                  >
                    <span className="font-display text-4xl font-extrabold tracking-tight text-navy-900 transition-colors duration-500 group-hover:text-white">
                      {item.code}
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </>
        ) : null}

        {selectedCategory && !selectedFiliere ? (
          <>
            <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-navy-900">
              Filières · {selectedCategory.code}
            </h2>
            <ul className="mt-8 space-y-3">
              {filieres.map((item, index) => (
                <Reveal key={item.id} delay={index * 0.05}>
                  <li>
                    <Link
                      to={`/promotions/${promotion.number}/${selectedCategory.code}/${item.code}`}
                      className="group flex items-center justify-between gap-4 rounded-[1.75rem] border border-line bg-paper px-6 py-6 transition-all duration-500 hover:-translate-y-0.5 hover:border-navy-900 hover:bg-navy-900"
                    >
                      <span>
                        <span className="block font-display text-2xl font-bold text-navy-900 transition-colors duration-500 group-hover:text-white">
                          {item.name}
                        </span>
                        <span className="mt-1 block text-sm text-ink-soft transition-colors duration-500 group-hover:text-white/55">
                          {item.description}
                        </span>
                      </span>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy-900 text-white transition-all duration-500 group-hover:rotate-45 group-hover:bg-glow group-hover:text-navy-900">
                        <ArrowUpRight className="h-5 w-5" />
                      </span>
                    </Link>
                  </li>
                </Reveal>
              ))}
              {filieres.length === 0 ? (
                <EmptyState
                  title="Aucune filière"
                  description="Aucune filière n’est rattachée à cette catégorie pour le moment."
                />
              ) : null}
            </ul>
          </>
        ) : null}

        {selectedFiliere ? (
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-navy-900">
              {selectedFiliere.name}
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              {selectedCategory?.code} · {students.length} profil(s) — cliquez sur un profil pour lire ou
              déposer un témoignage
            </p>
            {students.length === 0 ? (
              <div className="mt-8">
                <EmptyState
                  title="Aucun élève publié"
                  description="Les portraits publics apparaîtront lorsque l’administration les aura renseignés."
                />
              </div>
            ) : (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {students.map((student, index) => (
                  <Reveal key={student.id} delay={index * 0.05}>
                    <StudentCard student={student} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Container>
    </div>
  );
}
