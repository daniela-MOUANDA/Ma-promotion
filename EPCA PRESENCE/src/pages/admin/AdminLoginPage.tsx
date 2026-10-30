import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SITE } from "@/constants/site";
import { api, ApiError } from "@/lib/api";
import { setAdminSession } from "@/lib/admin-session";
import { getRemoteError, isRemoteEnabled } from "@/lib/remote";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const DEMO_LOGIN = "admin";
const DEMO_PASSWORD = "epca-demo";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const remote = isRemoteEnabled();
  const remoteError = getRemoteError();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!remote) {
      if (login === DEMO_LOGIN && password === DEMO_PASSWORD) {
        setAdminSession();
        navigate("/admin", { replace: true });
        return;
      }
      setError(
        remoteError
          ? `Base injoignable (${remoteError}). En local : admin / epca-demo.`
          : "Identifiants de démonstration incorrects.",
      );
      return;
    }

    setPending(true);
    try {
      const result = await api<{ token: string }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });
      setAdminSession(result.token);
      navigate("/admin", { replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Connexion impossible.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-2">
      <section className="mesh-hero relative hidden flex-col justify-between px-12 py-12 text-white lg:flex">
        <div className="relative">
          <Logo size="lg" withName inverted />
        </div>
        <div className="relative">
          <div className="gold-rule mb-6" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">Back-office</p>
          <h1 className="mt-4 max-w-md font-display text-5xl font-semibold leading-[1.05] tracking-tight">
            Ma Promotion
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/60">
            Espace réservé à l’administration : promotions, filières, profils et validation des parcours
            des anciens.
          </p>
        </div>
        <p className="relative text-xs text-white/40">EPCA · Gabon · usage interne</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md border border-hairline bg-white p-8">
          <div className="lg:hidden">
            <Logo size="md" withName />
          </div>
          <div className="gold-rule mt-6 mb-5 lg:mt-0" />
          <h2 className="font-display text-3xl font-semibold tracking-tight text-navy-900">
            Connexion
          </h2>
          <p className="mt-2 text-sm text-ink-soft">Accès personnel — {SITE.shortName}</p>
          <p className="mt-5 border-l-2 border-gold bg-brand-50 px-3 py-2.5 text-xs leading-5 text-navy-800">
            {remote ? (
              <>
                Compte principal : identifiant <strong>principal</strong>, mot de passe{" "}
                <strong>EPCA-Principal-2026</strong>.
              </>
            ) : (
              <>
                Démonstration : identifiant <strong>admin</strong>, mot de passe <strong>epca-demo</strong>
                {remoteError ? (
                  <>
                    {" "}
                    — MySQL n’est pas encore relié ({remoteError}).
                  </>
                ) : null}
              </>
            )}
          </p>
          <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
            <Field label="Identifiant">
              <Input value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" />
            </Field>
            <Field label="Mot de passe">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </Field>
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Connexion…" : "Accéder au back-office"}
            </Button>
          </form>
          <Link
            to="/"
            className="mt-6 inline-block text-xs font-semibold text-slate-400 transition-colors hover:text-brand-600"
          >
            Retour au portail
          </Link>
        </div>
      </section>
    </div>
  );
}
