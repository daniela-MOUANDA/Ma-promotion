const STOP = new Set(["DE", "DES", "DU", "LA", "LE", "LES", "ET", "D", "L", "EN", "AU", "AUX", "REGIE"]);

function wordsFrom(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word && !STOP.has(word));
}

/** Douanes → DOU · Impôts → IMP · Ressources humaines → RH */
export function filiereCodeFromName(name: string) {
  const words = wordsFrom(name);
  if (words.length >= 2) return words.map((word) => word[0]).join("").slice(0, 4);
  const word = words[0] ?? "FIL";
  return word.slice(0, 3);
}

export function uniqueAutoCode(name: string, taken: string[], fallback = "FIL") {
  const base = filiereCodeFromName(name) || fallback;
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

export function uniqueFiliereCode(name: string, taken: string[]) {
  return uniqueAutoCode(name, taken, "FIL");
}
