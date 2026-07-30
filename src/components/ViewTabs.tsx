import Link from "next/link";

export function ViewTabs({ active, query }: { active: "board" | "list" | "dashboard"; query: string }) {
  const suffix = query ? `?${query}` : "";
  return (
    <div className="flex gap-1 rounded-md border border-zinc-200 p-1 dark:border-zinc-800">
      <Link href={`/${suffix}`} className={tabClass(active === "board")}>
        Board
      </Link>
      <Link href={`/list${suffix}`} className={tabClass(active === "list")}>
        List
      </Link>
      <Link href="/dashboard" className={tabClass(active === "dashboard")}>
        Dashboard
      </Link>
    </div>
  );
}

function tabClass(active: boolean): string {
  return `rounded px-3 py-1 text-sm font-medium ${
    active
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
  }`;
}
