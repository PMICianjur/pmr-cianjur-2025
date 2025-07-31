// prisma/seed-admin.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log("Start seeding admin accounts...");

    const passwordSuperAdmin = await bcrypt.hash('Sehab01', 10);
    const passwordSuperAdmin1 = await bcrypt.hash('01Fami', 10); // Ganti dengan password yang kuat
    const passwordOperator = await bcrypt.hash('operator123', 10); // Ganti dengan password yang kuat

    // Buat akun Superadmin
    await prisma.admin.upsert({
        where: { username: 'Sehabudin' },
        update: {},
        create: {
            username: 'Sehabudin', 
            password: passwordSuperAdmin,
            name: 'Sehabudin',
            role: 'KESEKRETARIATAN1',
        },
    });

        await prisma.admin.upsert({
        where: { username: 'Fahmi' },
        update: {},
        create: {
            username: 'Fahmi', 
            password: passwordSuperAdmin1,
            name: 'Sehabudin',
            role: 'KESEKRETARIATAN1',
        },
    });

    // Buat akun Operator
    await prisma.admin.upsert({
        where: { username: 'operator' },
        update: {},
        create: {
            username: 'operator',
            password: passwordOperator,
            name: 'Operator Lapangan',
            role: 'OPERATOR',
        },
    });

    console.log("Admin accounts seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });