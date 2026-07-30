export function Meter({ label, value, total, hint }: { label: string; value: number; total: number; hint?: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{pct}%</p>
      </div>
      <div className="mt-2 h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-3 rounded-full bg-[#2a78d6] dark:bg-[#3987e5]"
          style={{ width: `${pct}%` }}
          title={`${label}: ${pct}%`}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}
