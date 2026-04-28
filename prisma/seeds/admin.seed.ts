import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

export async function seedAdmin(prisma: PrismaClient) {
  console.log('Seeding Admin...');
  
  const isProd = process.env.NODE_ENV === 'production';
  const email = process.env.SEED_ADMIN_EMAIL || (isProd ? null : 'admin@jobfair.com');
  const password = process.env.SEED_ADMIN_PASSWORD || (isProd ? null : 'password123');

  if (isProd && (!email || !password)) {
    throw new Error('FATAL: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be provided in production environment!');
  }

  // Check if any admin already exists to avoid re-seeding
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.systemAdmin }
  });

  if (existingAdmin) {
    console.log('Admin already exists. Skipping seed.');
    return existingAdmin;
  }

  // At this point we are guaranteed to have email and password as strings
  const passwordHash = await bcrypt.hash(password as string, 10);
  console.log(`Creating admin with email: ${email}`);
  return await prisma.user.create({
    data: {
      name: 'System Admin',
      email: email as string,
      passwordHash,
      role: Role.systemAdmin,
    },
  });
}
