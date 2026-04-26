import { PrismaClient, Role, JobType } from '@prisma/client';
import bcrypt from 'bcrypt';

export async function seedCompanies(prisma: PrismaClient) {
  console.log('Seeding Companies & Jobs...');
  const password = process.env.SEED_COMPANY_PASSWORD || 'password123';
  const passwordHash = await bcrypt.hash(password, 10);
  const createdUsers = [];
  
  for (let i = 1; i <= 5; i++) {
    const random3 = Math.floor(100 + Math.random() * 900);
    const companyName = `Company ${random3}`;
    const email = `company${random3}@example.com`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: companyName,
        email,
        passwordHash,
        role: Role.companyUser,
        companyProfile: {
          create: {
            description: `Official profile for ${companyName}.`,
            website: `https://company${random3}.example.com`,
          },
        },
      },
      include: { companyProfile: true },
    });
    
    if (user.companyProfile) {
       await prisma.jobListing.createMany({
         data: [
           { companyId: user.companyProfile.id, title: `Position A - ${random3}`, type: JobType.full_time, location: 'Bangkok', description: 'Detailed description for position A.' },
           { companyId: user.companyProfile.id, title: `Position B - ${random3}`, type: JobType.contract, location: 'Remote', description: 'Detailed description for position B.' },
         ],
       });
    }
    createdUsers.push(user);
  }
  return createdUsers;
}
