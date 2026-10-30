import { StudentAvatar } from "@/components/promotions/StudentAvatar";
import { getPublicStudent, studentProfilePath } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { AlumniFeedback } from "@/types/domain";
import { Link } from "react-router-dom";

type Tone = "dark" | "light";

function QuoteCard({ item, tone }: { item: AlumniFeedback; tone: Tone }) {
  const student = getPublicStudent(item.studentId);
  const excerpt =
    item.experience.length > 150 ? `${item.experience.slice(0, 150).trim()}…` : item.experience;
  const dark = tone === "dark";

  const cardClass = cn(
    "mx-2 inline-flex w-[min(21rem,80vw)] shrink-0 flex-col justify-between rounded-[1.5rem] p-5 transition-transform hover:-translate-y-1",
    dark ? "glass text-white" : "surface text-navy-900",
  );

  const inner = (
    <>
      <p className="font-display text-lg font-semibold leading-snug">“{excerpt}”</p>
      <div className={cn("mt-5 flex items-center gap-3 border-t pt-4", dark ? "border-white/10" : "border-line")}>
        <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-xl">
          <StudentAvatar photoUrl={student?.photoUrl} fullName={item.fullName} textClass="text-sm" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{item.fullName}</p>
          <p className={cn("mt-0.5 truncate text-xs", dark ? "text-white/50" : "text-ink-soft")}>
            {[item.careerTitle, item.careerOrganization].filter(Boolean).join(" · ") || "Ancien élève EPCA"}
          </p>
        </div>
      </div>
    </>
  );

  return student ? (
    <Link to={studentProfilePath(student)} className={cardClass}>
      {inner}
    </Link>
  ) : (
    <article className={cardClass}>{inner}</article>
  );
}

const MIN_CARDS_PER_HALF = 8;
const SECONDS_PER_CARD = 6;

/**
 * Une moitié de piste doit être plus large que l'écran, sinon la boucle (-50 %) laisse un vide à droite.
 * On répète donc la liste jusqu'à avoir assez de cartes, par cycles entiers pour garder la boucle sans couture.
 */
function fillHalf(list: AlumniFeedback[]) {
  const cycles = Math.max(1, Math.ceil(MIN_CARDS_PER_HALF / list.length));
  return Array.from({ length: cycles }, () => list).flat();
}

export function TestimonyMarquee({ items, tone = "light" }: { items: AlumniFeedback[]; tone?: Tone }) {
  if (items.length === 0) return null;

  const fade = tone === "dark" ? "from-navy-950" : "from-wash";
  const halfA = fillHalf(items);
  const halfB = fillHalf([...items].reverse());
  const rowA = [...halfA, ...halfA];
  const rowB = [...halfB, ...halfB];

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden">
        <div className={cn("pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r to-transparent sm:w-24", fade)} />
        <div className={cn("pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l to-transparent sm:w-24", fade)} />
        <div className="marquee-track py-1" style={{ animationDuration: `${halfA.length * SECONDS_PER_CARD}s` }}>
          {rowA.map((item, index) => (
            <QuoteCard key={`a-${item.id}-${index}`} item={item} tone={tone} />
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className={cn("pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r to-transparent sm:w-24", fade)} />
        <div className={cn("pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l to-transparent sm:w-24", fade)} />
        <div className="marquee-track-rev py-1" style={{ animationDuration: `${halfB.length * (SECONDS_PER_CARD + 1)}s` }}>
          {rowB.map((item, index) => (
            <QuoteCard key={`b-${item.id}-${index}`} item={item} tone={tone} />
          ))}
        </div>
      </div>
    </div>
  );
}