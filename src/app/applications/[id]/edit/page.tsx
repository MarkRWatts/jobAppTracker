import Link from "next/link";
import { notFound } from "next/navigation";
import { getApplication } from "@/lib/applications/queries";
import { listCompanyNames } from "@/lib/companies/queries";
import { updateApplication } from "@/lib/applications/actions";
import { ApplicationFormFields } from "@/components/ApplicationFormFields";

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [application, companyNames] = await Promise.all([getApplication(id), listCompanyNames()]);
  if (!application) notFound();

  const updateApplicationWithId = updateApplication.bind(null, id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <Link
          href={`/applications/${id}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← {application.jobTitle}
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Edit application</h1>
      </div>
      <form action={updateApplicationWithId}>
        <ApplicationFormFields
          companyNames={companyNames}
          showInitialStatus={false}
          submitLabel="Save changes"
          defaults={{
            companyName: application.company.name,
            jobTitle: application.jobTitle,
            source: application.source,
            jobUrl: application.jobUrl,
            location: application.location,
            employmentType: application.employmentType,
            salaryRange: application.salaryRange,
            dayRate: application.dayRate,
            ir35Status: application.ir35Status,
            jobDescription: application.jobDescription,
            usedCustomCv: application.usedCustomCv,
            cvVersionLabel: application.cvVersionLabel,
            cvUrl: application.cvUrl,
            usedCoverLetter: application.usedCoverLetter,
            coverLetterUrl: application.coverLetterUrl,
            notes: application.notes,
          }}
        />
      </form>
    </main>
  );
}
