import { AttachmentCategory } from "@/generated/prisma/enums";
import { uploadAttachment } from "@/lib/attachments/actions";
import { ATTACHMENT_CATEGORY_LABELS, formatDate, formatFileSize } from "@/lib/format";
import { DeleteAttachmentButton } from "./DeleteAttachmentButton";

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

type AttachmentData = {
  id: string;
  category: AttachmentCategory;
  originalName: string;
  sizeBytes: number;
  createdAt: Date;
};

export function AttachmentsSection({ applicationId, attachments }: { applicationId: string; attachments: AttachmentData[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Files</h2>
      {attachments.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex min-w-0 items-center gap-2">
                <a
                  href={`/api/attachments/${attachment.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {attachment.originalName}
                </a>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {ATTACHMENT_CATEGORY_LABELS[attachment.category]}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {formatFileSize(attachment.sizeBytes)} · {formatDate(attachment.createdAt)}
                </span>
                <DeleteAttachmentButton id={attachment.id} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No files yet.</p>
      )}
      <form action={uploadAttachment.bind(null, applicationId)} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="attachment-category">
            Type
          </label>
          <select id="attachment-category" name="category" defaultValue={AttachmentCategory.CV} className={inputClass}>
            {Object.values(AttachmentCategory).map((value) => (
              <option key={value} value={value}>
                {ATTACHMENT_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="attachment-file">
            File
          </label>
          <input id="attachment-file" name="file" type="file" required className={`${inputClass} py-1.5`} />
        </div>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Upload
        </button>
      </form>
    </section>
  );
}
