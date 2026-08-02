import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const devUser = await prisma.user.upsert({
    where: { email: "dev@example.com" },
    update: {},
    create: { email: "dev@example.com", name: "Dev User" },
  });
  const userId = devUser.id;

  const acme = await prisma.company.create({
    data: { userId, name: "Acme Corp", website: "https://acme.example" },
  });
  const globex = await prisma.company.create({ data: { userId, name: "Globex" } });
  const initech = await prisma.company.create({ data: { userId, name: "Initech" } });
  const umbrella = await prisma.company.create({ data: { userId, name: "Umbrella Group" } });
  const soylent = await prisma.company.create({ data: { userId, name: "Soylent Industries" } });

  await prisma.application.create({
    data: {
      userId,
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

  await prisma.application.create({
    data: {
      userId,
      companyId: globex.id,
      jobTitle: "Director of Security & Compliance",
      source: "DIRECT",
      currentStatus: "INTERVIEW",
      usedCustomCv: true,
      usedCoverLetter: true,
      statusEvents: {
        create: [
          { status: "SAVED", occurredAt: new Date("2026-07-10T09:00:00Z") },
          { status: "APPLIED", occurredAt: new Date("2026-07-11T09:00:00Z") },
          { status: "RECRUITER_CALL", occurredAt: new Date("2026-07-15T13:00:00Z") },
          { status: "INTERVIEW", stageLabel: "Stage 1 — Recruiter panel", occurredAt: new Date("2026-07-22T10:00:00Z") },
        ],
      },
    },
  });

  await prisma.application.create({
    data: {
      userId,
      companyId: initech.id,
      jobTitle: "BISO Cyber GRC Associate",
      source: "REED",
      currentStatus: "SAVED",
      statusEvents: { create: [{ status: "SAVED", occurredAt: new Date("2026-07-28T09:00:00Z") }] },
    },
  });

  await prisma.application.create({
    data: {
      userId,
      companyId: umbrella.id,
      jobTitle: "Deputy Director Cyber Security",
      source: "TOTAL_JOBS",
      currentStatus: "DISCOUNTED",
      statusEvents: {
        create: [
          { status: "APPLIED", occurredAt: new Date("2026-06-01T09:00:00Z") },
          { status: "DISCOUNTED", occurredAt: new Date("2026-06-10T09:00:00Z"), notes: "Went with an internal candidate." },
        ],
      },
    },
  });

  await prisma.application.create({
    data: {
      userId,
      companyId: soylent.id,
      jobTitle: "Information Security Officer",
      source: "OTHER",
      currentStatus: "UNSUCCESSFUL",
      statusEvents: {
        create: [
          { status: "APPLIED", occurredAt: new Date("2026-05-01T09:00:00Z") },
          { status: "INTERVIEW", occurredAt: new Date("2026-05-15T09:00:00Z") },
          { status: "UNSUCCESSFUL", occurredAt: new Date("2026-05-22T09:00:00Z") },
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
