import { SchoolIdCard } from "@/components/admin/SchoolIdCard";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { ApplicationStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { APPLICATION_STATUS_LABEL } from "@/constants/labels";
import { deleteApplication, updateApplicationStatus } from "@/lib/applications-store";
import { getCategory, getCompetition, getFiliere } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { useApplications } from "@/lib/use-live-data";
import type { ApplicationStatus } from "@/types/domain";
import { ArrowLeft, Printer, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

const NEXT: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  SOUMISE: "DOSSIER_PHYSIQUE_ATTENDU",
  DOSSIER_PHYSIQUE_ATTENDU: "DOSSIER_PHYSIQUE_DEPOSE",
  DOSSIER_PHYSIQUE_DEPOSE: "DOSSIER_PHYSIQUE_VALIDE",
  DOSSIER_PHYSIQUE_VALIDE: "AUTORISE_CONCOURS",
  AUTORISE_CONCOURS: "ADMIS",
};

export function AdminApplicationDetailPage() {
  const { number = "" } = useParams();
  const navigate = useNavigate();
  const { confirm, toast } = useFeedback();
  const applications = useApplications();
  const application = applications.find((item) => item.number.toUpperCase() === number.toUpperCase());

  if (!application) {
    return (
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">Dossier introuvable</h1>
        <Link
          to="/admin/candidatures"
          className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Retour aux candidatures
        </Link>
      </div>
    );
  }

  const dossier = application;

  async function advance() {
    const next = NEXT[dossier.status];
    if (!next) return;
    const ok = await confirm({
      title: "Faire avancer le dossier ?",
      message: `Nouveau statut : ${APPLICATION_STATUS_LABEL[next]}.`,
      confirmLabel: "Confirmer",
    });
    if (!ok) return;
    updateApplicationStatus(dossier.id, next);
    toast({ tone: "success", title: "Statut mis à jour", message: APPLICATION_STATUS_LABEL[next] });
  }

  async function rejectPhysical() {
    const ok = await confirm({
      title: `Rejeter le dossier de ${dossier.lastName} ${dossier.firstNames} ?`,
      message: "Cette décision sera visible dans le suivi du candidat.",
      confirmLabel: "Oui, rejeter",
      danger: true,
    });
    if (!ok) return;
    updateApplicationStatus(dossier.id, "DOSSIER_PHYSIQUE_REJETE");
    toast({ tone: "danger", title: "Dossier physique rejeté" });
  }

  async function remove() {
    const ok = await confirm({
      title: `Supprimer le dossier ${dossier.number} ?`,
      message: "Cette action est locale à ce navigateur.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    deleteApplication(dossier.id);
    toast({ tone: "danger", title: "Dossier supprimé" });
    navigate("/admin/candidatures");
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        to="/admin/candidatures"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux candidatures
      </Link>

      <div className="mesh-hero rounded-3xl p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 font-display text-lg font-extrabold">
              {application.lastName.slice(0, 1)}
              {application.firstNames.slice(0, 1)}
            </span>
            <div>
              <p className="font-mono text-xs text-white/60">{application.number}</p>
              <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                {application.lastName} {application.firstNames}
              </h1>
              <p className="mt-1 text-sm text-white/65">
                {getCategory(application.categoryId)?.code} · {getFiliere(application.filiereId)?.name}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
            {APPLICATION_STATUS_LABEL[application.status]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ApplicationStatusBadge status={application.status} />
      </div>

      <dl className="rounded-2xl border border-hairline bg-white p-6 text-sm shadow-card">
        <Row label="Statut" value={APPLICATION_STATUS_LABEL[application.status]} />
        <Row label="Naissance" value={formatDate(application.birthDate)} />
        <Row label="Sexe" value={application.sex} />
        <Row label="Téléphone" value={application.phone} />
        <Row label="E-mail" value={application.email} />
        <Row label="Concours" value={getCompetition(application.competitionId)?.name ?? "—"} />
        <Row label="Catégorie" value={getCategory(application.categoryId)?.code ?? "—"} />
        <Row label="Filière" value={getFiliere(application.filiereId)?.name ?? "—"} />
        <Row label="Déposée le" value={formatDate(application.submittedAt.slice(0, 10))} />
        <Row
          label="Dépôt physique"
          value={
            application.dropOffDate
              ? `${formatDate(application.dropOffDate)} · ${application.dropOffSlot ?? ""} · ${application.dropOffVenue ?? ""}`
              : "Non convoqué"
          }
        />
      </dl>
      <div className="flex flex-wrap gap-3">
        {NEXT[application.status] ? (
          <Button onClick={() => void advance()}>
            Passer à : {APPLICATION_STATUS_LABEL[NEXT[application.status]!]}
          </Button>
        ) : null}
        {application.status === "DOSSIER_PHYSIQUE_DEPOSE" ||
        application.status === "DOSSIER_PHYSIQUE_ATTENDU" ? (
          <Button variant="danger" onClick={() => void rejectPhysical()}>
            Rejeter le dossier physique
          </Button>
        ) : null}
        {application.status === "ADMIS" ? (
          <Link to={`/admin/cartes?id=${application.id}`}>
            <Button>
              <Printer className="h-4 w-4" />
              Carte scolaire
            </Button>
          </Link>
        ) : null}
        <Button variant="secondary" onClick={() => void remove()}>
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>
      {application.status === "ADMIS" ? (
        <div className="flex justify-center rounded-2xl border border-hairline bg-slate-50 p-6">
          <SchoolIdCard student={application} />
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-hairline py-2.5 last:border-0">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-700">{value}</dd>
    </div>
  );
}
