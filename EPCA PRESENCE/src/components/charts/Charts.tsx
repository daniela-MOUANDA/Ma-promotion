import { useId } from "react";

export interface Slice {
  label: string;
  value: number;
  color: string;
  hint?: string;
}

/** Palette monochrome bleu marine, du plus foncé au plus clair. */
export const NAVY_RAMP = ["#0b1f3a", "#1c4270", "#2b6cb0", "#5b8ac0", "#8ba7c8", "#b9cade", "#d8e2ee"];

export const ACCENT = {
  emerald: "#0f8a5f",
  amber: "#c98a1e",
  rose: "#c0392f",
  slate: "#94a3b8",
};

export function rampColor(index: number) {
  return NAVY_RAMP[index % NAVY_RAMP.length];
}

export function Donut({
  data,
  size = 168,
  thickness = 20,
  centerValue,
  centerLabel,
}: {
  data: Slice[];
  size?: number;
  thickness?: number;
  centerValue?: string | number;
  centerLabel?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let consumed = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#eef1f6"
          strokeWidth={thickness}
        />
        {total > 0
          ? data.map((item) => {
              const length = (item.value / total) * circumference;
              const dashOffset = -consumed;
              consumed += length;
              if (item.value === 0) return null;
              return (
                <circle
                  key={item.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={dashOffset}
                >
                  <title>{`${item.label} — ${item.value}`}</title>
                </circle>
              );
            })
          : null}
      </g>
      {centerValue !== undefined ? (
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          className="fill-slate-900 font-display text-2xl font-extrabold"
        >
          {centerValue}
        </text>
      ) : null}
      {centerLabel ? (
        <text x="50%" y="62%" textAnchor="middle" className="fill-slate-400 text-[11px]">
          {centerLabel}
        </text>
      ) : null}
    </svg>
  );
}

export function Legend({ data, total }: { data: Slice[]; total: number }) {
  return (
    <ul className="min-w-0 flex-1 space-y-2.5">
      {data.map((item) => {
        const share = total ? Math.round((item.value / total) * 100) : 0;
        return (
          <li key={item.label} className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
              {item.label}
              {item.hint ? <span className="ml-1.5 text-xs text-slate-400">{item.hint}</span> : null}
            </span>
            <span className="shrink-0 font-display text-sm font-bold text-slate-900">{item.value}</span>
            <span className="w-9 shrink-0 text-right text-xs text-slate-400">{share} %</span>
          </li>
        );
      })}
    </ul>
  );
}

export function ColumnChart({
  data,
  height = 170,
  suffix,
}: {
  data: { label: string; value: number; color?: string; caption?: string }[];
  height?: number;
  suffix?: string;
}) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
        {data.map((item) => {
          const ratio = (item.value / max) * 100;
          return (
            <div key={item.label} className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
              <p className="text-center font-display text-[13px] font-bold text-slate-900">
                {item.value}
                {suffix ? <span className="text-[11px] font-medium text-slate-400">{suffix}</span> : null}
              </p>
              <div
                className="w-full rounded-t-lg transition-all duration-500 group-hover:opacity-85"
                style={{
                  height: `${Math.max(ratio * 0.85, item.value ? 3 : 1)}%`,
                  background: item.color ?? "#2b6cb0",
                }}
                title={`${item.label} — ${item.value}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 border-t border-hairline pt-2 sm:gap-3">
        {data.map((item) => (
          <div key={item.label} className="min-w-0 flex-1 text-center">
            <p className="truncate text-[11px] font-semibold text-slate-600">{item.label}</p>
            {item.caption ? <p className="truncate text-[10px] text-slate-400">{item.caption}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RankBars({
  data,
  max: forcedMax,
}: {
  data: { label: string; value: number; caption?: string; color?: string }[];
  max?: number;
}) {
  const max = forcedMax ?? Math.max(1, ...data.map((item) => item.value));
  return (
    <ul className="space-y-3.5">
      {data.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-medium text-slate-700">
              {item.label}
              {item.caption ? <span className="ml-2 text-xs text-slate-400">{item.caption}</span> : null}
            </span>
            <span className="shrink-0 font-display text-sm font-bold text-slate-900">{item.value}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${(item.value / max) * 100}%`, background: item.color ?? "#1c4270" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TrendArea({
  points,
  height = 150,
  color = "#1c4270",
  labels,
}: {
  points: number[];
  height?: number;
  color?: string;
  labels?: string[];
}) {
  const gradientId = useId();
  const width = 600;
  const max = Math.max(1, ...points);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const toY = (value: number) => height - 14 - (value / max) * (height - 30);

  const line = points.map((value, index) => `${index * stepX},${toY(value)}`).join(" ");
  const area = `M0,${height} L${points
    .map((value, index) => `${index * stepX},${toY(value)}`)
    .join(" L")} L${width},${height} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2={width}
            y1={height - 14 - ratio * (height - 30)}
            y2={height - 14 - ratio * (height - 30)}
            stroke="#eef1f6"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((value, index) => (
          <circle key={index} cx={index * stepX} cy={toY(value)} r="3" fill="white" stroke={color} strokeWidth="2">
            <title>{`${labels?.[index] ?? ""} — ${value}`}</title>
          </circle>
        ))}
      </svg>
      {labels ? (
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          {labels.map((label, index) =>
            index === 0 || index === labels.length - 1 || index === Math.floor(labels.length / 2) ? (
              <span key={label + index}>{label}</span>
            ) : (
              <span key={label + index} className="hidden sm:inline">
                {label}
              </span>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

export function Sparkline({ points, color = "#1c4270" }: { points: number[]; color?: string }) {
  const width = 80;
  const height = 26;
  const max = Math.max(1, ...points);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const line = points.map((value, index) => `${index * stepX},${height - (value / max) * (height - 4) - 2}`);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline
        points={line.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Barres empilées : une colonne par promotion, chaque statut en segment. */
export function StackedColumns({
  rows,
  keys,
  height = 220,
}: {
  rows: { label: string; values: Record<string, number> }[];
  keys: { id: string; label: string; color: string }[];
  height?: number;
}) {
  const totals = rows.map((row) => keys.reduce((sum, key) => sum + (row.values[key.id] ?? 0), 0));
  const max = Math.max(1, ...totals);

  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-4" style={{ height }}>
        {rows.map((row, index) => {
          const total = totals[index];
          return (
            <div key={row.label} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <p className="mb-1.5 text-center font-display text-[13px] font-bold text-slate-900">{total}</p>
              <div
                className="flex w-full flex-col-reverse overflow-hidden rounded-t-lg"
                style={{ height: `${Math.max((total / max) * 86, total ? 8 : 2)}%` }}
              >
                {keys.map((key) => {
                  const value = row.values[key.id] ?? 0;
                  if (!value || !total) return null;
                  return (
                    <div
                      key={key.id}
                      style={{ height: `${(value / total) * 100}%`, background: key.color }}
                      title={`${row.label} · ${key.label} : ${value}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 border-t border-hairline pt-2 sm:gap-4">
        {rows.map((row) => (
          <p key={row.label} className="min-w-0 flex-1 truncate text-center text-[11px] font-semibold text-slate-600">
            {row.label}
          </p>
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
        {keys.map((key) => (
          <li key={key.id} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ background: key.color }} />
            {key.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Funnel({
  steps,
}: {
  steps: { label: string; value: number; color?: string }[];
}) {
  const max = Math.max(1, ...steps.map((item) => item.value));
  return (
    <ul className="space-y-2.5">
      {steps.map((step, index) => {
        const width = (step.value / max) * 100;
        const previous = index > 0 ? steps[index - 1].value : null;
        const conversion = previous ? Math.round((step.value / (previous || 1)) * 100) : null;
        return (
          <li key={step.label} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm text-slate-600">{step.label}</span>
            <span className="relative h-8 min-w-0 flex-1 overflow-hidden rounded-lg bg-slate-100">
              <span
                className="absolute inset-y-0 left-0 rounded-lg transition-[width] duration-500"
                style={{
                  width: `${step.value ? Math.max(width, 16) : 0}%`,
                  background: step.color ?? "#1c4270",
                }}
              />
              {step.value ? (
                <span className="absolute inset-y-0 left-3 flex items-center font-display text-xs font-bold text-white">
                  {step.value}
                </span>
              ) : (
                <span className="absolute inset-y-0 left-3 flex items-center font-display text-xs font-bold text-slate-400">
                  0
                </span>
              )}
            </span>
            <span className="w-12 shrink-0 text-right text-xs text-slate-400">
              {conversion !== null ? `${conversion} %` : "—"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
