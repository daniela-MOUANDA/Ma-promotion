import { Aurora } from "@/components/motion/Aurora";
import { Reveal } from "@/components/motion/Reveal";
import { StudentAvatar } from "@/components/promotions/StudentAvatar";
import { StudentContactSubmit } from "@/components/promotions/StudentContactSubmit";
import { StudentPhotoSubmit } from "@/components/promotions/StudentPhotoSubmit";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Container } from "@/components/ui/LayoutBits";
import { StudentStatusBadge } from "@/components/ui/Badge";
import { ORIGIN_LABEL, OriginBadge } from "@/components/ui/OriginBadge";
import {
  getFeedbackForStudent,
  getPublishedFeedbackForStudent,
  submitAlumniFeedback,
} from "@/lib/alumni-store";
import {
  getCategory,
  getFiliere,
  getPromotion,
  getPublicStudent,
} from "@/lib/catalog";
import { formatDate, phoneHref, whatsappHref } from "@/lib/format";
import { useAlumni, usePromotionsCatalog } from "@/lib/use-live-data";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

export function StudentProfilePage() {
  usePromotionsCatalog();
  useAlumni();
  const { studentId = "", promotionId = "", categoryId = "", filiereId = "" } = useParams();
  const student = getPublicStudent(studentId);

  if (!student) {
    return (
      <Container className="pb-16 pt-36">
        <h1 className="font-display text-3xl font-bold text-navy-900">Profil introuvable</h1>
        <Link to="/promotions" className="mt-4 inline-flex text-sm font-semibold text-navy-900">
          Retour aux promotions
        </Link>
      </Container>
    );
  }

  const promotion = getPromotion(student.promotionId) ?? getPromotion(promotionId);
  const category = getCategory(student.categoryId);
  const filiere = getFiliere(student.filiereId);
  const published = getPublishedFeedbackForStudent(student.id);
  const allForStudent = getFeedbackForStudent(student.id);
  const pending = allForStudent.find((item) => item.status === "pending");
  const canTestify = student.status === "DIPLOME" || student.status === "EN_FORMATION";

  return (
    <div>
      <section className="stage relative overflow-hidden text-white">
        <Aurora />
        <Container className="relative pb-10 pt-28 md:pb-14 md:pt-32">
          <Link
            to={`/promotions/${promotion?.number ?? promotionId}/${category?.code ?? categoryId}/${filiere?.code ?? filiereId}`}
            className="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la filière
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8 flex flex-wrap items-end gap-6"
          >
            <div className="h-44 w-36 shrink-0 overflow-hidden rounded-[1.75rem] bg-navy-800 shadow-float ring-2 ring-white/25 sm:h-52 sm:w-40">
              <StudentAvatar photoUrl={student.photoUrl} fullName={student.fullName} textClass="text-5xl" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl font-extrabold tracking-[-0.035em] sm:text-6xl">
                  {student.fullName}
                </h1>
                <StudentStatusBadge status={student.status} />
                <OriginBadge origin={student.origin} onPhoto />
              </div>
              <p className="mt-3 text-sm text-white/65">
                {promotion?.label} · {category?.code} · {filiere?.name}
              </p>
              {(student.careerTitle || student.careerOrganization) && (
                <p className="mt-2 text-sm font-medium text-glow">
                  {[student.careerTitle, student.careerOrganization].filter(Boolean).join(" · ")}
                </p>
              )}
              {(student.email || student.phone) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {student.email ? (
                    <a
                      href={`mailto:${student.email}`}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Écrire
                    </a>
                  ) : null}
                  {student.phone ? (
                    <a
                      href={phoneHref(student.phone)}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Appeler
                    </a>
                  ) : null}
                  {student.phone ? (
                    <a
                      href={whatsappHref(student.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_1.05fr] lg:py-16">
        <div className="space-y-8">
        <Reveal>
          <div className="surface rounded-[1.75rem] p-6">
            <h2 className="font-display text-xl font-bold text-navy-900">Profil</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <Row label="Promotion" value={promotion?.label ?? "—"} />
              <Row label="Catégorie" value={category?.code ?? "—"} />
              <Row label="Filière" value={filiere?.name ?? "—"} />
              {student.birthDate ? <Row label="Né(e) le" value={formatDate(student.birthDate)} /> : null}
              <Row label="Statut" value={student.status.replace("_", " ")} />
              <Row label="Interne / Externe" value={ORIGIN_LABEL[student.origin]} />
              {student.email ? (
                <Row
                  label="E-mail"
                  value={
                    <a href={`mailto:${student.email}`} className="transition-colors hover:text-sky">
                      {student.email}
                    </a>
                  }
                />
              ) : null}
              {student.phone ? (
                <Row
                  label="Téléphone"
                  value={
                    <a href={phoneHref(student.phone)} className="transition-colors hover:text-sky">
                      {student.phone}
                    </a>
                  }
                />
              ) : null}
            </dl>
          </div>
        </Reveal>
        <Reveal delay={0.04}>
          <StudentContactSubmit student={student} />
        </Reveal>
        <Reveal delay={0.08}>
          <StudentPhotoSubmit student={student} />
        </Reveal>
        </div>

        <div className="space-y-8">
          <Reveal delay={0.05}>
            <div className="surface rounded-[1.75rem] p-6">
              <h2 className="font-display text-xl font-bold text-navy-900">Témoignages du profil</h2>
              {published.length === 0 ? (
                <p className="mt-4 text-sm text-ink-soft">
                  Aucun témoignage publié pour ce profil pour le moment.
                </p>
              ) : (
                <div className="mt-5 space-y-5">
                  {published.map((item) => (
                    <blockquote key={item.id} className="border-l-2 border-sky pl-4">
                      <p className="text-[15px] leading-7 text-navy-900">“{item.experience}”</p>
                      <p className="mt-3 text-xs text-ink-soft">
                        {[item.careerTitle, item.careerOrganization].filter(Boolean).join(" · ")}
                      </p>
                      {item.careerPath ? (
                        <p className="mt-2 text-xs leading-5 text-ink-soft">{item.careerPath}</p>
                      ) : null}
                    </blockquote>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {canTestify ? (
            <Reveal delay={0.1}>
              <ProfileTestimonyForm
                studentId={student.id}
                fullName={student.fullName}
                promotionId={student.promotionId}
                categoryId={student.categoryId}
                filiereId={student.filiereId}
                academicYear={promotion?.academicYear ?? ""}
                careerTitle={student.careerTitle ?? ""}
                careerOrganization={student.careerOrganization ?? ""}
                defaultEmail={student.email ?? ""}
                pending={Boolean(pending)}
              />
            </Reveal>
          ) : (
            <p className="text-sm text-ink-soft">
              Les témoignages sont réservés aux profils en formation ou diplômés.
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line pb-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-navy-900">{value}</dd>
    </div>
  );
}

function ProfileTestimonyForm({
  studentId,
  fullName,
  promotionId,
  categoryId,
  filiereId,
  academicYear,
  careerTitle,
  careerOrganization,
  defaultEmail,
  pending,
}: {
  studentId: string;
  fullName: string;
  promotionId: string;
  categoryId: string;
  filiereId: string;
  academicYear: string;
  careerTitle: string;
  careerOrganization: string;
  defaultEmail: string;
  pending: boolean;
}) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    email: defaultEmail,
    careerTitle,
    careerOrganization,
    careerPath: "",
    experience: "",
  });

  const ready = useMemo(
    () => form.email.trim() && form.experience.trim() && form.careerPath.trim(),
    [form],
  );

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;
    submitAlumniFeedback({
      studentId,
      fullName,
      email: form.email.trim(),
      promotionId,
      categoryId,
      filiereId,
      trainingYears: academicYear,
      careerTitle: form.careerTitle.trim(),
      careerOrganization: form.careerOrganization.trim(),
      careerPath: form.careerPath.trim(),
      experience: form.experience.trim(),
    });
    setSent(true);
  }

  return (
    <div className="rounded-[1.75rem] border border-sky/25 bg-brand-50 p-6 shadow-card">
      <h2 className="font-display text-xl font-bold text-navy-900">Témoigner sur ce profil</h2>
      <p className="mt-2 text-sm leading-6 text-ink-soft">
        Ce témoignage est attaché à <strong className="text-navy-900">{fullName}</strong>. Il sera
        publié après validation par l’administration.
      </p>

      {sent || pending ? (
        <div className="mt-6 rounded-2xl bg-ok/10 px-4 py-4 text-sm text-navy-900">
          {sent
            ? "Merci. Votre témoignage a été envoyé et sera examiné avant publication."
            : "Un témoignage de ce profil est déjà en attente de validation."}
        </div>
      ) : (
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <Field label="E-mail de contact">
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            />
          </Field>
          <Field label="Poste actuel">
            <Input
              value={form.careerTitle}
              onChange={(e) => setForm((c) => ({ ...c, careerTitle: e.target.value }))}
            />
          </Field>
          <Field label="Structure">
            <Input
              value={form.careerOrganization}
              onChange={(e) => setForm((c) => ({ ...c, careerOrganization: e.target.value }))}
            />
          </Field>
          <Field label="Décrire votre carrière">
            <Textarea
              required
              rows={3}
              value={form.careerPath}
              onChange={(e) => setForm((c) => ({ ...c, careerPath: e.target.value }))}
            />
          </Field>
          <Field label="Votre témoignage sur l’EPCA">
            <Textarea
              required
              rows={4}
              value={form.experience}
              onChange={(e) => setForm((c) => ({ ...c, experience: e.target.value }))}
            />
          </Field>
          <Button type="submit" disabled={!ready} className="w-full">
            Publier mon témoignage sur ce profil
          </Button>
        </form>
      )}
    </div>
  );
}
