import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { StudentAvatar } from "@/components/promotions/StudentAvatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getPromotion } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { approveStudentPhoto, rejectStudentPhoto } from "@/lib/promotions-store";
import { usePromotionStudents } from "@/lib/use-live-data";
import { Check, ImageOff, X } from "lucide-react";

export function PhotoReviewModal({ onClose }: { onClose: () => void }) {
  const { toast } = useFeedback();
  const pending = usePromotionStudents().filter((item) => item.photoPending);

  return (
    <Modal
      size="lg"
      title="Photos à valider"
      subtitle="Proposées par les élèves depuis leur profil. Rien n’est public avant votre accord."
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
          <p className="text-sm text-slate-500">Aucune photo en attente de validation.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {pending.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-5 rounded-2xl border border-hairline p-4">
              <div className="flex items-center gap-3">
                <figure className="text-center">
                  <div className="h-28 w-[5.25rem] overflow-hidden rounded-xl bg-slate-100">
                    {item.photoUrl ? (
                      <StudentAvatar photoUrl={item.photoUrl} fullName={item.fullName} />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-slate-300">
                        <ImageOff className="h-6 w-6" />
                      </span>
                    )}
                  </div>
                  <figcaption className="mt-1.5 text-[11px] text-slate-400">Actuelle</figcaption>
                </figure>
                <span className="text-slate-300">→</span>
                <figure className="text-center">
                  <div className="h-28 w-[5.25rem] overflow-hidden rounded-xl bg-slate-100 ring-2 ring-sky">
                    <img
                      src={item.photoPending}
                      alt={`Photo proposée par ${item.fullName}`}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <figcaption className="mt-1.5 text-[11px] font-semibold text-sky">Proposée</figcaption>
                </figure>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold text-slate-900">{item.fullName}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {getPromotion(item.promotionId)?.label ?? "—"}
                  {item.photoSubmittedAt ? ` · envoyée le ${formatDate(item.photoSubmittedAt)}` : ""}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    rejectStudentPhoto(item.id);
                    toast({ tone: "success", title: "Photo refusée", message: item.fullName });
                  }}
                >
                  <X className="h-4 w-4" />
                  Refuser
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    approveStudentPhoto(item.id);
                    toast({ tone: "success", title: "Photo publiée", message: item.fullName });
                  }}
                >
                  <Check className="h-4 w-4" />
                  Approuver
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
