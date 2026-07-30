import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const acme = await prisma.company.create({
    data: { name: "Acme Corp", website: "https://acme.example" },
  });

  await prisma.application.create({
    data: {
      companyId: acme.id,
      jobTitle: "Head of Security",
      source: "LINKEDIN",
      currentStatus: "APPLIED",
      usedCustomCv: true,
      cvVersionLabel: "Tailored — Head of Security, Acme",
      statusEvents: {
        create: [
          { status: "SAVED", occurredAt: new Date("2026-07-20T09:00:00Z") },
          { status: "APPLIED", occurredAt: new Date("2026-07-21T14:30:00Z") },
        ],
      },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
