import "dotenv/config";
import prisma from "./utils/prisma.js";

async function main() {
  console.log("Start seeding 20 diverse events...");

  const admin = await prisma.user.upsert({
    where: { email: "admin@pushenv.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@pushenv.com",
      passwordHash: "hidden", 
      role: "systemAdmin",
    },
  });

  await prisma.event.deleteMany({});

  const events = [
    { name: "Green Tech Summit 2026", description: "Exploring the future of renewable energy and sustainable technology.", location: "Bangkok Convention Center", startDate: new Date("2026-04-30T09:00:00Z"), endDate: new Date("2026-04-30T17:00:00Z"), banner: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Ocean Conservation Workshop", description: "Hands-on workshop on protecting marine life and coastal ecosystems.", location: "Phuket Marine Science Center", startDate: new Date("2026-05-05T10:00:00Z"), endDate: new Date("2026-05-05T15:00:00Z"), banner: "https://images.unsplash.com/photo-1544551763-47a18411c976?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Urban Gardening Class", description: "Learn how to grow your own food in limited city spaces.", location: "Naresuan University", startDate: new Date("2026-04-20T14:00:00Z"), endDate: new Date("2026-04-20T16:00:00Z"), banner: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Sustainable Fashion Fair", description: "Showcase of eco-friendly apparel and ethical manufacturing.", location: "CentralWorld, Bangkok", startDate: new Date("2026-06-12T10:00:00Z"), endDate: new Date("2026-06-14T20:00:00Z"), banner: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Wildlife Photography Walk", description: "Capture the beauty of local fauna with expert guidance.", location: "Khao Yai National Park", startDate: new Date("2026-05-15T06:00:00Z"), endDate: new Date("2026-05-15T10:00:00Z"), banner: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Zero Waste Living Seminar", description: "Practical tips for reducing your environmental footprint.", location: "Chiang Mai University", startDate: new Date("2026-05-20T13:00:00Z"), endDate: new Date("2026-05-20T15:00:00Z"), banner: "https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Solar Energy Expo", description: "The latest in solar panel technology and home battery systems.", location: "BITEC Bangna", startDate: new Date("2026-07-01T10:00:00Z"), endDate: new Date("2026-07-03T18:00:00Z"), banner: "https://images.unsplash.com/photo-1509391366360-feaf94447701?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Reforestation Project: Nan", description: "Join us in planting 10,000 trees to restore the forest floor.", location: "Nan Province", startDate: new Date("2026-06-05T08:00:00Z"), endDate: new Date("2026-06-05T16:00:00Z"), banner: "https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Climate Change Forum", description: "International speakers discussing the policy and action needed now.", location: "United Nations Building, BKK", startDate: new Date("2026-08-10T09:00:00Z"), endDate: new Date("2026-08-12T17:00:00Z"), banner: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Electric Vehicle Meetup", description: "Network with EV owners and learn about charging infrastructure.", location: "Siam Square One", startDate: new Date("2026-05-25T17:00:00Z"), endDate: new Date("2026-05-25T20:00:00Z"), banner: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Composting for Beginners", description: "Turn your kitchen waste into black gold with our help.", location: "Naresuan University", startDate: new Date("2026-04-25T10:00:00Z"), endDate: new Date("2026-04-25T12:00:00Z"), banner: "https://images.unsplash.com/photo-1589151525049-74e5083cfc0e?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Clean Energy Career Fair", description: "Meet representatives from top companies in the green sector.", location: "Kasetsart University", startDate: new Date("2026-06-20T09:00:00Z"), endDate: new Date("2026-06-20T16:00:00Z"), banner: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Air Quality Hackathon", description: "Coding for better air quality monitoring and solution tracking.", location: "True Digital Park", startDate: new Date("2026-07-15T09:00:00Z"), endDate: new Date("2026-07-17T18:00:00Z"), banner: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Sustainable Tourism Summit", description: "Redefining travel for a more responsible future in Thailand.", location: "Krabi Cultural Center", startDate: new Date("2026-09-01T10:00:00Z"), endDate: new Date("2026-09-03T17:00:00Z"), banner: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Permaculture Design Course", description: "A deep dive into living in harmony with nature's systems.", location: "Udon Thani Eco-Village", startDate: new Date("2026-10-10T09:00:00Z"), endDate: new Date("2026-10-24T17:00:00Z"), banner: "https://images.unsplash.com/photo-1592398687702-8a9d023f03b5?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Plastic-Free Thailand Drive", description: "Nationwide movement to ban single-use plastics from markets.", location: "Various Locations", startDate: new Date("2026-11-15T08:00:00Z"), endDate: new Date("2026-11-15T18:00:00Z"), banner: "https://images.unsplash.com/photo-1526951521990-620dc14c214b?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "River Cleanup: Chao Phraya", description: "Collecting floating debris to ensure a cleaner river flow.", location: "Asiatique Pier", startDate: new Date("2026-05-30T07:00:00Z"), endDate: new Date("2026-05-30T11:00:00Z"), banner: "https://images.unsplash.com/photo-1618477462146-050d2767eac4?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Green Architecture Awards", description: "Celebrating the most innovative and energy-efficient designs.", location: "Museum of Contemporary Art, BKK", startDate: new Date("2026-12-05T18:00:00Z"), endDate: new Date("2026-12-05T22:00:00Z"), banner: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Eco-Friendly DIY Workshop", description: "Make your own natural soap and household cleaners.", location: "Thammasat University", startDate: new Date("2026-04-28T13:00:00Z"), endDate: new Date("2026-04-28T16:00:00Z"), banner: "https://images.unsplash.com/photo-1605264964528-06403738d6dc?q=80&w=400", isPublished: true, createdBy: admin.id },
    { name: "Sustainability Film Festival", description: "Documentaries highlighting environmental activism globally.", location: "Alliance Française de Bangkok", startDate: new Date("2026-11-20T17:00:00Z"), endDate: new Date("2026-11-22T21:00:00Z"), banner: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400", isPublished: true, createdBy: admin.id }
  ];

  for (const eventData of events) {
    await prisma.event.create({ data: eventData });
  }

  console.log("Seeding complete! 20 diverse events created.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
