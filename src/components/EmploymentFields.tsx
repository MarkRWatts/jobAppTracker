"use client";

import { useState } from "react";
import { EmploymentType, IR35Status } from "@/generated/prisma/enums";
import { EMPLOYMENT_TYPE_LABELS, IR35_STATUS_LABELS } from "@/lib/format";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const fieldWrapClass = "flex flex-col gap-1";

export function EmploymentFields({
  defaultEmploymentType,
  defaultSalaryRange,
  defaultDayRate,
  defaultIr35Status,
}: {
  defaultEmploymentType?: string;
  defaultSalaryRange?: string | null;
  defaultDayRate?: string | null;
  defaultIr35Status?: string | null;
}) {
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    defaultEmploymentType === EmploymentType.CONTRACT ? EmploymentType.CONTRACT : EmploymentType.PERMANENT,
  );
  const isContract = employmentType === EmploymentType.CONTRACT;

  return (
    <>
      <div className={fieldWrapClass}>
        <label className={labelClass} htmlFor="employmentType">
          Employment type
        </label>
        <select
          id="employmentType"
          name="employmentType"
          value={employmentType}
          onChange={(event) => setEmploymentType(event.target.value as EmploymentType)}
          className={inputClass}
        >
          {Object.values(EmploymentType).map((value) => (
            <option key={value} value={value}>
              {EMPLOYMENT_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      {isContract ? (
        <>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="dayRate">
              Day rate
            </label>
            <input
              id="dayRate"
              name="dayRate"
              type="text"
              defaultValue={defaultDayRate ?? undefined}
              className={inputClass}
              placeholder="£500–£600/day"
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="ir35Status">
              IR35 status
            </label>
            <select id="ir35Status" name="ir35Status" defaultValue={defaultIr35Status ?? IR35Status.UNKNOWN} className={inputClass}>
              {Object.values(IR35Status).map((value) => (
                <option key={value} value={value}>
                  {IR35_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="salaryRange">
            Salary range
          </label>
          <input
            id="salaryRange"
            name="salaryRange"
            type="text"
            defaultValue={defaultSalaryRange ?? undefined}
            className={inputClass}
            placeholder="£90k–£110k"
          />
        </div>
      )}
    </>
  );
}
