import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

export async function seedJobSeekers(prisma: PrismaClient) {
  console.log('Seeding Job Seekers...');
  const password = process.env.SEED_JOBSEEKER_PASSWORD || 'password123';
  const passwordHash = await bcrypt.hash(password, 10);
  
  for (let i = 1; i <= 10; i++) {
    const random3 = Math.floor(100 + Math.random() * 900);
    const email = `student${random3}@example.com`;

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: `Student ${random3}`,
        email,
        passwordHash,
        role: Role.jobSeeker,
        phone: `081-${random3}-000`,
      },
    });
  }

  // Fixed users for E2E tests
  const testUsers = [
    { name: 'Test User', email: 'test@jobseeker.com', phone: '081-000-0001' },
    { name: 'Delete Me', email: 'delete-me@jobseeker.com', phone: '081-000-0002' },
  ];

  for (const tu of testUsers) {
    await prisma.user.upsert({
      where: { email: tu.email },
      update: {},
      create: {
        ...tu,
        passwordHash,
        role: Role.jobSeeker,
      },
    });
  }
}
