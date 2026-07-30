"use client";

import { useTransition } from "react";
import { deleteStatusEvent } from "@/lib/applications/statusEvents";

export function DeleteStatusEventButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this status update? This can't be undone.")) return;
        startTransition(async () => {
          try {
            await deleteStatusEvent(id);
          } catch (error) {
            alert(error instanceof Error ? error.message : "Couldn't delete this status update.");
          }
        });
      }}
      className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
