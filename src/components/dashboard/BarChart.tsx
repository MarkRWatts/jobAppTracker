type BarDatum = { label: string; value: string | number; displayValue?: string };

/** Horizontal bar chart, single series — one hue for magnitude comparison, per dataviz guidance. */
export function BarChart({ title, data, emptyLabel }: { title: string; data: BarDatum[]; emptyLabel?: string }) {
  const numericValues = data.map((d) => Number(d.value));
  const max = Math.max(1, ...numericValues);
  const hasData = data.some((d) => Number(d.value) > 0);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h3>
      {hasData ? (
        <div className="mt-3 flex flex-col gap-2">
          {data.map((d) => {
            const value = Number(d.value);
            const widthPct = (value / max) * 100;
            const display = d.displayValue ?? String(d.value);
            return (
              <div key={d.label} className="flex items-center gap-3" title={`${d.label}: ${display}`}>
                <span className="w-32 shrink-0 truncate text-xs text-zinc-500 dark:text-zinc-400">{d.label}</span>
                <div className="h-3 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {value > 0 && (
                    <div
                      className="h-3 rounded-r-[4px] bg-[#2a78d6] dark:bg-[#3987e5]"
                      style={{ width: `${widthPct}%` }}
                    />
                  )}
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {display}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">{emptyLabel ?? "No data yet."}</p>
      )}
    </div>
  );
}
