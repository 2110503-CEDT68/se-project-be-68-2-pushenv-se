import { PrismaClient } from '@prisma/client';
import { randomInt } from 'node:crypto';

/** Securely shuffle an array using Fisher-Yates and node:crypto randomInt */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function seedEvents(prisma: PrismaClient, adminId: string, companyProfileIds: string[]) {
  console.log('Seeding Events & Registrations...');
  
  const createdEvents = [];
  for (let i = 1; i <= 3; i++) {
    const random3 = randomInt(100, 1000);
    const eventName = `Event ${random3}`;
    
    const event = await prisma.event.create({
      data: {
        name: eventName,
        description: `Description for ${eventName}.`,
        location: `Location Room ${i}`,
        startDate: new Date('2026-10-10'),
        endDate: new Date('2026-10-12'),
        isPublished: i < 3, // Last one is draft
        createdBy: adminId,
      },
    });
    createdEvents.push(event);

    // Link random companies
    const randomCompanies = shuffle(companyProfileIds).slice(0, 3);
    for (const cid of randomCompanies) {
      await prisma.eventCompany.create({
        data: { eventId: event.id, companyId: cid }
      });
    }
  }

  // Register job seekers to published events
  const seekers = await prisma.user.findMany({ where: { role: 'jobSeeker' } });
  for (const event of createdEvents) {
    if (!event.isPublished) continue;
    const randomSeekers = shuffle(seekers).slice(0, 5);
    for (const seeker of randomSeekers) {
      await prisma.eventRegistration.upsert({
        where: {
          eventId_jobSeekerId: {
            eventId: event.id,
            jobSeekerId: seeker.id,
          }
        },
        update: {},
        create: {
          eventId: event.id,
          jobSeekerId: seeker.id,
        }
      });
    }
  }
}
