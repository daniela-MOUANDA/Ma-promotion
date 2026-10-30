import { ContactPendingAlert } from "@/components/admin/students/ContactPendingAlert";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { StudentAvatar } from "@/components/promotions/StudentAvatar";
import { StudentStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { OriginBadge } from "@/components/ui/OriginBadge";
import { formatDate } from "@/lib/format";
import { approveStudentContact, rejectStudentContact } from "@/lib/promotions-store";
import {
  usePromotionCategories,
  usePromotionFilieres,
  usePromotions,
} from "@/lib/use-live-data";
import type { PublicStudent } from "@/types/domain";
import { Pencil } from "lucide-react";

export function StudentProfileModal({
  student,
  onClose,
  onEdit,
}: {
  student: PublicStudent;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { toast } = useFeedback();
  const promotions = usePromotions();
  const categories = usePromotionCategories();
  const filieres = usePromotionFilieres();
  const promotion = promotions.find((item) => item.id === student.promotionId);
  const category = categories.find((item) => item.id === student.categoryId);
  const filiere = filieres.find((item) => item.id === student.filiereId);

  const fields = [
    { label: "Promotion", value: promotion?.label ?? "—" },
    { label: "Année académique", value: promotion?.academicYear ?? "—" },
    { label: "Catégorie", value: category?.code ?? "—" },
    { label: "Filière", value: filiere?.name ?? "—" },
    { label: "Statut", value: statusLabel(student.status) },
    { label: "Origine", value: student.origin === "INTERNE" ? "Interne" : "Externe" },
    { label: "Date de naissance", value: student.birthDate ? formatDate(student.birthDate) : "—" },
    {
      label: "E-mail",
      value: student.contactPending?.email || student.email || "—",
      hint: student.contactPending?.email ? "en validation" : undefined,
    },
    {
      label: "Téléphone",
      value: student.contactPending?.phone || student.phone || "—",
      hint: student.contactPending?.phone ? "en validation" : undefined,
    },
    { label: "Visibilité", value: student.published === false ? "Non publié" : "Publié sur le portail" },
    ...(student.photoPending ? [{ label: "Photo", value: "En attente de validation" }] : []),
    ...(student.careerTitle ? [{ label: "Poste", value: student.careerTitle }] : []),
    ...(student.careerOrganization ? [{ label: "Structure", value: student.careerOrganization }] : []),
  ];

  return (
    <Modal
      title={student.fullName}
      subtitle={[promotion?.label, category?.code, filiere?.name].filter(Boolean).join("  ·  ")}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Modifier
          </Button>
        </>
      }
    >
      {student.contactPending ? (
        <div className="mb-6">
          <ContactPendingAlert
            email={student.contactPending.email}
            phone={student.contactPending.phone}
            onApprove={() => {
              approveStudentContact(student.id);
              toast({ tone: "success", title: "Contact publié", message: student.fullName });
            }}
            onReject={() => {
              rejectStudentContact(student.id);
              toast({ tone: "success", title: "Contact refusé", message: student.fullName });
            }}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-8 sm:flex-row">
        <div className="shrink-0">
          <div className="h-56 w-44 overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-black/[0.06]">
            <StudentAvatar photoUrl={student.photoUrl} fullName={student.fullName} textClass="text-4xl" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StudentStatusBadge status={student.status} />
            <OriginBadge origin={student.origin} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-900">Informations</p>
          <dl className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {fields.map((field) => (
              <div key={field.label} className="grid grid-cols-[9.5rem_1fr] gap-4 px-4 py-3">
                <dt className="text-sm text-slate-500">{field.label}</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {field.value}
                  {"hint" in field && field.hint ? (
                    <span className="ml-2 text-xs font-semibold text-sky">{field.hint}</span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Modal>
  );
}

function statusLabel(status: PublicStudent["status"]) {
  if (status === "DIPLOME") return "Diplômé";
  if (status === "ABANDON") return "Abandon";
  if (status === "EXCLU") return "Exclu";
  return "En formation";
}
