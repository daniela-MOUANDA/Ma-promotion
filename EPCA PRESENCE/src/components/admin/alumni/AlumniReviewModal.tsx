import { ContactPendingAlert } from "@/components/admin/students/ContactPendingAlert";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { StudentAvatar } from "@/components/promotions/StudentAvatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Chip } from "@/components/ui/Surface";
import { promotionDisplay } from "@/lib/academic-year";
import { formatDate } from "@/lib/format";
import { approveStudentContact, rejectStudentContact } from "@/lib/promotions-store";
import { usePromotionStudents, usePromotions } from "@/lib/use-live-data";
import type { AlumniFeedback } from "@/types/domain";
import { Check, EyeOff, Trash2 } from "lucide-react";

export function AlumniReviewModal({
  item,
  onClose,
  onPublish,
  onHide,
  onDelete,
}: {
  item: AlumniFeedback;
  onClose: () => void;
  onPublish: () => void;
  onHide: () => void;
  onDelete: () => void;
}) {
  const { toast } = useFeedback();
  const promotions = usePromotions();
  const students = usePromotionStudents();
  const student = students.find((entry) => entry.id === item.studentId);
  const promotionValue = promotionDisplay(item.promotionId ?? student?.promotionId, promotions);
  const contactPending = Boolean(student?.contactPending);
  const email = student?.contactPending?.email || student?.email || item.email;
  const phone = student?.contactPending?.phone || student?.phone || "";

  return (
    <Modal
      title={item.fullName}
      subtitle={[item.careerTitle, item.careerOrganization].filter(Boolean).join(" · ") || "Parcours"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button
            type="button"
            className="mr-auto rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            onClick={onDelete}
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {item.status === "published" ? (
            <Button variant="secondary" onClick={onHide}>
              <EyeOff className="h-4 w-4" />
              Masquer
            </Button>
          ) : (
            <Button onClick={onPublish}>
              <Check className="h-4 w-4" />
              Publier
            </Button>
          )}
        </>
      }
    >
      {student?.contactPending ? (
        <div className="mb-6">
          <ContactPendingAlert
            email={student.contactPending.email}
            phone={student.contactPending.phone}
            onApprove={() => {
              approveStudentContact(student.id);
              toast({ tone: "success", title: "Contact publié", message: item.fullName });
            }}
            onReject={() => {
              rejectStudentContact(student.id);
              toast({ tone: "success", title: "Contact refusé", message: item.fullName });
            }}
          />
        </div>
      ) : null}

      <div className="flex gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          <StudentAvatar photoUrl={student?.photoUrl} fullName={item.fullName} textClass="text-base" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={item.status} />
            <span className="text-xs text-slate-400">{formatDate(item.createdAt.slice(0, 10))}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {[email, phone].filter(Boolean).join(" · ") || "Aucun contact"}
            {contactPending ? " · en validation" : ""}
          </p>
        </div>
      </div>

      <blockquote className="mt-6 border-l-2 border-navy-900 pl-4 font-display text-lg leading-8 text-slate-900">
        “{item.experience}”
      </blockquote>

      <dl className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-100">
        <Info label="Promotion" value={promotionValue} />
        <Info label="E-mail" value={email || "—"} pending={contactPending && Boolean(student?.contactPending?.email)} />
        <Info label="Téléphone" value={phone || "—"} pending={contactPending && Boolean(student?.contactPending?.phone)} />
        <Info label="Poste" value={item.careerTitle || "—"} />
        <Info label="Structure" value={item.careerOrganization || "—"} />
        <Info label="Parcours" value={item.careerPath || "—"} />
      </dl>
    </Modal>
  );
}

export function StatusChip({ status }: { status: AlumniFeedback["status"] }) {
  if (status === "published") return <Chip tone="mint">Publié</Chip>;
  if (status === "pending") return <Chip tone="amber">En attente</Chip>;
  return <Chip tone="slate">Masqué</Chip>;
}

function Info({ label, value, pending }: { label: string; value: string; pending?: boolean }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-4 px-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium leading-6 text-slate-900">
        {value}
        {pending ? <span className="ml-2 text-xs font-semibold text-sky">en validation</span> : null}
      </dd>
    </div>
  );
}
