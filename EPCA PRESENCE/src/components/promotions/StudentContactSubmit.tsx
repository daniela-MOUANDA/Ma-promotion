import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { submitStudentContact, wasLastWriteSaved } from "@/lib/promotions-store";
import type { PublicStudent } from "@/types/domain";
import { CheckCircle2, Clock, Phone } from "lucide-react";
import { useMemo, useState } from "react";

/** Carte « Laisser mon contact » : publié après validation admin. */
export function StudentContactSubmit({ student }: { student: PublicStudent }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: student.email ?? "",
    phone: student.phone ?? "",
  });

  const waiting = sent || Boolean(student.contactPending);
  const hasPublished = Boolean(student.email || student.phone);
  const ready = useMemo(() => Boolean(form.email.trim() || form.phone.trim()), [form]);

  function send(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;
    submitStudentContact(student.id, {
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    if (wasLastWriteSaved()) {
      setSent(true);
      setError("");
    } else {
      setError("Impossible d’enregistrer le contact pour le moment. Réessayez.");
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-sky/25 bg-brand-50 p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-900 text-white">
          <Phone className="h-5 w-5" />
        </span>
        <h2 className="font-display text-xl font-bold text-navy-900">
          {hasPublished ? "Mon contact" : "Laisser mon contact"}
        </h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        Parce que le relationnel compte, et que l’EPCA reste une famille. La formation s’achève, les liens
        non : laissez un contact pour rester joignable, aujourd’hui comme plus tard.
      </p>

      {hasPublished ? (
        <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-white px-4 py-3.5 text-sm text-navy-900">
          <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ok" />
          Votre contact a été validé. Il n’est plus modifiable depuis le profil.
        </p>
      ) : waiting ? (
        <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-white px-4 py-3.5 text-sm text-navy-900">
          {sent ? (
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ok" />
          ) : (
            <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-sky" />
          )}
          {sent
            ? "Merci. Votre contact a été envoyé et sera publié dès qu’il aura été validé."
            : "Un contact est déjà en attente de validation pour ce profil."}
        </p>
      ) : (
        <form className="mt-5 space-y-3" onSubmit={send}>
          <Field label="E-mail">
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="prenom.nom@exemple.ga"
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
            />
          </Field>
          <Field label="Téléphone" hint="Un des deux champs suffit. Format conseillé : +241 07 00 00 00.">
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+241 07 00 00 00"
              value={form.phone}
              onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
            />
          </Field>
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          <Button type="submit" disabled={!ready} className="w-full">
            Envoyer pour validation
          </Button>
        </form>
      )}
    </div>
  );
}
