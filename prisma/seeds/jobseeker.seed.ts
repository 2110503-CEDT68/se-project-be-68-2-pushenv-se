import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

export async function seedJobSeekers(prisma: PrismaClient) {
  console.log('Seeding Job Seekers...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
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
}
