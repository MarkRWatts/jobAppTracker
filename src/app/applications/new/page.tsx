import Link from "next/link";
import { createApplication } from "@/lib/applications/actions";
import { listCompanyNames } from "@/lib/companies/queries";
import { ApplicationFormFields } from "@/components/ApplicationFormFields";
import { toDateTimeLocalValue } from "@/lib/format";

// Needs a live DB connection for the company-name datalist — never
// statically prerender (there's no DB reachable at build time).
export const dynamic = "force-dynamic";

export default async function NewApplicationPage() {
  const companyNames = await listCompanyNames();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
          ← Applications
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">New application</h1>
      </div>
      <form action={createApplication}>
        <ApplicationFormFields
          companyNames={companyNames}
          showInitialStatus
          submitLabel="Add application"
          defaults={{ occurredAt: toDateTimeLocalValue(new Date()) }}
        />
      </form>
    </main>
  );
}
