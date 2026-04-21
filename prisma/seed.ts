import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

async function main() {
  const avatars = [
    { name: 'Astronauta', imageUrl: '/avatars/astronauta.png' },
    { name: 'Gato', imageUrl: '/avatars/gato.png' },
    { name: 'Robot', imageUrl: '/avatars/robot.png' },
  ];

  for (const avatar of avatars) {
    await prisma.avatar.upsert({
      where: { id: randomUUID() },
      update: {},
      create: {
        id: randomUUID(),
        name: avatar.name,
        imageUrl: avatar.imageUrl,
      },
    });
  }

  console.log('Avatars seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });