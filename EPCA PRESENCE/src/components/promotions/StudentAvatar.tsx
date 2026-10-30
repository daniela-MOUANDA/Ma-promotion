import { cn } from "@/lib/cn";

// Dégradés de la même famille navy : chaque élève garde toujours le sien.
const TONES = [
  "from-navy-600 to-navy-900",
  "from-sky to-navy-800",
  "from-navy-700 to-navy-950",
  "from-navy-800 to-sky",
  "from-navy-600 to-navy-950",
];

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Portrait de l’élève, ou ses initiales si aucune photo n’a été ajoutée. Remplit son conteneur. */
export function StudentAvatar({
  photoUrl,
  fullName,
  className,
  textClass = "text-lg",
}: {
  photoUrl?: string;
  fullName: string;
  className?: string;
  textClass?: string;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={fullName}
        loading="lazy"
        draggable={false}
        className={cn("h-full w-full object-cover object-top", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br font-display font-bold text-white",
        TONES[hash(fullName) % TONES.length],
        textClass,
        className,
      )}
    >
      {initialsOf(fullName) || "?"}
    </span>
  );
}
