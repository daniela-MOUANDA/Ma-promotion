import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "info" | "danger";

interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  message?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface FeedbackValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toast: (options: Omit<ToastItem, "id">) => void;
}

const FeedbackContext = createContext<FeedbackValue | null>(null);

export function useFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error("useFeedback doit être utilisé dans FeedbackProvider");
  return value;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(
    null,
  );

  const closeDialog = useCallback((ok: boolean) => {
    setDialog((current) => {
      current?.resolve(ok);
      return null;
    });
  }, []);

  const toast = useCallback((options: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...options, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ ...options, resolve });
    });
  }, []);

  useEffect(() => {
    if (!dialog) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeDialog(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, closeDialog]);

  const value = useMemo(() => ({ confirm, toast }), [confirm, toast]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {dialog ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Fermer"
            onClick={() => closeDialog(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="dialog-pop relative w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-float"
          >
            <span
              className={cn(
                "grid h-12 w-12 place-items-center rounded-2xl text-white",
                dialog.danger ? "grad-blush" : "grad-brand",
              )}
            >
              {dialog.danger ? <TriangleAlert className="h-6 w-6" /> : <Info className="h-6 w-6" />}
            </span>
            <h2 id="confirm-title" className="mt-4 font-display text-xl font-bold tracking-tight text-slate-900">
              {dialog.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{dialog.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => closeDialog(false)}>
                {dialog.cancelLabel ?? "Annuler"}
              </Button>
              <Button variant={dialog.danger ? "danger" : "primary"} onClick={() => closeDialog(true)}>
                {dialog.confirmLabel ?? "Confirmer"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            className="toast-slide pointer-events-auto flex gap-3 rounded-2xl border border-hairline bg-white p-4 shadow-float"
          >
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white",
                item.tone === "success" && "grad-mint",
                item.tone === "danger" && "grad-blush",
                item.tone === "info" && "grad-sky",
              )}
            >
              {item.tone === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : item.tone === "danger" ? (
                <TriangleAlert className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-slate-900">{item.title}</p>
              {item.message ? <p className="mt-1 text-sm text-slate-500">{item.message}</p> : null}
            </div>
            <button
              type="button"
              className="text-slate-400 transition-colors hover:text-slate-700"
              onClick={() => setToasts((current) => current.filter((toastItem) => toastItem.id !== item.id))}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}
