import { Source, ApplicationStatus } from "@/generated/prisma/enums";
import { SOURCE_LABELS } from "@/lib/format";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const fieldWrapClass = "flex flex-col gap-1";

type ApplicationFormDefaults = {
  companyName?: string;
  jobTitle?: string;
  source?: string;
  jobUrl?: string | null;
  location?: string | null;
  salaryRange?: string | null;
  jobDescription?: string | null;
  usedCustomCv?: boolean;
  cvVersionLabel?: string | null;
  cvUrl?: string | null;
  usedCoverLetter?: boolean;
  coverLetterUrl?: string | null;
  notes?: string | null;
  occurredAt?: string;
};

export function ApplicationFormFields({
  defaults,
  companyNames,
  showInitialStatus,
  submitLabel,
}: {
  defaults?: ApplicationFormDefaults;
  companyNames: string[];
  showInitialStatus: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Role</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="companyName">
              Company
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              list="company-names"
              defaultValue={defaults?.companyName}
              className={inputClass}
              placeholder="Acme Corp"
            />
            <datalist id="company-names">
              {companyNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="jobTitle">
              Job title
            </label>
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              required
              defaultValue={defaults?.jobTitle}
              className={inputClass}
              placeholder="Head of Security"
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="source">
              Source
            </label>
            <select id="source" name="source" required defaultValue={defaults?.source ?? ""} className={inputClass}>
              <option value="" disabled>
                Select a source
              </option>
              {Object.values(Source).map((value) => (
                <option key={value} value={value}>
                  {SOURCE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="jobUrl">
              Job URL
            </label>
            <input
              id="jobUrl"
              name="jobUrl"
              type="url"
              defaultValue={defaults?.jobUrl ?? undefined}
              className={inputClass}
              placeholder="https://..."
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="location">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              defaultValue={defaults?.location ?? undefined}
              className={inputClass}
              placeholder="London / Remote"
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="salaryRange">
              Salary range
            </label>
            <input
              id="salaryRange"
              name="salaryRange"
              type="text"
              defaultValue={defaults?.salaryRange ?? undefined}
              className={inputClass}
              placeholder="£90k–£110k"
            />
          </div>
        </div>
        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="jobDescription">
            Job description
          </label>
          <textarea
            id="jobDescription"
            name="jobDescription"
            rows={5}
            defaultValue={defaults?.jobDescription ?? undefined}
            className={inputClass}
            placeholder="Paste the job description here..."
          />
        </div>
      </section>

      {showInitialStatus && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Starting point
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={fieldWrapClass}>
              <label className={labelClass} htmlFor="initialStatus">
                Status
              </label>
              <select id="initialStatus" name="initialStatus" defaultValue={ApplicationStatus.SAVED} className={inputClass}>
                <option value={ApplicationStatus.SAVED}>Saved</option>
                <option value={ApplicationStatus.APPLIED}>Applied</option>
              </select>
            </div>
            <div className={fieldWrapClass}>
              <label className={labelClass} htmlFor="occurredAt">
                Date &amp; time
              </label>
              <input
                id="occurredAt"
                name="occurredAt"
                type="datetime-local"
                required
                defaultValue={defaults?.occurredAt}
                className={inputClass}
              />
            </div>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          CV &amp; cover letter
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="usedCustomCv"
                defaultChecked={defaults?.usedCustomCv}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
              />
              Used a tailored CV
            </label>
            <input
              name="cvVersionLabel"
              type="text"
              defaultValue={defaults?.cvVersionLabel ?? undefined}
              className={inputClass}
              placeholder="Version label, e.g. &ldquo;Tailored — Head of Security&rdquo;"
            />
            <input
              name="cvUrl"
              type="url"
              defaultValue={defaults?.cvUrl ?? undefined}
              className={inputClass}
              placeholder="Link to the CV (optional)"
            />
          </div>
          <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="usedCoverLetter"
                defaultChecked={defaults?.usedCoverLetter}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
              />
              Used a cover letter
            </label>
            <input
              name="coverLetterUrl"
              type="url"
              defaultValue={defaults?.coverLetterUrl ?? undefined}
              className={inputClass}
              placeholder="Link to the cover letter (optional)"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Notes</h2>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults?.notes ?? undefined}
          className={inputClass}
          placeholder="Anything else worth remembering about this application..."
        />
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
