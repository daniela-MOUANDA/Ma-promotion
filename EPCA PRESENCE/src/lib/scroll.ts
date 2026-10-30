import type Lenis from "lenis";

let lenis: Lenis | null = null;

/** Enregistre (ou retire) l’instance Lenis pour que le retour en haut reste synchronisé avec elle. */
export function registerLenis(instance: Lenis | null) {
  lenis = instance;
}

function nativeTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function isReload() {
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (entry) return entry.type === "reload";
  return (performance as Performance & { navigation?: { type: number } }).navigation?.type === 1;
}

/** Remonte en haut de page — en douceur (clic sur le logo) ou instantanément (changement de page, actualisation). */
export function scrollToTop({ immediate = false }: { immediate?: boolean } = {}) {
  nativeTop();
  if (lenis) {
    lenis.scrollTo(0, immediate ? { immediate: true, force: true } : { duration: 1.1, force: true });
  }
}

/**
 * À l’actualisation, le navigateur rouvre souvent la page à l’endroit où on l’avait quittée.
 * On désactive cette restauration : la page repart toujours du haut.
 */
export function startAtTopOnReload() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  const goTop = () => {
    nativeTop();
    lenis?.scrollTo(0, { immediate: true, force: true });
  };

  goTop();

  window.addEventListener("load", () => {
    goTop();
    requestAnimationFrame(goTop);
  });

  window.addEventListener("pageshow", (event) => {
    // Retour via le cache « retour arrière » : on laisse le navigateur. Actualisation : on remonte.
    if (event.persisted || isReload()) {
      if (isReload()) goTop();
    }
  });
}
