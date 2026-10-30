import { Input, Select } from "@/components/ui/Field";
import { APPLICATION_STATUS_LABEL } from "@/constants/labels";
import { getCategories, getFilieres } from "@/lib/catalog";
import { EMPTY_FILTERS, type RosterFilters } from "@/lib/roster";
import type { ApplicationStatus } from "@/types/domain";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const ALL_STATUSES = Object.keys(APPLICATION_STATUS_LABEL) as ApplicationStatus[];

export function AdminFilters({
  value,
  onChange,
  statuses = ALL_STATUSES,
}: {
  value: RosterFilters;
  onChange: (next: RosterFilters) => void;
  statuses?: ApplicationStatus[];
}) {
  const categories = getCategories();
  const filieres = getFilieres();

  function set<K extends keyof RosterFilters>(key: K, next: RosterFilters[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="rounded-2xl border border-hairline bg-white p-4 shadow-card">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={value.q}
            onChange={(event) => set("q", event.target.value)}
            placeholder="Nom, numéro, e-mail…"
            className="pl-9"
          />
        </div>
        <Select value={value.categoryId} onChange={(event) => set("categoryId", event.target.value)}>
          <option value="">Toutes catégories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code}
            </option>
          ))}
        </Select>
        <Select value={value.filiereId} onChange={(event) => set("filiereId", event.target.value)}>
          <option value="">Toutes filières</option>
          {filieres.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select value={value.status} onChange={(event) => set("status", event.target.value)}>
          <option value="">Tous statuts</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {APPLICATION_STATUS_LABEL[status]}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-2 md:col-span-2">
          <Input type="date" value={value.from} onChange={(event) => set("from", event.target.value)} />
          <Input type="date" value={value.to} onChange={(event) => set("to", event.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
          <X className="h-4 w-4" />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}
