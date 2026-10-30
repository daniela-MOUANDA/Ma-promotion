import { StudentAvatar } from "@/components/promotions/StudentAvatar";
import { StudentStatusBadge } from "@/components/ui/Badge";
import { OriginBadge } from "@/components/ui/OriginBadge";
import { getCategory, getFiliere, studentProfilePath } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { PublicStudent } from "@/types/domain";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function StudentCard({ student }: { student: PublicStudent }) {
  const faded = student.status === "ABANDON" || student.status === "EXCLU";
  const category = getCategory(student.categoryId);
  const filiere = getFiliere(student.filiereId);
  const role = [student.careerTitle, student.careerOrganization].filter(Boolean).join(" · ");

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25 }}>
      <Link
        to={studentProfilePath(student)}
        className={cn(
          "group relative block overflow-hidden rounded-[1.75rem] bg-navy-900 shadow-card",
          faded && "opacity-70",
        )}
      >
        <div className={cn("relative aspect-[4/5] overflow-hidden", faded && "grayscale")}>
          <div className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-105">
            <StudentAvatar photoUrl={student.photoUrl} fullName={student.fullName} textClass="text-6xl" />
          </div>
          <span className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/30 to-transparent" />

          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 font-display text-xs font-extrabold text-navy-900">
              {category?.code ?? "—"}
            </span>
            <OriginBadge origin={student.origin} onPhoto />
          </div>
          <div className="absolute right-4 top-4">
            <StudentStatusBadge status={student.status} />
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-glow">
              {filiere?.name ?? "Filière"}
            </p>
            <h3 className="mt-1.5 font-display text-2xl font-bold leading-tight tracking-tight">
              {student.fullName}
            </h3>
            {role ? <p className="mt-1 text-xs leading-5 text-white/65">{role}</p> : null}
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold backdrop-blur transition-colors group-hover:bg-white group-hover:text-navy-900">
              Voir le profil <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
