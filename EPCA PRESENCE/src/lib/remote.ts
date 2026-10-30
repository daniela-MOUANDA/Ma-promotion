let remote = false;
let remoteError: string | null = null;

export function preferMocks() {
  return import.meta.env.VITE_USE_MOCKS === "true";
}

export function isRemoteEnabled() {
  return remote;
}

export function getRemoteError() {
  return remoteError;
}

export function setRemoteState(ok: boolean, error?: string | null) {
  remote = ok;
  remoteError = ok ? null : (error ?? null);
}

const timers = new Map<string, number>();

export function queueRemoteSave(key: string, run: () => Promise<unknown>) {
  const previous = timers.get(key);
  if (previous) window.clearTimeout(previous);
  const id = window.setTimeout(() => {
    void run().catch((error: unknown) => {
      console.error(`[api] sauvegarde ${key} impossible`, error);
    });
  }, 280);
  timers.set(key, id);
}
