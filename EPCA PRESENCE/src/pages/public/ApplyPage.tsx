import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Container, DemoNotice } from "@/components/ui/LayoutBits";
import { createApplication } from "@/lib/applications-store";
import {
  getCategories,
  getCompetition,
  getFilieresForCategory,
  getOpenCompetition,
  getRegie,
} from "@/lib/catalog";
import { formatDate, formatRange } from "@/lib/format";
import type { Application } from "@/types/domain";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CircleAlert,
  Copy,
  FileText,
  GraduationCap,
  KeyRound,
  Layers,
  Printer,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";

const schema = z.object({
  lastName: z.string().trim().min(2, "Nom requis"),
  firstNames: z.string().trim().min(2, "Prénom(s) requis"),
  birthDate: z.string().min(1, "Date de naissance requise"),
  sex: z.enum(["F", "M"], { message: "Indiquez le sexe" }),
  phone: z.string().trim().min(8, "Téléphone requis"),
  email: z.string().trim().email("E-mail invalide"),
  categoryId: z.string().min(1, "Choisissez une catégorie"),
  filiereId: z.string().min(1, "Choisissez une filière"),
});

type FormValues = z.infer<typeof schema>;

const STEPS = [
  { label: "Identité", hint: "Vos informations", icon: UserRound },
  { label: "Catégorie", hint: "Votre niveau", icon: Layers },
  { label: "Filière", hint: "Votre spécialité", icon: GraduationCap },
  { label: "Validation", hint: "Récapitulatif", icon: BadgeCheck },
];

