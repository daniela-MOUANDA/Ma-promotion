import { GalleryPhotoModal } from "@/components/admin/gallery/GalleryPhotoModal";
import { PhotoLightbox } from "@/components/gallery/PhotoLightbox";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Card, Chip, EmptyState, PageHeader } from "@/components/ui/Surface";
import { addGalleryPhoto, deleteGalleryPhoto, getGalleryEvents, patchGalleryPhoto } from "@/lib/gallery-store";
import { compressImage } from "@/lib/image-file";
import { useGallery } from "@/lib/use-live-data";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { GalleryPhoto } from "@/types/domain";
import { Eye, EyeOff, ImagePlus, Images, Loader2, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

const SUGGESTED_EVENTS = [
  "Remise des diplômes",
  "Cérémonie",
  "Visite institutionnelle",
  "Vie de l’école",
  "Conférence",
  "Photo de groupe",
  "Séminaire",
];

export function AdminGalleryPage() {
  const { confirm, toast } = useFeedback();
  const photos = useGallery();
  const input = useRef<HTMLInputElement>(null);
  const [event, setEvent] = useState("");
  const [eventDate, setEventDate] = useState(today());
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = editingId ? (photos.find((item) => item.id === editingId) ?? null) : null;
  const usedEvents = getGalleryEvents(photos);
  const eventOptions = [...new Set([...SUGGESTED_EVENTS, ...usedEvents])];
  const visible = filter === "all" ? photos : photos.filter((item) => item.event === filter);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (list.length === 0) {
      toast({ tone: "danger", title: "Aucune image", message: "Choisissez des fichiers JPG, PNG ou WebP." });
      return;
    }
    if (!event.trim()) {
      toast({
        tone: "danger",
        title: "Événement manquant",
        message: "Indiquez d’abord le nom de l’événement (ex. Remise des diplômes 2026).",
      });
      return;
    }
    setBusy(true);
    let added = 0;
    let failed = 0;
    for (const file of list) {
      try {
        const src = await compressImage(file);
        const ok = addGalleryPhoto({
          title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || event.trim(),
          caption: caption.trim(),
          event: event.trim(),
          eventDate,
          src,
        });
        if (ok) added += 1;
        else {
          failed += 1;
          break;
        }
      } catch {
        failed += 1;
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    if (added > 0) {
      toast({
        tone: "success",
        title: `${added} photo${added > 1 ? "s" : ""} ajoutée${added > 1 ? "s" : ""}`,
        message: event.trim(),
      });
    }
    if (failed > 0) {
      toast({
        tone: "danger",
        title: "Espace de stockage plein",
        message: "Supprimez d’anciennes photos avant d’en ajouter de nouvelles.",
      });
    }
  }

  async function remove(photo: GalleryPhoto) {
    const ok = await confirm({
      title: "Supprimer cette photo ?",
      message: photo.title,
      confirmLabel: "Supprimer",
    });
    if (!ok) return;
    deleteGalleryPhoto(photo.id);
    toast({ tone: "success", title: "Photo supprimée", message: photo.title });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Ma Promotion"
        title="Galerie photos"
        description="Publiez les photos des événements de l’école : remise des diplômes, journées culturelles, vie de classe. Elles apparaissent aussitôt sur le site public."
      />

      <Card className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <Field label="Événement / album" hint="Les photos d’un même événement sont regroupées sur le site.">
            <Input
              list="gallery-events"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="ex. Remise des diplômes 2026"
            />
            <datalist id="gallery-events">
              {eventOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>
          <Field label="Date de l’événement">
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Légende (optionnelle)">
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Un mot sur ce moment…"
          />
        </Field>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void upload(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-brand-500 bg-brand-50" : "border-hairline bg-slate-50",
          )}
        >
          {busy ? (
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          ) : (
            <ImagePlus className="h-8 w-8 text-brand-500" />
          )}
          <p className="font-display text-sm font-bold text-slate-800">
            {busy ? "Traitement des photos…" : "Glissez vos photos ici"}
          </p>
          <p className="text-xs text-slate-500">JPG, PNG ou WebP — plusieurs fichiers à la fois, réduits automatiquement.</p>
          <input
            ref={input}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && void upload(e.target.files)}
          />
          <Button size="sm" disabled={busy} onClick={() => input.current?.click()}>
            Choisir des photos
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {["all", ...usedEvents].map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setFilter(name)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              filter === name ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-hairline hover:bg-slate-50",
            )}
          >
            {name === "all" ? `Toutes (${photos.length})` : name}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card padded={false}>
          <EmptyState icon={Images} title="Aucune photo" message="Ajoutez la première photo d’un événement ci-dessus." />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((photo, index) => (
            <article
              key={photo.id}
              className="group overflow-hidden rounded-2xl border border-hairline bg-white shadow-card"
            >
              <button
                type="button"
                onClick={() => setOpen(index)}
                className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left"
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  loading="lazy"
                  className={cn(
                    "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
                    !photo.published && "opacity-40 grayscale",
                  )}
                />
                <div className="absolute left-2 top-2">
                  {photo.published ? <Chip tone="mint">Publiée</Chip> : <Chip tone="slate">Masquée</Chip>}
                </div>
              </button>
              <div className="space-y-2 p-3">
                <p className="px-1 font-display text-sm font-bold text-slate-900">{photo.title}</p>
                <p className="px-1 text-xs text-slate-500">
                  {photo.event} · {formatDate(photo.eventDate)}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => patchGalleryPhoto(photo.id, { published: !photo.published })}
                  >
                    {photo.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {photo.published ? "Masquer" : "Publier"}
                  </Button>
                  <div className="flex items-center">
                    <button
                      type="button"
                      aria-label="Modifier"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-900"
                      onClick={() => setEditingId(photo.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Supprimer"
                      className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => void remove(photo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <PhotoLightbox photos={visible} index={open} onClose={() => setOpen(null)} onChange={setOpen} />
      {editing ? (
        <GalleryPhotoModal photo={editing} events={eventOptions} onClose={() => setEditingId(null)} />
      ) : null}
    </div>
  );
}
