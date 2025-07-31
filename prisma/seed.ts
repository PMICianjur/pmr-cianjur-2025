// prisma/seed.ts
import { PrismaClient, SchoolCategory } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding kavling data for both categories...');
  
  const categories: SchoolCategory[] = [SchoolCategory.WIRA, SchoolCategory.MADYA];
  const kavlingData = [];

  for (const category of categories) {
    // Kapasitas 50 (Nomor 1-20)
    for (let i = 1; i <= 20; i++) {
      kavlingData.push({ kavlingNumber: i, capacity: 50, category, isBooked: false });
    }
    // Kapasitas 20 (Nomor 21-40)
    for (let i = 21; i <= 40; i++) {
      kavlingData.push({ kavlingNumber: i, capacity: 20, category, isBooked: false });
    }
    // Kapasitas 15 (Nomor 41-60)
    for (let i = 41; i <= 60; i++) {
      kavlingData.push({ kavlingNumber: i, capacity: 15, category, isBooked: false });
    }
  }

  console.log(`Generated ${kavlingData.length} total kavling records to seed.`);

  // Upsert data
  for (const data of kavlingData) {
    await prisma.kavlingBooking.upsert({
      where: { 
        kavlingNumber_capacity_category: { 
          kavlingNumber: data.kavlingNumber, 
          capacity: data.capacity,
          category: data.category
        } 
      },
      update: { isBooked: false },
      create: data,
    });
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });