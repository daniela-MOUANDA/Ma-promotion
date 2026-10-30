import { CyberHead, CyberTable, Td, Th, Tr } from "@/components/admin/CyberTable";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/Surface";
import { academicYearForNumber, promotionLabelForNumber } from "@/lib/academic-year";
import { cohortSwitchCopy } from "@/lib/cohort";
import {
  createPromotion,
  deletePromotion,
  patchPromotion,
  setPromotionCohort,
} from "@/lib/promotions-store";
import { usePromotions } from "@/lib/use-live-data";
import type { Promotion } from "@/types/domain";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const emptyForm = {
  number: "",
  label: "",
  academicYear: "",
  status: "en_cours" as Promotion["status"],
  summary: "",
};

export function AdminPromotionsPage() {
  const { confirm, toast } = useFeedback();
  const promotions = usePromotions();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function close() {
    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
  }

  function startCreate() {
    const nextNumber = (promotions[0]?.number ?? 30) + 1;
    setEditingId(null);
    setForm({
      number: String(nextNumber),
      label: promotionLabelForNumber(nextNumber),
      academicYear: academicYearForNumber(nextNumber),
      status: "en_cours",
      summary: "",
    });
    setOpen(true);
  }

  function startEdit(item: Promotion) {
    setEditingId(item.id);
    setForm({
      number: String(item.number),
      label: item.label,
      academicYear: item.academicYear,
      status: item.status,
      summary: item.summary,
    });
    setOpen(true);
  }

  function onNumberChange(value: string) {
    const number = Number(value);
    setForm((current) => {
      const autoLabel = promotionLabelForNumber(Number(current.number));
      const autoYear = academicYearForNumber(Number(current.number));
      return {
        ...current,
        number: value,
        label: !current.label || current.label === autoLabel ? promotionLabelForNumber(number) : current.label,
        academicYear:
          !current.academicYear || current.academicYear === autoYear
            ? academicYearForNumber(number)
            : current.academicYear,
      };
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const number = Number(form.number);
    if (!number || !form.label.trim() || !form.academicYear.trim()) {
      toast({
        tone: "danger",
        title: "Champs incomplets",
        message: "Numéro, libellé et année académique sont obligatoires.",
      });
      return;
    }
    const payload = {
      number,
      label: form.label.trim(),
      academicYear: form.academicYear.trim(),
      status: form.status,
      summary: form.summary.trim(),
      studentCount: 0,
    };
    if (editingId) {
      const current = promotions.find((item) => item.id === editingId);
      if (current && current.status !== payload.status) {
        const ok = await confirm(cohortSwitchCopy(payload.status));
        if (!ok) return;
      }
      patchPromotion(editingId, payload);
      toast({ tone: "success", title: "Promotion mise à jour", message: payload.label });
    } else {
      createPromotion(payload);
      toast({ tone: "success", title: "Promotion créée", message: payload.label });
    }
    close();
  }

  async function changeStatus(item: Promotion, status: Promotion["status"]) {
    if (status === item.status) return;
    const ok = await confirm(cohortSwitchCopy(status));
    if (!ok) return;
    setPromotionCohort(item.id, status);
    toast({
      tone: "success",
      title: status === "terminee" ? "Promotion diplômée" : "Promotion en formation",
      message: item.label,
    });
  }

  async function remove(item: Promotion) {
    const ok = await confirm({
      title: "Supprimer la promotion ?",
      message: `${item.label} et les profils associés seront retirés.`,
      confirmLabel: "Supprimer",
    });
    if (!ok) return;
    deletePromotion(item.id);
    toast({ tone: "success", title: "Promotion supprimée", message: item.label });
    if (editingId === item.id) close();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Ma Promotion"
        title="Promotions"
        description="Année académique, statut et effectif de chaque promotion."
        actions={
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Nouvelle promotion
          </Button>
        }
      />

      <CyberTable
        minWidth="720px"
        empty={
          promotions.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">Aucune promotion.</p>
          ) : null
        }
      >
        <CyberHead>
          <tr>
            <Th>Promotion</Th>
            <Th>Année académique</Th>
            <Th>Profils</Th>
            <Th>Statut</Th>
            <Th>Actions</Th>
          </tr>
        </CyberHead>
        <tbody>
          {promotions.map((item) => (
            <Tr key={item.id}>
              <Td>
                <p className="font-display font-semibold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-400">{item.number}e</p>
              </Td>
              <Td className="font-medium text-slate-800">{item.academicYear}</Td>
              <Td>{item.studentCount}</Td>
              <Td>
                <div className="w-44">
                  <Select
                    aria-label={`Statut de ${item.label}`}
                    value={item.status}
                    onChange={(event) =>
                      void changeStatus(item, event.target.value as Promotion["status"])
                    }
                    className="!rounded-xl !py-2"
                  >
                    <option value="en_cours">En formation</option>
                    <option value="terminee">Diplômée</option>
                  </Select>
                </div>
              </Td>
              <Td>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-900"
                    onClick={() => startEdit(item)}
                    aria-label="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => void remove(item)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </CyberTable>

      {open ? (
        <Modal
          title={editingId ? "Modifier la promotion" : "Nouvelle promotion"}
          subtitle="L’année académique s’affiche sur le portail. Le statut s’applique à tous les élèves, sauf abandons et exclus."
          onClose={close}
          footer={
            <>
              <Button variant="secondary" onClick={close}>
                Annuler
              </Button>
              <Button type="submit" form="promotion-form">
                {editingId ? "Enregistrer" : "Créer la promotion"}
              </Button>
            </>
          }
        >
          <form id="promotion-form" className="space-y-4" onSubmit={(event) => void save(event)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Numéro">
                <Input
                  type="number"
                  min={1}
                  required
                  value={form.number}
                  onChange={(event) => onNumberChange(event.target.value)}
                />
              </Field>
              <Field label="Année académique">
                <Input
                  required
                  value={form.academicYear}
                  onChange={(event) => setForm((current) => ({ ...current, academicYear: event.target.value }))}
                  placeholder="2024-2026"
                />
              </Field>
              <Field label="Libellé" className="sm:col-span-2">
                <Input
                  required
                  value={form.label}
                  onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                  placeholder="31e promotion"
                />
              </Field>
              <Field
                label="Statut"
                hint="Diplômée ou en formation pour toute la promotion."
                className="sm:col-span-2"
              >
                <Select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value as Promotion["status"] }))
                  }
                >
                  <option value="en_cours">En formation</option>
                  <option value="terminee">Diplômée</option>
                </Select>
              </Field>
              <Field label="Résumé" className="sm:col-span-2">
                <Textarea
                  rows={3}
                  value={form.summary}
                  onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                />
              </Field>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}