import { Button } from "@/components/ui/Button";
import { compressImage } from "@/lib/image-file";
import { submitStudentPhoto, wasLastWriteSaved } from "@/lib/promotions-store";
import type { PublicStudent } from "@/types/domain";
import { Camera, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";

/** Carte « Ajouter ma photo » du profil public : la photo part en validation, jamais publiée directement. */
export function StudentPhotoSubmit({ student }: { student: PublicStudent }) {
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const waiting = sent || Boolean(student.photoPending);
  const locked = Boolean(student.photoUrl);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      setPreview(await compressImage(file, 520, 0.82));
    } catch {
      setError("Cette image ne peut pas être lue. Essayez une photo JPG ou PNG.");
    }
  }

  function send() {
    if (!preview) return;
    setBusy(true);
    submitStudentPhoto(student.id, preview);
    setBusy(false);
    if (wasLastWriteSaved()) {
      setSent(true);
      setPreview("");
    } else {
      setError("Impossible d’enregistrer la photo pour le moment. Réessayez avec une image plus légère.");
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-sky/25 bg-brand-50 p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-900 text-white">
          <Camera className="h-5 w-5" />
        </span>
        <h2 className="font-display text-xl font-bold text-navy-900">
          {locked ? "Ma photo" : "Ajouter ma photo"}
        </h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink-soft">
        C’est votre profil ? Envoyez un portrait net, de face. Il sera publié sur ce profil après validation par
        l’administration.
      </p>

      {locked ? (
        <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-white px-4 py-3.5 text-sm text-navy-900">
          <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ok" />
          Votre photo a été validée. Elle n’est plus modifiable depuis le profil.
        </p>
      ) : waiting ? (
        <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-white px-4 py-3.5 text-sm text-navy-900">
          {sent ? (
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ok" />
          ) : (
            <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-sky" />
          )}
          {sent
            ? "Merci ! Votre photo a été envoyée et sera publiée dès qu’elle aura été validée."
            : "Une photo est déjà en attente de validation pour ce profil."}
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="grid h-28 w-[5.25rem] shrink-0 place-items-center overflow-hidden rounded-2xl border border-dashed border-navy-700/30 bg-white text-navy-700/40">
              {preview ? (
                <img src={preview} alt="Aperçu de votre photo" className="h-full w-full object-cover object-top" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
            </div>
            <div className="space-y-2">
              <label className="inline-flex h-10 cursor-pointer items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-navy-900 transition-colors hover:border-navy-900/30">
                {preview ? "Choisir une autre photo" : "Choisir une photo"}
                <input type="file" accept="image/*" className="sr-only" onChange={onPick} />
              </label>
              <p className="text-xs text-ink-soft">JPG ou PNG. Elle est réduite automatiquement.</p>
            </div>
          </div>
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          <Button disabled={!preview || busy} onClick={send} className="w-full">
            Envoyer pour validation
          </Button>
        </div>
      )}
    </div>
  );
}
