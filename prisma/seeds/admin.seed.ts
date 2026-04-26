import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

export async function seedAdmin(prisma: PrismaClient) {
  console.log('Seeding Admin...');
  const password = process.env.SEED_ADMIN_PASSWORD || 'password123';
  const passwordHash = await bcrypt.hash(password, 10);
  return await prisma.user.upsert({
    where: { email: 'admin@jobfair.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@jobfair.com',
      passwordHash,
      role: Role.systemAdmin,
    },
  });
}
