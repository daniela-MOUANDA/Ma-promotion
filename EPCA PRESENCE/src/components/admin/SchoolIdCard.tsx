import { Logo } from "@/components/brand/Logo";
import { getCategory, getFiliere } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { fullName, initials } from "@/lib/roster";
import type { Application } from "@/types/domain";

export function SchoolIdCard({ student }: { student: Application }) {
  const category = getCategory(student.categoryId);
  const filiere = getFiliere(student.filiereId);
  const year = new Date().getFullYear();

  return (
    <article className="relative w-[420px] overflow-hidden rounded-xl border-2 border-navy-900 bg-white shadow-card">
      <div className="grad-brand flex items-center justify-between px-4 py-3 text-white">
        <Logo size="sm" withName inverted />
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">Carte scolaire</p>
      </div>
      <div className="grid grid-cols-[112px_1fr] gap-4 p-4">
        <div className="flex h-36 flex-col items-center justify-center border border-line bg-navy-50 text-navy-900">
          <span className="font-serif text-3xl">{initials(student)}</span>
          <span className="mt-2 text-[10px] uppercase tracking-[0.14em] text-ink-soft">Photo</span>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">Élève / étudiant</p>
          <h3 className="font-serif text-2xl leading-tight text-navy-900">{fullName(student)}</h3>
          <p className="text-sm text-ink-soft">
            {category?.code ?? "—"} · {filiere?.name ?? "—"}
          </p>
          <p className="font-mono text-xs text-navy-800">{student.number.replace("CAND", "ETU")}</p>
          <p className="text-xs text-ink-soft">Né(e) le {formatDate(student.birthDate)}</p>
          <p className="text-xs text-ink-soft">Année {year} / {year + 1}</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-line bg-paper px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-ink-soft">
        <span>EPCA Gabon</span>
        <span>Document de démonstration</span>
      </div>
    </article>
  );
}
