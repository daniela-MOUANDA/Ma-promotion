import { Button } from "@/components/ui/Button";
import { Check, Phone, X } from "lucide-react";

export function ContactPendingAlert({
  email,
  phone,
  onApprove,
  onReject,
}: {
  email?: string;
  phone?: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-600 text-white">
          <Phone className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy-900">Contact à valider</p>
          <p className="mt-0.5 text-sm text-slate-600">
            {[email, phone].filter(Boolean).join(" · ") || "Aucun détail"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={onReject}>
            <X className="h-4 w-4" />
            Refuser
          </Button>
          <Button size="sm" onClick={onApprove}>
            <Check className="h-4 w-4" />
            Publier
          </Button>
        </div>
      </div>
    </div>
  );
}