export function ApplyPage() {
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Application | null>(null);
  const [copied, setCopied] = useState(false);

  const requested = getCompetition(params.get("concours") ?? "");
  const competition = requested?.status === "open" ? requested : getOpenCompetition();
  const canApply = competition?.status === "open";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      lastName: "",
      firstNames: "",
      birthDate: "",
      sex: undefined,
      phone: "",
      email: "",
      categoryId: "",
      filiereId: "",
    },
    mode: "onTouched",
  });

  const categoryId = form.watch("categoryId");
  const filiereId = form.watch("filiereId");
  const values = form.watch();

  const filieres = useMemo(
    () => (competition && categoryId ? getFilieresForCategory(categoryId, competition) : []),
    [categoryId, competition],
  );
  const categories = getCategories().filter((item) => competition?.categoryIds.includes(item.id));
  const selectedCategory = categories.find((item) => item.id === categoryId);
  const selectedFiliere = filieres.find((item) => item.id === filiereId);

  async function goNext() {
    const fields: Array<keyof FormValues> =
      step === 0
        ? ["lastName", "firstNames", "birthDate", "sex", "phone", "email"]
        : step === 1
          ? ["categoryId"]
          : ["filiereId"];
    const valid = await form.trigger(fields);
    if (valid) setStep((current) => current + 1);
  }

  function onSubmit(data: FormValues) {
    if (!competition) return;
    setSubmitting(true);
    const record = createApplication({ competitionId: competition.id, ...data });
    setSubmitting(false);
    setCreated(record);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyNumber(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  if (created) {
    const session = getCompetition(created.competitionId);
    const category = getCategories().find((item) => item.id === created.categoryId);
    const filiere = session ? getFilieresForCategory(created.categoryId, session).find((item) => item.id === created.filiereId) : undefined;

    return (
      <div className="bg-canvas pb-16">
        <section className="mesh-hero relative overflow-hidden text-white no-print">
          <div className="grid-lines absolute inset-0" aria-hidden />
          <Container className="relative py-10 text-center md:py-14">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 text-white shadow-float sm:h-16 sm:w-16">
              <Check className="h-7 w-7 sm:h-8 sm:w-8" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              Candidature enregistrée
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-7 text-white/70 sm:text-base">
              {created.firstNames} {created.lastName}, votre dossier a bien été transmis à l’EPCA pour{" "}
              {session?.name ?? "la session en cours"}.
            </p>
          </Container>
        </section>

        <Container className="relative z-10 mt-6 max-w-3xl">
          <div className="rounded-2xl border border-hairline bg-white p-5 shadow-float sm:p-6 md:p-8">
            <Alert tone="success" title="Votre inscription en ligne est confirmée">
              Enregistrée le {formatDate(created.submittedAt)}. Un agent vérifiera votre dossier puis publiera
              votre jour de dépôt physique.
            </Alert>

            <div className="mt-5 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-4 text-center sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-700 sm:text-[11px] sm:tracking-[0.2em]">
                Votre numéro de candidature
              </p>
              <p className="mt-3 break-all font-mono text-lg font-bold tracking-tight text-navy-900 sm:text-2xl md:text-3xl">
                {created.number}
              </p>
              <div className="mt-5 flex flex-col gap-2 no-print sm:flex-row sm:justify-center">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => void copyNumber(created.number)}
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Numéro copié" : "Copier le numéro"}
                </Button>
                <Button variant="secondary" className="w-full sm:w-auto" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Imprimer le récépissé
                </Button>
              </div>
            </div>

            <Alert
              tone="warning"
              title="Conservez précieusement ce numéro"
              className="mt-5"
              icon={KeyRound}
            >
              Il est <strong>indispensable</strong> pour suivre votre dossier, connaître votre jour de dépôt
              physique et retirer votre convocation. Notez-le, photographiez-le ou imprimez le récépissé. En cas
              de perte, vous pourrez le retrouver avec votre nom et votre date de naissance depuis la page de
              suivi.
            </Alert>

            <dl className="mt-5 overflow-hidden rounded-2xl border border-hairline">
              <Row label="Candidat" value={`${created.lastName} ${created.firstNames}`} />
              <Row label="Date de naissance" value={formatDate(created.birthDate)} />
              <Row label="Concours" value={session?.name ?? "—"} />
              <Row label="Catégorie" value={category?.code ?? "—"} />
              <Row label="Filière" value={filiere?.name ?? "—"} />
              <Row label="E-mail" value={created.email} />
              <Row label="Téléphone" value={created.phone} />
            </dl>

            <Alert tone="info" title="Prochaine étape : le dépôt physique" className="mt-5">
              Le dossier papier complet doit être déposé au secrétariat le jour qui vous sera attribué. Cette
              date s’affichera automatiquement sur votre page de suivi dès qu’elle sera fixée.
            </Alert>

            <div className="mt-6 flex flex-col gap-3 border-t border-hairline pt-6 no-print sm:flex-row sm:flex-wrap">
              <Link to={`/candidature/suivi?numero=${encodeURIComponent(created.number)}`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <Search className="h-4 w-4" />
                  Suivre ma candidature
                </Button>
              </Link>
              <Link to="/" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Retour à l’accueil
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!competition || !canApply) {
    return (
      <div className="bg-canvas">
        <Container className="py-20">
          <div className="mx-auto max-w-lg rounded-2xl border border-hairline bg-white p-8 text-center shadow-card">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <CircleAlert className="h-7 w-7" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-extrabold text-slate-900">Candidatures fermées</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Aucune session n’accepte de dépôt en ligne pour le moment. Consultez les sessions publiées pour
              connaître les prochaines dates d’ouverture.
            </p>
            <Link to="/concours" className="mt-6 inline-block">
              <Button>
                Voir les sessions
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="bg-canvas pb-16">
      <section className="mesh-hero relative overflow-hidden text-white">
        <div className="grid-lines absolute inset-0" aria-hidden />
        <Container className="relative py-10 md:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Candidature</p>
          <h1 className="mt-3 font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Déposer un dossier
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/70 sm:text-base">
            {competition.name} · candidatures du {formatRange(competition.opensAt, competition.closesAt)}. La
            candidature en ligne prépare le dépôt physique, elle ne le remplace pas.
          </p>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3 text-xs text-white/60">
              <span className="truncate">
                Étape {step + 1} sur {STEPS.length} · {STEPS[step].label}
              </span>
              <span className="shrink-0">{progress} %</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </Container>
      </section>

      <Container className="relative z-10 mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-hairline bg-white p-5 shadow-float sm:p-6 md:p-8">
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STEPS.map((item, index) => {
              const done = index < step;
              const active = index === step;
              return (
                <li
                  key={item.label}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
                    active
                      ? "border-brand-200 bg-brand-50"
                      : done
                        ? "border-emerald-100 bg-emerald-50"
                        : "border-hairline bg-white"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white ${
                      active ? "bg-brand-500" : done ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : <item.icon className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block truncate font-display text-[13px] font-bold ${
                        active ? "text-brand-700" : done ? "text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="block truncate text-[11px] text-slate-400">{item.hint}</span>
                  </span>
                </li>
              );
            })}
          </ol>

          <form className="mt-8" onSubmit={form.handleSubmit(onSubmit)}>
            {step === 0 ? (
              <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                <Field label="Nom" error={form.formState.errors.lastName?.message}>
                  <Input {...form.register("lastName")} autoComplete="family-name" placeholder="NDONG" />
                </Field>
                <Field label="Prénom(s)" error={form.formState.errors.firstNames?.message}>
                  <Input {...form.register("firstNames")} autoComplete="given-name" placeholder="Marie Claire" />
                </Field>
                <Field label="Date de naissance" error={form.formState.errors.birthDate?.message}>
                  <Input type="date" {...form.register("birthDate")} />
                </Field>
                <Field label="Sexe" error={form.formState.errors.sex?.message}>
                  <Select {...form.register("sex")}>
                    <option value="">Choisir</option>
                    <option value="F">Féminin</option>
                    <option value="M">Masculin</option>
                  </Select>
                </Field>
                <Field label="Téléphone" error={form.formState.errors.phone?.message}>
                  <Input {...form.register("phone")} inputMode="tel" placeholder="+241 00 00 00 00" />
                </Field>
                <Field label="E-mail" error={form.formState.errors.email?.message}>
                  <Input type="email" {...form.register("email")} autoComplete="email" placeholder="nom@exemple.ga" />
                </Field>
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <p className="font-display text-lg font-bold text-slate-900">Choisissez votre catégorie</p>
                <p className="mt-1 text-sm text-slate-500">
                  La catégorie détermine les filières auxquelles vous pouvez prétendre.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {categories.map((item) => {
                    const active = categoryId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          form.setValue("categoryId", item.id, { shouldValidate: true });
                          form.setValue("filiereId", "");
                        }}
                        className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                          active
                            ? "border-brand-400 bg-brand-50 shadow-card"
                            : "border-hairline bg-white hover:border-brand-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-lg bg-navy-900 px-2.5 py-1 font-mono text-[11px] font-bold text-white">
                            {item.code}
                          </span>
                          {active ? <Check className="h-4 w-4 text-brand-600" /> : null}
                        </div>
                        <p className="mt-3 font-display text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                      </button>
                    );
                  })}
                </div>
                {form.formState.errors.categoryId?.message ? (
                  <p className="mt-3 text-sm text-rose-600">{form.formState.errors.categoryId.message}</p>
                ) : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <p className="font-display text-lg font-bold text-slate-900">Choisissez votre filière</p>
                <p className="mt-1 text-sm text-slate-500">
                  Seules les filières ouvertes pour {selectedCategory?.code} dans cette session sont proposées.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {filieres.map((item) => {
                    const active = filiereId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => form.setValue("filiereId", item.id, { shouldValidate: true })}
                        className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                          active
                            ? "border-brand-400 bg-brand-50 shadow-card"
                            : "border-hairline bg-white hover:border-brand-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-display text-sm font-bold text-slate-900">{item.name}</p>
                          {active ? <Check className="h-4 w-4 shrink-0 text-brand-600" /> : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{getRegie(item.regieId)?.name}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{item.description}</p>
                      </button>
                    );
                  })}
                  {filieres.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucune filière disponible pour cette catégorie.</p>
                  ) : null}
                </div>
                {form.formState.errors.filiereId?.message ? (
                  <p className="mt-3 text-sm text-rose-600">{form.formState.errors.filiereId.message}</p>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <p className="font-display text-lg font-bold text-slate-900">Vérifiez avant d’envoyer</p>
                <dl className="mt-5 overflow-hidden rounded-2xl border border-hairline">
                  <Row label="Concours" value={competition.name} />
                  <Row label="Identité" value={`${values.lastName} ${values.firstNames}`} />
                  <Row
                    label="Naissance"
                    value={`${values.birthDate} · ${values.sex === "F" ? "Féminin" : "Masculin"}`}
                  />
                  <Row label="Téléphone" value={values.phone} />
                  <Row label="E-mail" value={values.email} />
                  <Row label="Catégorie" value={selectedCategory?.code ?? "—"} />
                  <Row label="Filière" value={selectedFiliere?.name ?? "—"} />
                </dl>
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  En validant, vous confirmez l’exactitude des informations et vous engagez à déposer le
                  dossier physique le jour indiqué par l’administration.
                </p>
                <Alert tone="warning" title="Un numéro de candidature va vous être attribué" className="mt-4">
                  Ce numéro est votre seule clé pour suivre votre dossier et connaître votre jour de dépôt.
                  Notez-le dès qu’il s’affiche à l’écran.
                </Alert>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-hairline pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              {step > 0 ? (
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => setStep((current) => current - 1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
              ) : (
                <span className="hidden sm:block" />
              )}
              {step < 3 ? (
                <Button className="w-full sm:w-auto" onClick={() => void goNext()}>
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                  {submitting ? "Envoi…" : "Valider ma candidature"}
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-hairline bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-900 text-white">
                <CalendarClock className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-slate-900">{competition.name}</p>
                <p className="text-xs text-slate-500">{formatRange(competition.opensAt, competition.closesAt)}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <MiniRow label="Catégorie" value={selectedCategory ? selectedCategory.code : "—"} />
              <MiniRow label="Filière" value={selectedFiliere ? selectedFiliere.name : "—"} />
              <MiniRow
                label="Candidat"
                value={values.lastName || values.firstNames ? `${values.lastName} ${values.firstNames}` : "—"}
              />
            </dl>
          </div>

          <div className="rounded-2xl border border-hairline bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-600" />
              <p className="font-display text-sm font-bold text-slate-900">Après la validation</p>
            </div>
            <ul className="mt-3 space-y-2.5 text-sm leading-6 text-slate-500">
              <li>Un numéro unique vous est attribué : conservez-le.</li>
              <li>Suivez l’état du dossier depuis « Suivre mon dossier ».</li>
              <li>Présentez-vous au dépôt physique le jour publié.</li>
            </ul>
            <Link
              to="/candidature/suivi"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Suivre une candidature
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <DemoNotice>
            Mode démonstration : le numéro est généré dans votre navigateur. La numérotation officielle sera
            produite côté serveur.
          </DemoNotice>
        </aside>
      </Container>
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

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
