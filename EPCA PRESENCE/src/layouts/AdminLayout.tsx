import { AdminAlertsBell } from "@/components/admin/AdminAlerts";
import { FeedbackProvider } from "@/components/feedback/FeedbackProvider";
import { cn } from "@/lib/cn";
import { clearAdminSession } from "@/lib/admin-session";
import {
  GraduationCap,
  Images,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Search,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

const groups = [
  {
    label: "Pilotage",
    items: [{ to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Ma Promotion",
    items: [
      { to: "/admin/promotions", label: "Promotions", icon: GraduationCap },
      { to: "/admin/filieres", label: "Catégories & filières", icon: Layers },
      { to: "/admin/etudiants", label: "Élèves & profils", icon: Users },
      { to: "/admin/anciens", label: "Parcours des anciens", icon: MessageSquareQuote },
      { to: "/admin/galerie", label: "Galerie photos", icon: Images },
    ],
  },
];

const TITLES: { match: string; end?: boolean; title: string }[] = [
  { match: "/admin", end: true, title: "Tableau de bord" },
  { match: "/admin/promotions", title: "Promotions" },
  { match: "/admin/filieres", title: "Catégories & filières" },
  { match: "/admin/etudiants", title: "Élèves & profils" },
  { match: "/admin/anciens", title: "Parcours des anciens" },
  { match: "/admin/galerie", title: "Galerie photos" },
];

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <img src="/logo-epca-white.png" alt="Logo de l’EPCA" className="h-12 w-auto shrink-0 object-contain" />
        <div className="min-w-0">
          <p className="font-display text-sm font-extrabold tracking-tight text-white">Ma Promotion</p>
          <p className="truncate text-[11px] text-white/45">Back-office EPCA</p>
        </div>
      </div>

      <nav className="scroll-slim min-h-0 flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={"end" in item ? item.end : false}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/60 transition-all hover:bg-white/5 hover:text-white",
                      isActive && "grad-brand text-white shadow-glow hover:bg-transparent",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-white/50")} />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-5">
        <div className="glass-panel rounded-2xl p-4">
          <p className="font-display text-[13px] font-bold text-white">Session administrateur</p>
          <p className="mt-1 text-[11px] leading-5 text-white/50">
            Pensez à vous déconnecter en quittant le poste.
          </p>
          <button
            type="button"
            onClick={() => {
              void fetch("/api/admin/logout", {
                method: "POST",
                headers: { Authorization: `Bearer ${sessionStorage.getItem("epca.admin.token") ?? ""}` },
              }).catch(() => undefined);
              clearAdminSession();
              navigate("/administration");
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentTitle = useMemo(() => {
    const found = [...TITLES]
      .sort((a, b) => b.match.length - a.match.length)
      .find((item) =>
        item.end ? location.pathname === item.match : location.pathname.startsWith(item.match),
      );
    return found?.title ?? "Administration";
  }, [location.pathname]);

  return (
    <FeedbackProvider>
      <div className="h-dvh overflow-hidden bg-canvas text-slate-800">
        <aside className="grad-night fixed inset-y-0 left-0 z-30 hidden h-dvh w-[264px] flex-col overflow-hidden lg:flex">
          <SidebarBody />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              aria-label="Fermer le menu"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="grad-night relative h-full w-[264px] overflow-hidden shadow-float">
              <button
                type="button"
                className="absolute right-3 top-4 text-white/60 hover:text-white"
                aria-label="Fermer"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        ) : null}

        <div className="flex h-dvh min-w-0 flex-col overflow-hidden lg:pl-[264px]">
          <header className="sticky top-0 z-20 shrink-0 border-b border-hairline bg-white/85 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-xl border border-hairline text-slate-600 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Ma Promotion — administration
                </p>
                <p className="truncate font-display text-[17px] font-bold tracking-tight text-slate-900">
                  {currentTitle}
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-xl border border-hairline bg-slate-50 px-3 py-2 md:flex">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  placeholder="Rechercher un profil…"
                  className="w-52 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    const value = (event.target as HTMLInputElement).value.trim();
                    if (value) navigate(`/admin/etudiants`);
                  }}
                />
              </div>

              <AdminAlertsBell />

              <div className="flex items-center gap-2 rounded-xl border border-hairline bg-white py-1 pl-1 pr-3">
                <span className="grad-brand grid h-8 w-8 place-items-center rounded-lg font-display text-xs font-bold text-white">
                  AD
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-[13px] font-semibold leading-4 text-slate-800">Administration</span>
                  <span className="block text-[11px] leading-4 text-slate-400">Ma Promotion</span>
                </span>
              </div>
            </div>
          </header>

          <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </FeedbackProvider>
  );
}
