import { Reveal } from "@/components/motion/Reveal";
import { Container, PageHero } from "@/components/ui/LayoutBits";
import { getCategories, getFilieres, getRegies } from "@/lib/catalog";
import { usePromotionsCatalog } from "@/lib/use-live-data";

export function SchoolPage() {
  usePromotionsCatalog();
  const categories = getCategories();
  const regies = getRegies();
  const filieres = getFilieres();

  const blocks = [
    { title: "Catégories", items: categories.map((item) => item.code) },
    { title: "Régies", items: regies.map((item) => item.name) },
    { title: "Filières", items: filieres.map((item) => item.name) },
  ];

  return (
    <div>
      <PageHero
        kicker="L’école"
        title="École de Préparation aux Carrières Administratives."
        description="L’EPCA forme aux métiers de l’administration. Ma Promotion présente ses promotions, ses filières et les parcours de ses anciens."
        image="/gallery/evt-10.jpg"
      />
      <Container className="py-16 md:py-24">
        <div className="max-w-3xl space-y-5 text-base leading-8 text-ink-soft">
          <p>
            Le cursus s’organise par catégorie, un tronc commun, une régie, puis une spécialisation de
            filière. Les intitulés exacts sont paramétrés par l’administration.
          </p>
        </div>
        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {blocks.map((block, index) => (
            <Reveal key={block.title} delay={index * 0.08}>
              <article className="surface h-full rounded-[1.75rem] p-7">
                <h2 className="font-display text-2xl font-bold text-navy-900">{block.title}</h2>
                <ul className="mt-5 space-y-2 text-sm text-ink-soft">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </section>
      </Container>
    </div>
  );
}
