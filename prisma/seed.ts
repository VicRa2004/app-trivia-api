import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaClient } from '../src/generated/prisma/client';
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
    const existing = await prisma.avatar.findFirst({
      where: { name: avatar.name },
    });
    if (!existing) {
      await prisma.avatar.create({
        data: {
          name: avatar.name,
          imageUrl: avatar.imageUrl,
        },
      });
    }
  }
  console.log('Avatars seeded successfully');

  const categories = [
    { name: 'Ciencia', iconUrl: 'science' },
    { name: 'Historia', iconUrl: 'history' },
    { name: 'Arte y Literatura', iconUrl: 'art' },
    { name: 'Geografía', iconUrl: 'geography' },
    { name: 'Deportes', iconUrl: 'sports' },
    { name: 'Entretenimiento', iconUrl: 'entertainment' },
    { name: 'Tecnología', iconUrl: 'technology' },
    { name: 'Cultura General', iconUrl: 'general' },
  ];

  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: { name: category.name },
    });
    if (!existing) {
      await prisma.category.create({
        data: {
          name: category.name,
          iconUrl: category.iconUrl,
        },
      });
    }
  }
  console.log('Categories seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });