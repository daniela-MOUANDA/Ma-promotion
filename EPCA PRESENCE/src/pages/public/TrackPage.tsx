import { Alert } from "@/components/ui/Alert";
import { ApplicationStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/LayoutBits";
import { APPLICATION_STATUS_LABEL } from "@/constants/labels";
import { findApplicationsByIdentity } from "@/lib/applications-store";
import { getCategory, getCompetition, getFiliere } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { useApplications, usePublications } from "@/lib/use-live-data";
import type { Application, ApplicationStatus } from "@/types/domain";
import {
  CalendarClock,
  Check,
  Copy,
  FileText,
  KeyRound,
  MapPin,
  Printer,
  Search,
  Sparkles,
  UserSearch,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const TIMELINE: { key: string; label: string; statuses: ApplicationStatus[] }[] = [
  { key: "submit", label: "Candidature enregistrée", statuses: ["SOUMISE"] },
  {
    key: "dropoff",
    label: "Convocation au dépôt",
    statuses: ["DOSSIER_PHYSIQUE_ATTENDU", "DOSSIER_PHYSIQUE_DEPOSE"],
  },
  {
    key: "check",
    label: "Dossier physique vérifié",
    statuses: ["DOSSIER_PHYSIQUE_VALIDE", "DOSSIER_PHYSIQUE_REJETE"],
  },
  { key: "auth", label: "Autorisation au concours", statuses: ["AUTORISE_CONCOURS", "NON_AUTORISE"] },
  { key: "result", label: "Résultat d’admission", statuses: ["ADMIS", "NON_ADMIS"] },
];

const ORDER: ApplicationStatus[] = [
  "BROUILLON",
  "SOUMISE",
  "DOSSIER_PHYSIQUE_ATTENDU",
  "DOSSIER_PHYSIQUE_DEPOSE",
  "DOSSIER_PHYSIQUE_VALIDE",
  "DOSSIER_PHYSIQUE_REJETE",
  "AUTORISE_CONCOURS",
  "NON_AUTORISE",
  "ADMIS",
  "NON_ADMIS",
  "ANNULEE",
];

type Convocation = {
  date: string;
  slot: "matin" | "soir" | null;
  venue: string | null;
  listTitle: string | null;
};

function slotLabel(slot: "matin" | "soir" | null | undefined) {
  return slot === "soir" ? "Après-midi (13h00 – 16h00)" : "Matin (08h00 – 12h00)";
}

function daysUntil(date: string) {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function TrackPage() {
  const [params, setParams] = useSearchParams();
  const applications = useApplications();
  const publications = usePublications();

  const number = params.get("numero") ?? "";
  const [input, setInput] = useState(number);
  const [mode, setMode] = useState<"numero" | "recuperation">("numero");

  const application = useMemo(
    () => applications.find((item) => item.number.toLowerCase() === number.trim().toLowerCase()),
    [applications, number],
  );

  const convocation = useMemo<Convocation | null>(() => {
    if (!application) return null;
    const publication = publications.find(
      (item) => item.type === "depot" && item.published && item.applicationIds.includes(application.id),
    );
    const date = application.dropOffDate ?? publication?.dropOffDate ?? null;
    if (!date) return null;
    return {
      date,
      slot: application.dropOffSlot ?? publication?.dropOffSlot ?? null,
      venue: application.dropOffVenue ?? publication?.venue ?? null,
      listTitle: publication?.title ?? null,
    };
  }, [application, publications]);

  const competition = application ? getCompetition(application.competitionId) : undefined;

  function search(event: React.FormEvent) {
    event.preventDefault();
    setParams(input.trim() ? { numero: input.trim() } : {});
  }

  const reachedIndex = application
    ? TIMELINE.findIndex((item) => item.statuses.includes(application.status))
    : -1;
  const currentIndex = application
    ? reachedIndex >= 0
      ? reachedIndex
      : ORDER.indexOf(application.status) > ORDER.indexOf("SOUMISE")
        ? TIMELINE.length - 1
        : 0
    : -1;

  return (
    <div className="bg-canvas pb-16">
      <section className="mesh-hero relative overflow-hidden text-white no-print">
        <div className="grid-lines absolute inset-0" aria-hidden />
        <Container className="relative py-10 md:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Suivi</p>
          <h1 className="mt-3 font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Suivre ma candidature
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/70 sm:text-base">
            Votre jour de dépôt s’affiche ici dès qu’il est fixé : inutile d’éplucher la liste officielle.
          </p>

          <div className="mt-8 flex w-full rounded-xl border border-white/15 bg-white/10 p-1 sm:inline-flex sm:w-auto">
            <TabButton active={mode === "numero"} onClick={() => setMode("numero")} icon={Search}>
              J’ai mon numéro
            </TabButton>
            <TabButton
              active={mode === "recuperation"}
              onClick={() => setMode("recuperation")}
              icon={UserSearch}
            >
              J’ai perdu mon numéro
            </TabButton>
          </div>

          {mode === "numero" ? (
            <form className="mt-4 flex max-w-xl flex-col gap-2 sm:flex-row" onSubmit={search}>
              <input
                id="numero"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="EPCA-2026-CAND-000001"
                aria-label="Numéro de candidature"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-base text-white sm:text-sm outline-none transition-all placeholder:text-white/40 focus:border-white/40 focus:bg-white/15"
              />
              <Button type="submit" variant="light" className="w-full sm:w-auto">
                <Search className="h-4 w-4" />
                Rechercher
              </Button>
            </form>
          ) : (
            <RecoveryForm
              onFound={(found) => {
                setInput(found.number);
                setMode("numero");
                setParams({ numero: found.number });
              }}
            />
          )}
        </Container>
      </section>

      <Container className="mt-10">
        {mode === "numero" && number && !application ? (
          <div className="mx-auto max-w-lg">
            <Alert tone="danger" title="Aucune candidature ne correspond à ce numéro">
              Vérifiez la saisie (format EPCA-AAAA-CAND-000000). Si vous ne retrouvez plus votre numéro,
              utilisez l’onglet « J’ai perdu mon numéro ».
            </Alert>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button variant="secondary" onClick={() => setMode("recuperation")}>
                <KeyRound className="h-4 w-4" />
                Retrouver mon numéro
              </Button>
              <Link to="/candidature">
                <Button>Déposer une candidature</Button>
              </Link>
            </div>
          </div>
        ) : null}

        {mode === "numero" && !number ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Sparkles className="h-7 w-7" />
            </span>
            <p className="mt-5 font-display text-lg font-bold text-slate-900">Votre dossier en un coup d’œil</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Entrez votre numéro pour connaître l’état de votre candidature, votre jour de dépôt et votre
              résultat lorsqu’ils sont publiés.
            </p>
          </div>
        ) : null}

        {application ? (
          <div className="space-y-5">
            <StatusAlert application={application} convocation={convocation} />

            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-2xl border border-hairline bg-white p-5 shadow-card sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="break-all font-mono text-sm text-slate-500">{application.number}</p>
                  <ApplicationStatusBadge status={application.status} />
                </div>
                <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {application.lastName} {application.firstNames}
                </h2>

                <dl className="mt-6 overflow-hidden rounded-2xl border border-hairline">
                  <Row label="Statut" value={APPLICATION_STATUS_LABEL[application.status]} />
                  <Row label="Déposée le" value={formatDate(application.submittedAt.slice(0, 10))} />
                  <Row
                    label="Concours"
                    value={competition?.name ?? `Session ${application.number.split("-")[1] ?? ""}`.trim()}
                  />
                  <Row label="Catégorie" value={getCategory(application.categoryId)?.code ?? "—"} />
                  <Row label="Filière" value={getFiliere(application.filiereId)?.name ?? "—"} />
                  <Row label="E-mail" value={application.email} />
                </dl>

                {convocation ? (
                  <ConvocationCard
                    application={application}
                    convocation={convocation}
                    documents={competition?.documents ?? []}
                  />
                ) : null}
              </article>

              <div className="space-y-4">
                <div className="rounded-2xl border border-hairline bg-white p-5 shadow-card sm:p-6">
                  <p className="font-display text-sm font-bold text-slate-900">Parcours du dossier</p>
                  <ol className="mt-4 space-y-4">
                    {TIMELINE.map((item, index) => {
                      const done = currentIndex >= 0 && index <= currentIndex;
                      const caption =
                        item.key === "submit"
                          ? formatDate(application.submittedAt.slice(0, 10))
                          : item.key === "dropoff" && convocation
                            ? `${formatDate(convocation.date)} · ${
                                convocation.slot === "soir" ? "après-midi" : "matin"
                              }`
                            : null;
                      return (
                        <li key={item.key} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span
                              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${
                                done ? "bg-brand-500" : "bg-slate-200"
                              }`}
                            >
                              {done ? <Check className="h-3.5 w-3.5" /> : null}
                            </span>
                            {index < TIMELINE.length - 1 ? (
                              <span className={`mt-1 h-8 w-px ${done ? "bg-brand-200" : "bg-slate-200"}`} />
                            ) : null}
                          </div>
                          <div className="pb-1">
                            <p
                              className={`text-sm font-semibold ${done ? "text-slate-900" : "text-slate-400"}`}
                            >
                              {item.label}
                            </p>
                            {caption ? <p className="text-xs text-slate-500">{caption}</p> : null}
                            {index === currentIndex ? (
                              <p className="text-xs font-semibold text-brand-600">Étape en cours</p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <div className="rounded-2xl border border-hairline bg-white p-5 shadow-card sm:p-6">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-brand-600" />
                    <p className="font-display text-sm font-bold text-slate-900">Dépôt physique</p>
                  </div>
                  {convocation ? (
                    <div className="mt-3 space-y-1 text-sm leading-6 text-slate-600">
                      <p className="font-display text-base font-bold text-slate-900">
                        {formatDate(convocation.date)}
                      </p>
                      <p>{slotLabel(convocation.slot)}</p>
                      {convocation.venue ? <p className="text-slate-500">{convocation.venue}</p> : null}
                      {convocation.listTitle ? (
                        <p className="pt-1 text-xs text-slate-400">Source : {convocation.listTitle}</p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Votre jour de passage n’est pas encore fixé. Il s’affichera automatiquement ici dès la
                      publication de la liste de passage.
                    </p>
                  )}
                  <Link
                    to="/listes"
                    className="mt-4 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Voir les listes publiées
                  </Link>
                </div>

                <Alert tone="warning" title="Gardez votre numéro" icon={KeyRound}>
                  <span className="break-all font-mono text-[13px] font-semibold text-slate-900">
                    {application.number}
                  </span>{" "}
                  vous sera demandé au dépôt du dossier et le jour du concours.
                </Alert>
              </div>
            </div>
          </div>
        ) : null}
      </Container>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Search;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors sm:flex-none sm:px-3.5 sm:text-sm ${
        active ? "bg-white text-navy-900" : "text-white/70 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </button>
  );
}

function RecoveryForm({ onFound }: { onFound: (application: Application) => void }) {
  const [lastName, setLastName] = useState("");
  const [firstNames, setFirstNames] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [results, setResults] = useState<Application[] | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setResults(findApplicationsByIdentity({ lastName, firstNames, birthDate }));
  }

  return (
    <div className="mt-4 max-w-3xl">
      <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]" onSubmit={submit}>
        <input
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          placeholder="Nom"
          aria-label="Nom"
          className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-base text-white sm:text-sm outline-none transition-all placeholder:text-white/40 focus:border-white/40 focus:bg-white/15"
        />
        <input
          value={firstNames}
          onChange={(event) => setFirstNames(event.target.value)}
          placeholder="Prénom(s)"
          aria-label="Prénom(s)"
          className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-base text-white sm:text-sm outline-none transition-all placeholder:text-white/40 focus:border-white/40 focus:bg-white/15"
        />
        <input
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          aria-label="Date de naissance"
          className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-base text-white sm:text-sm outline-none transition-all [color-scheme:dark] focus:border-white/40 focus:bg-white/15"
        />
        <Button type="submit" variant="light" className="w-full lg:w-auto">
          <KeyRound className="h-4 w-4" />
          Retrouver
        </Button>
      </form>
      <p className="mt-2 text-xs text-white/50">
        Les trois informations doivent correspondre exactement à celles saisies lors de la candidature.
      </p>

      {results ? (
        <div className="mt-4 space-y-3 rounded-2xl bg-white/95 p-4 shadow-float">
          {results.length === 0 ? (
            <Alert tone="danger" title="Aucun dossier ne correspond à ces informations">
              Vérifiez l’orthographe du nom et la date de naissance. Si vous n’avez jamais candidaté en ligne,
              déposez d’abord votre candidature.
            </Alert>
          ) : (
            <>
              <Alert
                tone="success"
                title={
                  results.length > 1
                    ? `${results.length} candidatures retrouvées`
                    : "Votre numéro de candidature a été retrouvé"
                }
              >
                Notez-le immédiatement : il est indispensable pour suivre votre dossier.
              </Alert>
              {results.map((item) => (
                <RecoveredRow key={item.id} application={item} onOpen={() => onFound(item)} />
              ))}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function RecoveredRow({ application, onOpen }: { application: Application; onOpen: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(application.number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-white p-4">
      <div className="min-w-0">
        <p className="break-all font-mono text-sm font-bold text-navy-900 sm:text-base">
          {application.number}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {application.lastName} {application.firstNames} · {getCategory(application.categoryId)?.code ?? "—"}{" "}
          · {APPLICATION_STATUS_LABEL[application.status]}
        </p>
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" onClick={() => void copy()}>
          <Copy className="h-4 w-4" />
          {copied ? "Copié" : "Copier"}
        </Button>
        <Button size="sm" className="flex-1 sm:flex-none" onClick={onOpen}>
          <Search className="h-4 w-4" />
          Voir mon dossier
        </Button>
      </div>
    </div>
  );
}

function StatusAlert({
  application,
  convocation,
}: {
  application: Application;
  convocation: Convocation | null;
}) {
  if (application.status === "ADMIS") {
    return (
      <Alert tone="success" title="Félicitations, vous êtes admis(e) au concours">
        Rapprochez-vous du secrétariat de l’EPCA pour la suite de votre inscription.
      </Alert>
    );
  }

  if (application.status === "NON_ADMIS" || application.status === "NON_AUTORISE") {
    return (
      <Alert tone="danger" title="Votre dossier n’a pas été retenu">
        Vous pouvez contacter le secrétariat pour connaître les motifs et préparer la prochaine session.
      </Alert>
    );
  }

  if (application.status === "DOSSIER_PHYSIQUE_REJETE") {
    return (
      <Alert tone="danger" title="Votre dossier physique a été rejeté">
        Une ou plusieurs pièces sont manquantes ou non conformes. Contactez le secrétariat au plus vite.
      </Alert>
    );
  }

  if (convocation) {
    const remaining = daysUntil(convocation.date);
    if (remaining > 0) {
      return (
        <Alert
          tone="warning"
          title={`Convocation : déposez votre dossier le ${formatDate(convocation.date)}`}
          icon={CalendarClock}
        >
          {slotLabel(convocation.slot)}
          {convocation.venue ? ` · ${convocation.venue}` : ""} — dans {remaining} jour
          {remaining > 1 ? "s" : ""}. Présentez-vous avec votre numéro {application.number}.
        </Alert>
      );
    }
    if (remaining === 0) {
      return (
        <Alert tone="warning" title="C’est aujourd’hui : dépôt de votre dossier physique" icon={CalendarClock}>
          {slotLabel(convocation.slot)}
          {convocation.venue ? ` · ${convocation.venue}` : ""}. Munissez-vous de votre pièce d’identité et de
          votre numéro {application.number}.
        </Alert>
      );
    }
    return (
      <Alert tone="info" title={`Dépôt prévu le ${formatDate(convocation.date)}`} icon={CalendarClock}>
        {slotLabel(convocation.slot)}
        {convocation.venue ? ` · ${convocation.venue}` : ""}.
      </Alert>
    );
  }

  return (
    <Alert tone="info" title="Candidature bien enregistrée">
      Votre jour de dépôt physique n’est pas encore fixé. Il s’affichera automatiquement sur cette page dès
      qu’il sera publié : inutile de consulter la liste officielle.
    </Alert>
  );
}

function ConvocationCard({
  application,
  convocation,
  documents,
}: {
  application: Application;
  convocation: Convocation;
  documents: string[];
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-brand-200 bg-brand-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-200 bg-white/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-white">
            <CalendarClock className="h-4 w-4" />
          </span>
          <p className="font-display text-sm font-bold text-navy-900">Convocation au dépôt physique</p>
        </div>
        <Button variant="secondary" onClick={() => window.print()} className="no-print">
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </header>

      <div className="grid gap-3 px-4 py-4 sm:grid-cols-3 sm:gap-4 sm:px-5 sm:py-5">
        <Detail label="Date de passage" value={formatDate(convocation.date)} icon={CalendarClock} />
        <Detail label="Créneau" value={slotLabel(convocation.slot)} icon={CalendarClock} />
        <Detail label="Lieu" value={convocation.venue ?? "Secrétariat EPCA"} icon={MapPin} />
      </div>

      {documents.length ? (
        <div className="border-t border-brand-200 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-600" />
            <p className="font-display text-sm font-bold text-navy-900">Pièces à présenter</p>
          </div>
          <ul className="mt-2 grid gap-1.5 text-sm text-slate-600 sm:grid-cols-2">
            {documents.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="border-t border-brand-200 px-4 py-3 text-xs text-slate-500 sm:px-5">
        Présentez ce numéro à l’accueil :{" "}
        <span className="break-all font-mono font-semibold">{application.number}</span>
      </p>
    </section>
  );
}

function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof CalendarClock;
}) {
  return (
    <div className="rounded-xl border border-brand-200 bg-white p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1.5 font-display text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-hairline bg-white px-4 py-3 text-sm last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="ml-auto break-words text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
