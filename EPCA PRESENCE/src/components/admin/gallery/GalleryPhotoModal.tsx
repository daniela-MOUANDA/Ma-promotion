import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { patchGalleryPhoto } from "@/lib/gallery-store";
import { compressImage } from "@/lib/image-file";
import type { GalleryPhoto } from "@/types/domain";
import { ImagePlus } from "lucide-react";
import { useState } from "react";

export function GalleryPhotoModal({
  photo,
  events,
  onClose,
}: {
  photo: GalleryPhoto;
  events: string[];
  onClose: () => void;
}) {
  const { toast } = useFeedback();
  const [form, setForm] = useState({
    title: photo.title,
    caption: photo.caption,
    event: photo.event,
    eventDate: photo.eventDate,
    src: photo.src,
  });

  async function pickPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const src = await compressImage(file);
      setForm((current) => ({ ...current, src }));
    } catch {
      toast({ tone: "danger", title: "Image illisible", message: "Choisissez un fichier JPG, PNG ou WebP." });
    }
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    const album = form.event.trim();
    if (!title || !album || !form.eventDate) {
      toast({
        tone: "danger",
        title: "Champs incomplets",
        message: "Le titre, l’événement et la date sont obligatoires.",
      });
      return;
    }
    const saved = patchGalleryPhoto(photo.id, {
      title,
      caption: form.caption.trim(),
      event: album,
      eventDate: form.eventDate,
      src: form.src,
    });
    if (saved) {
      toast({ tone: "success", title: "Photo mise à jour", message: title });
    } else {
      toast({
        tone: "danger",
        title: "Espace de stockage plein",
        message: "La modification n’a pas pu être enregistrée.",
      });
    }
    onClose();
  }

  return (
    <Modal
      title="Modifier la photo"
      subtitle={photo.event}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="gallery-photo-form">
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="gallery-photo-form" className="space-y-4" onSubmit={save}>
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
          <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-200">
            <img src={form.src} alt={form.title} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold text-slate-700">Image</p>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
              <ImagePlus className="h-3.5 w-3.5" />
              Remplacer
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => void pickPhoto(e)} />
            </label>
          </div>
        </div>

        <Field label="Titre">
          <Input
            required
            value={form.title}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Événement / album">
            <Input
              required
              list="gallery-edit-events"
              value={form.event}
              onChange={(e) => setForm((current) => ({ ...current, event: e.target.value }))}
            />
            <datalist id="gallery-edit-events">
              {events.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>
          <Field label="Date de l’événement">
            <Input
              required
              type="date"
              value={form.eventDate}
              onChange={(e) => setForm((current) => ({ ...current, eventDate: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Légende">
          <Input
            value={form.caption}
            onChange={(e) => setForm((current) => ({ ...current, caption: e.target.value }))}
            placeholder="Un mot sur ce moment…"
          />
        </Field>
      </form>
    </Modal>
  );
}
