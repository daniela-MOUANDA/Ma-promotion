import { useMemo, useState } from "react";

export function useSelection(ids: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const idSet = useMemo(() => new Set(ids), [ids]);

  const visibleSelected = useMemo(
    () => ids.filter((id) => selected.has(id)),
    [ids, selected],
  );

  const allVisibleSelected = ids.length > 0 && visibleSelected.length === ids.length;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clear() {
    setSelected(new Set());
  }

  function prune() {
    setSelected((current) => {
      const next = new Set<string>();
      current.forEach((id) => {
        if (idSet.has(id)) next.add(id);
      });
      return next;
    });
  }

  return {
    selected,
    visibleSelected,
    allVisibleSelected,
    toggle,
    toggleAllVisible,
    clear,
    prune,
    count: visibleSelected.length,
  };
}
