import { prisma } from "@/lib/db";

/** Looks up a company by case-insensitive name match, creating it if none exists. */
export async function findOrCreateCompany(name: string): Promise<string> {
  const trimmed = name.trim();
  const existing = await prisma.company.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.company.create({ data: { name: trimmed } });
  return created.id;
}

export async function listCompanyNames(): Promise<string[]> {
  const companies = await prisma.company.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return companies.map((c) => c.name);
}
