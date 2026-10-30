import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { StudentAvatar } from "@/components/promotions/StudentAvatar";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { alignStudentStatus, cohortOf, studentStatusChoices } from "@/lib/cohort";
import { compressImage } from "@/lib/image-file";
import { createStudent, patchStudent, wasLastWriteSaved } from "@/lib/promotions-store";
import { usePromotionCategories, usePromotionFilieres, usePromotions } from "@/lib/use-live-data";
import { ORIGIN_LABEL } from "@/components/ui/OriginBadge";
import { cn } from "@/lib/cn";
import type { PublicStudent, StudentOrigin, StudentPublicStatus } from "@/types/domain";
import { ImagePlus } from "lucide-react";
import { useMemo, useState } from "react";

export function StudentFormModal({
  student,
  defaults,
  onClose,
}: {
  student: PublicStudent | null;
  defaults?: { promotionId?: string; categoryId?: string };
  onClose: () => void;
}) {
  const { toast } = useFeedback();
  const promotions = usePromotions();
  const categories = usePromotionCategories().filter((item) => item.active);
  const filieres = usePromotionFilieres();

  const defaultPromoId = student?.promotionId ?? defaults?.promotionId ?? promotions[0]?.id ?? "";
  const defaultPromo = promotions.find((item) => item.id === defaultPromoId);

  const [form, setForm] = useState({
    fullName: student?.fullName ?? "",
    birthDate: student?.birthDate ?? "",
    promotionId: defaultPromoId,
    categoryId: student?.categoryId ?? defaults?.categoryId ?? categories[0]?.id ?? "",
    filiereId: student?.filiereId ?? "",
    status: student
      ? alignStudentStatus(student.status, defaultPromo)
      : cohortOf(defaultPromo ?? { status: "en_cours" }),
    origin: student?.origin ?? ("INTERNE" as StudentOrigin),
    careerTitle: student?.careerTitle ?? "",
    careerOrganization: student?.careerOrganization ?? "",
    email: student?.email ?? "",
    phone: student?.phone ?? "",
    published: student ? student.published !== false : true,
    photoUrl: student?.photoUrl ?? "",
  });

  const filieresForCategory = useMemo(
    () =>
      form.categoryId ? filieres.filter((item) => item.categoryIds.includes(form.categoryId)) : filieres,
    [filieres, form.categoryId],
  );
  const selectedPromo = promotions.find((item) => item.id === form.promotionId);
  const statusChoices = studentStatusChoices(selectedPromo);
  const isGraduatePromo = selectedPromo ? cohortOf(selectedPromo) === "DIPLOME" : false;

  async function pickPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const photoUrl = await compressImage(file, 520, 0.82);
      setForm((c) => ({ ...c, photoUrl }));
    } catch {
      toast({ tone: "danger", title: "Photo illisible", message: "Choisissez une image JPG ou PNG." });
    }
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.promotionId || !form.categoryId || !form.filiereId) {
      toast({
        tone: "danger",
        title: "Champs incomplets",
        message: "Nom, promotion, catégorie et filière sont obligatoires.",
      });
      return;
    }
    const payload = {
      fullName: form.fullName.trim(),
      birthDate: form.birthDate,
      promotionId: form.promotionId,
      categoryId: form.categoryId,
      filiereId: form.filiereId,
      status: form.status,
      origin: form.origin,
      photoLabel: "Portrait",
      photoUrl: form.photoUrl,
      careerTitle: form.careerTitle.trim() || undefined,
      careerOrganization: form.careerOrganization.trim() || undefined,
      email: form.email.trim(),
      phone: form.phone.trim(),
      published: form.published,
    };
    if (student) patchStudent(student.id, payload);
    else createStudent(payload);

    if (wasLastWriteSaved()) {
      toast({
        tone: "success",
        title: student ? "Profil mis à jour" : "Profil ajouté",
        message: payload.fullName,
      });
    } else {
      toast({
        tone: "danger",
        title: "Espace de stockage plein",
        message:
          "Le profil est visible pour l’instant mais ne sera pas conservé. Supprimez des photos de la galerie ou des profils.",
      });
    }
    onClose();
  }

  return (
    <Modal
      title={student ? "Modifier le profil" : "Ajouter un élève"}
      subtitle={student ? student.fullName : "Il apparaîtra dans sa promotion, sa catégorie et sa filière."}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="student-form">
            {student ? "Enregistrer" : "Ajouter l’élève"}
          </Button>
        </>
      }
    >
      <form id="student-form" className="space-y-4" onSubmit={save}>
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
          <div className="h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-slate-200">
            <StudentAvatar photoUrl={form.photoUrl} fullName={form.fullName || "?"} textClass="text-xl" />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold text-slate-700">Photo de l’élève</p>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
                <ImagePlus className="h-3.5 w-3.5" />
                {form.photoUrl ? "Changer" : "Ajouter"}
                <input type="file" accept="image/*" className="sr-only" onChange={pickPhoto} />
              </label>
              {form.photoUrl ? (
                <button
                  type="button"
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-white hover:text-rose-600"
                  onClick={() => setForm((c) => ({ ...c, photoUrl: "" }))}
                >
                  Retirer
                </button>
              ) : null}
            </div>
            <p className="text-[11px] text-slate-400">
              L’élève peut aussi proposer sa photo depuis son profil public ; elle vous arrive en validation.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet" className="sm:col-span-2">
            <Input
              required
              value={form.fullName}
              onChange={(e) => setForm((c) => ({ ...c, fullName: e.target.value }))}
            />
          </Field>
          <Field label="Promotion">
            <Select
              value={form.promotionId}
              onChange={(e) => {
                const promotionId = e.target.value;
                const promo = promotions.find((item) => item.id === promotionId);
                setForm((current) => {
                  const keepExit = current.status === "ABANDON" || current.status === "EXCLU";
                  return {
                    ...current,
                    promotionId,
                    status: keepExit ? current.status : cohortOf(promo ?? { status: "en_cours" }),
                  };
                });
              }}
            >
              <option value="">Choisir</option>
              {promotions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Statut" hint="En formation ou diplômé suit la promotion. Ici : abandon ou exclusion.">
            <Select
              value={form.status}
              onChange={(e) => setForm((c) => ({ ...c, status: e.target.value as StudentPublicStatus }))}
            >
              {statusChoices.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Interne / Externe" className="sm:col-span-2">
            <div className="grid grid-cols-2 gap-2">
              {(["INTERNE", "EXTERNE"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={form.origin === value}
                  onClick={() => setForm((c) => ({ ...c, origin: value }))}
                  className={cn(
                    "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-colors",
                    form.origin === value
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-line bg-white text-slate-600 hover:border-navy-900/30",
                  )}
                >
                  {ORIGIN_LABEL[value]}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Catégorie">
            <Select
              value={form.categoryId}
              onChange={(e) => setForm((c) => ({ ...c, categoryId: e.target.value, filiereId: "" }))}
            >
              <option value="">Choisir</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Filière">
            <Select
              value={form.filiereId}
              onChange={(e) => setForm((c) => ({ ...c, filiereId: e.target.value }))}
            >
              <option value="">Choisir</option>
              {filieresForCategory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date de naissance (optionnel)">
            <Input
              type="date"
              value={form.birthDate}
              onChange={(e) => setForm((c) => ({ ...c, birthDate: e.target.value }))}
            />
          </Field>
          <span className="hidden sm:block" />
          <Field label="E-mail (optionnel)">
            <Input
              type="email"
              autoComplete="email"
              placeholder="prenom.nom@exemple.ga"
              value={form.email}
              onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            />
          </Field>
          <Field label="Téléphone (optionnel)">
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+241 07 00 00 00"
              value={form.phone}
              onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
            />
          </Field>
          {isGraduatePromo ? (
            <>
              <Field label="Poste actuel (optionnel)">
                <Input
                  value={form.careerTitle}
                  onChange={(e) => setForm((c) => ({ ...c, careerTitle: e.target.value }))}
                />
              </Field>
              <Field label="Structure (optionnel)">
                <Input
                  value={form.careerOrganization}
                  onChange={(e) => setForm((c) => ({ ...c, careerOrganization: e.target.value }))}
                />
              </Field>
            </>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((c) => ({ ...c, published: e.target.checked }))}
          />
          Publié sur le portail
        </label>
      </form>
    </Modal>
  );
}
