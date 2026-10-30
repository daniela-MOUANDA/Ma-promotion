import { Button } from "@/components/ui/Button";
import { CompetitionStatusBadge } from "@/components/ui/Badge";
import { COMPETITION_STATUS_LABEL } from "@/constants/labels";
import { formatRange } from "@/lib/format";
import type { Competition } from "@/types/domain";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const INTERVAL_MS = 5200;

export function CompetitionSpotlight({ competitions }: { competitions: Competition[] }) {
  const items = [...competitions].sort((a, b) => rank(a.status) - rank(b.status));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  if (items.length === 0) {
    return <p className="text-sm text-white/70">Aucun concours publié pour le moment.</p>;
  }

  const current = items[index];

  return (
    <aside
      className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur sm:p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Sessions de concours"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
        Concours à l’affiche
      </p>
      <div key={current.id} className="spotlight-slide mt-3">
        <CompetitionStatusBadge status={current.status} />
        <h2 className="mt-3 font-display text-xl font-extrabold tracking-tight sm:text-2xl">
          {current.name}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/70">{current.summary}</p>
        <p className="mt-5 text-sm text-white/80">
          Candidatures : {formatRange(current.opensAt, current.closesAt)}
        </p>
        <Link to={`/concours/${current.slug}`} className="mt-6 inline-block">
          <Button variant="onDark" size="sm">
            Détail de la session
          </Button>
        </Link>
      </div>
      {items.length > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {items.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                className={
                  itemIndex === index ? "h-1.5 w-6 rounded-full bg-white" : "h-1.5 w-2.5 rounded-full bg-white/30"
                }
                onClick={() => setIndex(itemIndex)}
                aria-label={`Afficher ${item.name}`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/25 text-white transition-colors hover:bg-white/10"
              onClick={() => setIndex((currentIndex) => (currentIndex - 1 + items.length) % items.length)}
              aria-label="Session précédente"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/25 text-white transition-colors hover:bg-white/10"
              onClick={() => setIndex((currentIndex) => (currentIndex + 1) % items.length)}
              aria-label="Session suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function rank(status: Competition["status"]) {
  if (status === "open") return 0;
  if (status === "upcoming") return 1;
  return 2;
}

export function CompetitionTicker({ competitions }: { competitions: Competition[] }) {
  if (competitions.length === 0) return null;
  const line = competitions
    .map((item) => `${item.name} — ${COMPETITION_STATUS_LABEL[item.status]} · ${formatRange(item.opensAt, item.closesAt)}`)
    .join("   ·   ");

  return (
    <div className="overflow-hidden border-y border-white/10 bg-navy-900 py-2.5 text-white">
      <p className="ticker-track whitespace-nowrap px-4 text-xs uppercase tracking-[0.18em] text-white/60">
        {line}   ·   {line}
      </p>
    </div>
  );
}
