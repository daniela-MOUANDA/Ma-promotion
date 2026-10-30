const EVENT = "epca:data";

export function emitDataChanged() {
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeData(onStoreChange: () => void) {
  window.addEventListener(EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}
