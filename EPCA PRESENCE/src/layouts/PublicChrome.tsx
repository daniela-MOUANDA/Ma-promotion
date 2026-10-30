import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/LayoutBits";
import { SITE } from "@/constants/site";
import { cn } from "@/lib/cn";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { scrollToTop } from "@/lib/scroll";
import { Link, NavLink, useLocation } from "react-router-dom";

const links = [
  { to: "/promotions", label: "Promotions" },
  { to: "/galerie", label: "Galerie" },
  { to: "/anciens", label: "Témoignages" },
  { to: "/ecole", label: "L’école" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const { pathname } = useLocation();
  const active = links.find((link) => pathname.startsWith(link.to))?.to ?? null;
  const highlight = hovered ?? active;

  return (
    <header className="sticky top-0 z-50 h-0">
      <div className="absolute inset-x-0 top-3 flex justify-center px-3 sm:top-4">
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-6xl overflow-hidden rounded-[1.6rem] border border-white/60 bg-white/80 shadow-float backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between gap-3 py-2 pl-4 pr-2 sm:pl-5">
            <Link
              to="/"
              aria-label="EPCA — retour à l’accueil"
              onClick={() => {
                setOpen(false);
                // Déjà sur l’accueil : le lien ne change pas de page, on remonte donc nous-mêmes.
                // Sur une autre page, le changement d’URL remonte tout seul (PublicLayout).
                if (pathname === "/") scrollToTop();
              }}
            >
              <Logo size="sm" withName />
            </Link>

            <nav className="relative hidden items-center xl:flex" onMouseLeave={() => setHovered(null)}>
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onMouseEnter={() => setHovered(link.to)}
                  className="relative rounded-full px-4 py-2 text-[13px] font-semibold"
                >
                  {highlight === link.to ? (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-navy-900"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 transition-colors",
                      highlight === link.to ? "text-white" : "text-ink-soft",
                    )}
                  >
                    {link.label}
                  </span>
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-1.5">
              <NavLink
                to="/administration"
                className="hidden rounded-full px-3 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:text-navy-900 md:inline-flex"
              >
                Admin
              </NavLink>
              <NavLink
                to="/promotions"
                className="inline-flex items-center rounded-full bg-sky px-4 py-2.5 text-[13px] font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
              >
                Mon profil
              </NavLink>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full text-navy-900 xl:hidden"
                aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
                onClick={() => setOpen((current) => !current)}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {open ? (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-line xl:hidden"
              >
                <div className="grid gap-1 p-3">
                  {links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "rounded-2xl px-4 py-3 text-sm font-semibold text-ink-soft",
                          isActive && "bg-navy-900 text-white",
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </motion.nav>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
      <p className="sr-only">{SITE.portalName}</p>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-navy-950 text-white">
      <Container className="relative grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link to="/" aria-label="EPCA — retour à l’accueil" onClick={() => scrollToTop()}>
            <Logo size="lg" withName inverted />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/50">{SITE.subtitle}</p>
        </div>
        <div>
          <p className="font-display text-lg font-bold">Explorer</p>
          <ul className="mt-4 space-y-3 text-sm text-white/55">
            <li>
              <NavLink to="/promotions" className="transition-colors hover:text-white">
                Promotions
              </NavLink>
            </li>
            <li>
              <NavLink to="/galerie" className="transition-colors hover:text-white">
                Galerie
              </NavLink>
            </li>
            <li>
              <NavLink to="/anciens" className="transition-colors hover:text-white">
                Témoignages
              </NavLink>
            </li>
            <li>
              <NavLink to="/administration" className="transition-colors hover:text-white">
                Administration
              </NavLink>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-display text-lg font-bold">Contact</p>
          <ul className="mt-4 space-y-3 text-sm text-white/55">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-glow" />
              {SITE.country}
            </li>
            <li className="flex gap-2">
              <Phone className="h-4 w-4 text-glow" />
              À publier
            </li>
            <li className="flex gap-2">
              <Mail className="h-4 w-4 text-glow" />
              contact@epca.placeholder.ga
            </li>
          </ul>
        </div>
      </Container>

      <p
        aria-hidden
        className="text-glass-gold pointer-events-none select-none px-4 text-center font-display text-[clamp(2.4rem,11.5vw,15rem)] font-extrabold leading-[0.85] tracking-[-0.05em]"
      >
        Ma Promotion
      </p>

      <div className="relative border-t border-white/10">
        <Container className="flex flex-col items-center gap-2 py-5 text-center text-xs text-white/35 md:flex-row md:justify-between md:text-left">
          <p>
            © {new Date().getFullYear()} {SITE.name}
          </p>
          <p>Do by MMD</p>
        </Container>
      </div>
    </footer>
  );
}
