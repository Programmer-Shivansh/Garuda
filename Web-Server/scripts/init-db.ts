import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.coordinate.deleteMany();
  await prisma.cluster.deleteMany();

  // Create test coordinates
  const coordinates = [
    { latitude: 27.7172, longitude: 85.3240, priority: 'severe' },
    { latitude: 27.7173, longitude: 85.3241, priority: 'intermediate' },
    { latitude: 27.7174, longitude: 85.3242, priority: 'normal' },
    // Add more test coordinates as needed
  ];

  for (const coord of coordinates) {
    await prisma.coordinate.create({ data: coord });
  }

  console.log('Database initialized with test data');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
