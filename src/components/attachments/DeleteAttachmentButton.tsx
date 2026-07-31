"use client";

import { useTransition } from "react";
import { deleteAttachment } from "@/lib/attachments/actions";

export function DeleteAttachmentButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this file? This can't be undone.")) return;
        startTransition(async () => {
          try {
            await deleteAttachment(id);
          } catch (error) {
            alert(error instanceof Error ? error.message : "Couldn't delete this file.");
          }
        });
      }}
      className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
