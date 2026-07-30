"use client";

import { useTransition } from "react";
import { deleteApplication } from "@/lib/applications/actions";

export function DeleteApplicationButton({ id, jobTitle }: { id: string; jobTitle: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Delete the application for "${jobTitle}"? This can't be undone.`)) return;
        startTransition(() => {
          deleteApplication(id);
        });
      }}
      className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
