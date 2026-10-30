import { adminAlertCounts } from "@/lib/admin-alerts";
import { useAlumni, usePromotionStudents } from "@/lib/use-live-data";
import { Bell, ImageIcon, MessageSquareQuote, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const ITEMS = [
  {
    key: "photos" as const,
    label: "Photos",
    hint: "Portraits proposés depuis les profils",
    to: "/admin/etudiants",
    icon: ImageIcon,
  },
  {
    key: "contacts" as const,
    label: "Contacts",
    hint: "E-mail ou téléphone à publier",
    to: "/admin/anciens",
    icon: Phone,
  },
  {
    key: "testimonials" as const,
    label: "Témoignages",
    hint: "Parcours envoyés par les anciens",
    to: "/admin/anciens",
    icon: MessageSquareQuote,
  },
];

export function DashboardAlerts() {
  const counts = adminAlertCounts(usePromotionStudents(), useAlumni());
  const banners = ITEMS.filter((item) => counts[item.key] > 0);
  if (banners.length === 0) return null;

  return (
    <div className="space-y-3">
      {banners.map((item) => {
        const count = counts[item.key];
        const Icon = item.icon;
        const noun =
          item.key === "photos"
            ? `photo${count > 1 ? "s" : ""}`
            : item.key === "contacts"
              ? `contact${count > 1 ? "s" : ""}`
              : `témoignage${count > 1 ? "s" : ""}`;
        return (
          <div
            key={item.key}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-600 text-white">
              <Icon className="h-4 w-4" />
            </span>
            <p className="min-w-0 flex-1 text-sm text-navy-900">
              <strong>
                {count} {noun}
              </strong>{" "}
              en attente de validation : proposé{count > 1 ? "s" : ""} depuis les profils.
            </p>
            <Link
              to={item.to}
              className="inline-flex h-9 items-center rounded-full bg-navy-900 px-4 text-[13px] font-semibold text-white hover:bg-navy-800"
            >
              Examiner
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export function AdminAlertsBell() {
  const counts = adminAlertCounts(usePromotionStudents(), useAlumni());
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-hairline text-slate-500 transition-colors hover:text-brand-600"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className="h-5 w-5" />
        {counts.total > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {counts.total}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
            Alertes
          </p>
          {counts.total === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">Rien à valider.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {ITEMS.filter((item) => counts[item.key] > 0).map((item) => {
                const Icon = item.icon;
                const count = counts[item.key];
                return (
                  <li key={item.key}>
                    <Link
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-rose-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
                        <span className="block text-xs text-slate-500">
                          {count} à valider · {item.hint}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
