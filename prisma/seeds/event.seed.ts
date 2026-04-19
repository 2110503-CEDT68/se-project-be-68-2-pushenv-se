import { PrismaClient } from '@prisma/client';

export async function seedEvents(prisma: PrismaClient, adminId: string, companyProfileIds: string[]) {
  console.log('Seeding Events & Registrations...');
  
  const createdEvents = [];
  for (let i = 1; i <= 3; i++) {
    const random3 = Math.floor(100 + Math.random() * 900);
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
    const randomCompanies = companyProfileIds.sort(() => 0.5 - Math.random()).slice(0, 3);
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
    const randomSeekers = seekers.sort(() => 0.5 - Math.random()).slice(0, 5);
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
