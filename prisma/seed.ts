import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { seedAdmin } from './seeds/admin.seed.js';
import { seedCompanies } from './seeds/company.seed.js';
import { seedJobSeekers } from './seeds/jobseeker.seed.js';
import { seedEvents } from './seeds/event.seed.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = process.argv.slice(2);
  const isTargeted = args.length > 0;

  console.log('Starting modular seeding...');

  // 1. Clear existing data only if doing a full seed
  if (!isTargeted) {
    console.log('Cleaning database...');
    await prisma.eventRegistration.deleteMany();
    await prisma.eventCompany.deleteMany();
    await prisma.jobListing.deleteMany();
    await prisma.event.deleteMany();
    await prisma.companyProfile.deleteMany();
    await prisma.user.deleteMany();
  }

  // 2. Run modular seeds
  let admin;
  if (!isTargeted || args.includes('--admin')) {
    admin = await seedAdmin(prisma);
  } else {
    // Need admin for relational seeds if not seeding admin
    admin = await prisma.user.findFirst({ where: { role: 'systemAdmin' } });
  }

  if (!isTargeted || args.includes('--company')) {
    await seedCompanies(prisma);
  }

  if (!isTargeted || args.includes('--jobseeker')) {
    await seedJobSeekers(prisma);
  }

  // 3. Run relational seeds if needed
  if (!isTargeted || args.includes('--event')) {
    if (!admin) {
      console.error('Cannot seed events: No admin user found.');
      return;
    }

    const activeCompanies = await prisma.user.findMany({
      where: { role: 'companyUser' },
      include: { companyProfile: true }
    });

    const companyProfileIds = activeCompanies
      .map(c => c.companyProfile?.id)
      .filter((id): id is string => !!id);

    await seedEvents(prisma, admin.id, companyProfileIds);
  }

  console.log('Full seeding finished successfully!');
}

// Fix: use top-level await instead of promise chain
// Fix: avoid async in .finally() which could go unhandled
try {
  await main();
} catch (e) {
  console.error('Seeding failed:', e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
