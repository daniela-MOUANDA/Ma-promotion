import { PLACEHOLDER_CONTACT } from "@/constants/site";
import { Reveal } from "@/components/motion/Reveal";
import { Container, DemoNotice, PageHero } from "@/components/ui/LayoutBits";

export function ContactPage() {
  const rows = [
    { label: "Ville", value: `${PLACEHOLDER_CONTACT.city}, ${PLACEHOLDER_CONTACT.country}` },
    { label: "E-mail", value: PLACEHOLDER_CONTACT.email },
    { label: "Téléphone", value: PLACEHOLDER_CONTACT.phone },
  ];

  return (
    <div>
      <PageHero
        kicker="Contact"
        title="Écrire à l’administration."
        description="Les coordonnées ci-dessous seront remplacées par les informations officielles."
        image="/gallery/evt-06.jpg"
      />
      <Container className="py-16 md:py-24">
        <div className="max-w-xl">
          <DemoNotice>{PLACEHOLDER_CONTACT.note}</DemoNotice>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {rows.map((row, index) => (
            <Reveal key={row.label} delay={index * 0.08}>
              <div className="surface h-full break-words rounded-[1.75rem] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky">{row.label}</p>
                <p className="mt-3 font-display text-xl font-bold text-navy-900">{row.value}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </div>
  );
}
