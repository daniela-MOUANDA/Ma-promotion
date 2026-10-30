import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getPromotion } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { approveStudentContact, rejectStudentContact } from "@/lib/promotions-store";
import { usePromotionStudents } from "@/lib/use-live-data";
import { Check, X } from "lucide-react";

export function ContactReviewModal({ onClose }: { onClose: () => void }) {
  const { toast } = useFeedback();
  const pending = usePromotionStudents().filter((item) => item.contactPending);

  return (
    <Modal
      size="lg"
      title="Contacts à valider"
      subtitle="Proposés par les élèves depuis leur profil. Rien n’est public avant votre accord."
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Fermer
        </Button>
      }
    >
      {pending.length === 0 ? (
        <div className="grid place-items-center gap-2 py-12 text-center">
          <Check className="h-8 w-8 text-emerald-600" />
          <p className="font-display text-base font-bold text-slate-900">Tout est à jour</p>
          <p className="text-sm text-slate-500">Aucun contact en attente de validation.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {pending.map((item) => {
            const next = item.contactPending!;
            return (
              <li key={item.id} className="rounded-2xl border border-hairline p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold text-slate-900">{item.fullName}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {getPromotion(item.promotionId)?.label ?? "—"}
                      {item.contactSubmittedAt ? ` · envoyé le ${formatDate(item.contactSubmittedAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        rejectStudentContact(item.id);
                        toast({ tone: "success", title: "Contact refusé", message: item.fullName });
                      }}
                    >
                      <X className="h-4 w-4" />
                      Refuser
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        approveStudentContact(item.id);
                        toast({ tone: "success", title: "Contact publié", message: item.fullName });
                      }}
                    >
                      <Check className="h-4 w-4" />
                      Approuver
                    </Button>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Compare label="E-mail" current={item.email} next={next.email} />
                  <Compare label="Téléphone" current={item.phone} next={next.phone} />
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

function Compare({ label, current, next }: { label: string; current?: string; next?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-400">Actuel · {current || "—"}</p>
      <p className="mt-1 text-sm font-semibold text-navy-900">Proposé · {next || "—"}</p>
    </div>
  );
}
