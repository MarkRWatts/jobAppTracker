import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";

/** Looks up a company by case-insensitive name match, creating it if none exists. Scoped per-user — each user gets their own "Acme Corp" row. */
export async function findOrCreateCompany(name: string): Promise<string> {
  const { id: userId } = await requireUser();
  const trimmed = name.trim();
  const existing = await prisma.company.findFirst({
    where: { userId, name: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.company.create({ data: { userId, name: trimmed } });
  return created.id;
}

export async function listCompanyNames(): Promise<string[]> {
  const { id: userId } = await requireUser();
  const companies = await prisma.company.findMany({
    where: { userId },
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return companies.map((c) => c.name);
}
