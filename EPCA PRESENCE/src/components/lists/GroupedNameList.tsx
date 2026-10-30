import { groupApplicationsForExport } from "@/lib/list-export";
import { fullName } from "@/lib/roster";
import type { Application } from "@/types/domain";

export function GroupedNameList({ applications }: { applications: Application[] }) {
  const groups = groupApplicationsForExport(applications);
  if (!groups.length) {
    return (
      <p className="mt-5 border-t border-hairline pt-4 text-sm text-slate-500">Aucun nom à afficher.</p>
    );
  }
  return (
    <div className="mt-5 space-y-5 border-t border-hairline pt-4">
      {groups.map((group) => (
        <div key={`${group.categoryCode}-${group.filiereName}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Catégorie {group.categoryCode} · {group.filiereName}
          </p>
          <ol className="mt-2 divide-y divide-hairline">
            {group.students.map((application, index) => (
              <li
                key={application.id}
                className="flex flex-col gap-0.5 py-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="text-slate-700">
                  <span className="mr-3 font-mono text-xs text-slate-400">{index + 1}.</span>
                  {fullName(application)}
                </span>
                <span className="break-all pl-7 font-mono text-[11px] text-slate-400 sm:pl-0 sm:text-xs">
                  {application.number}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
