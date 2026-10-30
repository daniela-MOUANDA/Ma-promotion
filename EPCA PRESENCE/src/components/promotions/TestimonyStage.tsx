import { StudentAvatar } from "@/components/promotions/StudentAvatar";
import { getPublicStudent, studentProfilePath } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { AlumniFeedback } from "@/types/domain";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const AUTO_MS = 8000;

/** Scène plein format : un témoignage à la fois, qui change seul. À placer sur fond sombre. */
export function TestimonyStage({ items }: { items: AlumniFeedback[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;
  const safeIndex = count === 0 ? 0 : index % count;

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % count), AUTO_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, count]);

  if (count === 0) {
    return (
      <p className="text-center text-sm text-white/55">
        Les témoignages publiés apparaîtront ici dès leur validation.
      </p>
    );
  }

  const current = items[safeIndex];
  const student = getPublicStudent(current.studentId);
  const role = [current.careerTitle, current.careerOrganization].filter(Boolean).join(" · ");

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-2 -top-16 select-none font-display text-[16rem] font-extrabold leading-none text-glow/15 md:-left-6 md:text-[22rem]"
      >
        “
      </span>

      <div className="relative grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
        <div className="min-h-[19rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-display text-3xl font-semibold leading-[1.18] tracking-tight text-white sm:text-4xl md:text-[2.6rem]">
                {current.experience}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/25">
                  <StudentAvatar
                    photoUrl={student?.photoUrl}
                    fullName={current.fullName}
                    textClass="text-lg"
                  />
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-white">{current.fullName}</p>
                  {role ? <p className="text-sm text-white/55">{role}</p> : null}
                </div>
                {student ? (
                  <Link
                    to={studentProfilePath(student)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-navy-900"
                  >
                    Voir le profil <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col justify-between gap-6">
          <ul className="space-y-2">
            {items.slice(0, 6).map((item, itemIndex) => {
              const isActive = itemIndex === safeIndex;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(itemIndex)}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left transition-colors",
                      isActive
                        ? "border-white/25 bg-white/10"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "block h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-2 transition-all",
                          isActive ? "ring-glow" : "opacity-70 ring-white/10",
                        )}
                      >
                        <StudentAvatar
                          photoUrl={getPublicStudent(item.studentId)?.photoUrl}
                          fullName={item.fullName}
                          textClass="text-xs"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">{item.fullName}</span>
                        <span className="block truncate text-xs text-white/45">
                          {item.careerTitle || "Ancien élève EPCA"}
                        </span>
                      </span>
                    </div>
                    {isActive && count > 1 && !paused ? (
                      <motion.span
                        key={`bar-${current.id}`}
                        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-glow"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {count > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Témoignage précédent"
                onClick={() => setIndex((safeIndex - 1 + count) % count)}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-navy-900"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Témoignage suivant"
                onClick={() => setIndex((safeIndex + 1) % count)}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-navy-900"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="ml-2 font-display text-sm font-semibold text-white/50">
                {String(safeIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
