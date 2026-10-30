import { useSyncExternalStore } from "react";

/** Suit une media query (ex. « (min-width: 768px) »). Faux côté serveur, vrai/faux réel dans le navigateur. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
