import { Container, PageHero } from "@/components/ui/LayoutBits";
import { getFaqs } from "@/lib/catalog";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

export function FaqPage() {
  const items = getFaqs();
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div>
      <PageHero
        kicker="FAQ"
        title="Questions fréquentes."
        description="Les réponses sur le fonctionnement de Ma Promotion."
        image="/gallery/evt-11.jpg"
      />
      <Container className="py-16 md:py-24">
        <div className="max-w-3xl space-y-3">
          {items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className="surface overflow-hidden rounded-[1.5rem]">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-display text-lg font-bold text-navy-900">{item.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy-900 text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-sm leading-7 text-ink-soft">{item.answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
