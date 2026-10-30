import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { createStudents, wasLastWriteSaved } from "@/lib/promotions-store";
import {
  downloadStudentTemplate,
  IMPORT_COLUMNS,
  readStudentSheet,
  validateStudentRows,
  type ImportRow,
} from "@/lib/student-import";
import { usePromotionsCatalog } from "@/lib/use-live-data";
import { AlertTriangle, CheckCircle2, Copy, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

const stateStyle: Record<ImportRow["state"], string> = {
  ok: "bg-emerald-50 text-emerald-700",
  error: "bg-rose-50 text-rose-700",
  duplicate: "bg-amber-50 text-amber-700",
};

export function ImportStudentsModal({ onClose }: { onClose: () => void }) {
  const { toast } = useFeedback();
  const catalog = usePromotionsCatalog();
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [onlyIssues, setOnlyIssues] = useState(false);

  const counts = useMemo(() => {
    const list = rows ?? [];
    return {
      ok: list.filter((row) => row.state === "ok").length,
      error: list.filter((row) => row.state === "error").length,
      duplicate: list.filter((row) => row.state === "duplicate").length,
    };
  }, [rows]);

  const visible = useMemo(
    () => (rows ?? []).filter((row) => (onlyIssues ? row.state !== "ok" : true)),
    [rows, onlyIssues],
  );

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      if (!/\.xlsx$/i.test(file.name)) {
        throw new Error("Format non pris en charge : enregistrez votre fichier au format Excel (.xlsx).");
      }
      const raw = await readStudentSheet(file);
      if (raw.length === 0) throw new Error("Aucune ligne d’élève trouvée sous les en-têtes.");
      setRows(validateStudentRows(raw, catalog));
      setFileName(file.name);
    } catch (cause) {
      setRows(null);
      setError(cause instanceof Error ? cause.message : "Impossible de lire ce fichier.");
    } finally {
      setBusy(false);
    }
  }

  function confirm() {
    const valid = (rows ?? []).flatMap((row) => (row.student ? [row.student] : []));
    if (valid.length === 0) return;
    const count = createStudents(valid);
    if (wasLastWriteSaved()) {
      toast({
        tone: "success",
        title: "Import terminé",
        message: `${count} élève(s) ajouté(s).`,
      });
    } else {
      toast({
        tone: "danger",
        title: "Espace de stockage plein",
        message: "Les élèves sont visibles pour l’instant mais ne seront pas conservés.",
      });
    }
    onClose();
  }

  return (
    <Modal
      size="xl"
      title="Importer des élèves depuis Excel"
      subtitle="Un fichier .xlsx : une page par filière, à remplir comme le modèle."
      onClose={onClose}
      footer={
        rows ? (
          <>
            <label className="mr-auto inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600 hover:text-navy-900">
              <FileSpreadsheet className="h-4 w-4" />
              Choisir un autre fichier
              <input type="file" accept=".xlsx" className="sr-only" onChange={onFile} />
            </label>
            <Button variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button disabled={counts.ok === 0} onClick={confirm}>
              Importer {counts.ok} élève{counts.ok > 1 ? "s" : ""}
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        )
      }
    >
      {!rows ? (
        <div className="space-y-5">
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition-colors hover:border-navy-700 hover:bg-white",
              busy && "pointer-events-none opacity-60",
            )}
          >
            {busy ? (
              <Loader2 className="h-8 w-8 animate-spin text-navy-700" />
            ) : (
              <FileSpreadsheet className="h-8 w-8 text-navy-700" />
            )}
            <span className="font-display text-base font-bold text-slate-900">
              {busy ? "Lecture du fichier…" : "Choisir le fichier Excel"}
            </span>
            <span className="text-sm text-slate-500">
              Vous pourrez tout vérifier avant que quoi que ce soit soit ajouté.
            </span>
            <input type="file" accept=".xlsx" className="sr-only" onChange={onFile} />
          </label>

          {error ? (
            <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <div className="rounded-2xl border border-hairline p-4">
            <p className="text-sm font-semibold text-slate-800">Une page Excel par filière</p>
            <p className="mt-1.5 text-sm text-slate-500">
              Douanes, Impôts, Administration générale… chaque onglet du modèle est déjà nommé. Pas besoin de retaper
              la filière.
            </p>
            <p className="mt-4 text-sm font-semibold text-slate-800">Colonnes à remplir dans chaque page</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {IMPORT_COLUMNS.map((title) => (
                <span
                  key={title}
                  className="rounded-full bg-navy-900/5 px-3 py-1 text-xs font-semibold text-navy-900"
                >
                  {title}
                </span>
              ))}
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-500">
              <li>
                <strong className="text-slate-700">Promotion</strong> : « 31e promotion » ou simplement 31 — elle doit
                déjà exister.
              </li>
              <li>
                <strong className="text-slate-700">Catégorie</strong> : le code affiché en haut de la page (C2, B1,
                A2…).
              </li>
              <li>
                <strong className="text-slate-700">Statut</strong> : En formation, Diplômé, Abandon ou Exclu (vide =
                statut de la promotion).
              </li>
              <li>
                <strong className="text-slate-700">Interne / Externe</strong> : obligatoire pour chaque élève.
              </li>
            </ul>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => void downloadStudentTemplate(catalog)}
            >
              <Download className="h-4 w-4" />
              Télécharger le modèle Excel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-semibold text-slate-700">{fileName}</span>
            <Pill icon={CheckCircle2} tone="ok" label={`${counts.ok} prêt(s)`} />
            <Pill icon={Copy} tone="duplicate" label={`${counts.duplicate} déjà présent(s)`} />
            <Pill icon={AlertTriangle} tone="error" label={`${counts.error} à corriger`} />
            <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={onlyIssues}
                onChange={(e) => setOnlyIssues(e.target.checked)}
              />
              Voir seulement les anomalies
            </label>
          </div>

          {counts.error + counts.duplicate > 0 ? (
            <p className="text-sm text-slate-500">
              Les lignes à corriger et les doublons seront ignorés. Corrigez le fichier puis rechargez-le, ou
              importez déjà les lignes prêtes.
            </p>
          ) : null}

          <div className="scroll-slim max-h-[46vh] overflow-auto rounded-2xl border border-hairline">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Onglet</th>
                  <th className="px-3 py-2.5">Noms</th>
                  <th className="px-3 py-2.5">Promotion</th>
                  <th className="px-3 py-2.5">Catégorie</th>
                  <th className="px-3 py-2.5">Filière</th>
                  <th className="px-3 py-2.5">Statut</th>
                  <th className="px-3 py-2.5">Int. / Ext.</th>
                  <th className="px-3 py-2.5">Contrôle</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={`${row.sheet}-${row.line}-${row.fullName}`} className="border-t border-hairline">
                    <td className="px-3 py-2 text-slate-400">
                      {row.sheet} · {row.line}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{row.fullName || "—"}</td>
                    <td className="px-3 py-2">{row.promotionRaw || "—"}</td>
                    <td className="px-3 py-2">{row.categoryRaw || "—"}</td>
                    <td className="px-3 py-2">{row.filiereRaw || row.sheet || "—"}</td>
                    <td className="px-3 py-2">{row.statusRaw || "En formation"}</td>
                    <td className="px-3 py-2">{row.originRaw || "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
                          stateStyle[row.state],
                        )}
                      >
                        {row.state === "ok" ? "Prêt" : row.reason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Pill({
  icon: Icon,
  tone,
  label,
}: {
  icon: typeof CheckCircle2;
  tone: ImportRow["state"];
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        stateStyle[tone],
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
