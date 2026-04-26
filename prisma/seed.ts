import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

async function main() {
  const avatars = [
    { name: 'Avatar 1', imageUrl: '/avatar/avatar-01.jpg' },
    { name: 'Avatar 2', imageUrl: '/avatar/avatar-02.jpg' },
    { name: 'Avatar 3', imageUrl: '/avatar/avatar-03.jpg' },
    { name: 'Avatar 4', imageUrl: '/avatar/avatar-04.jpg' },
    { name: 'Avatar 5', imageUrl: '/avatar/avatar-05.jpg' },
    { name: 'Avatar 6', imageUrl: '/avatar/avatar-06.jpg' },
    { name: 'Avatar 7', imageUrl: '/avatar/avatar-07.jpg' },
    { name: 'Avatar 8', imageUrl: '/avatar/avatar-08.jpg' },
    { name: 'Avatar 9', imageUrl: '/avatar/avatar-09.jpg' },
    { name: 'Avatar 10', imageUrl: '/avatar/avatar-10.jpg' },
    { name: 'Avatar 11', imageUrl: '/avatar/avatar-11.jpg' },
    { name: 'Avatar 12', imageUrl: '/avatar/avatar-12.jpg' },
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