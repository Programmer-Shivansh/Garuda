import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Define the bounds for Nepal
const NEPAL_BOUNDS = {
  minLat: 26.3478,
  maxLat: 30.4477,
  minLng: 80.0884,
  maxLng: 88.1748
};

// Define major cities in Nepal for more realistic data
const NEPAL_CITIES = [
  { name: 'Kathmandu', lat: 27.7172, lng: 85.3240 },
  { name: 'Pokhara', lat: 28.2096, lng: 83.9856 },
  { name: 'Lalitpur', lat: 27.6588, lng: 85.3247 },
  { name: 'Bharatpur', lat: 27.6833, lng: 84.4333 },
  { name: 'Birgunj', lat: 27.0167, lng: 84.8833 },
  { name: 'Biratnagar', lat: 26.4833, lng: 87.2833 },
  { name: 'Butwal', lat: 27.7000, lng: 83.4500 }
];

function generateRandomLocation(cityCenter: typeof NEPAL_CITIES[0], radiusKm: number) {
  // Convert radius from kilometers to degrees (approximate)
  const radiusLat = radiusKm / 111.32;
  const radiusLng = radiusKm / (111.32 * Math.cos(cityCenter.lat * Math.PI / 180));

  const lat = cityCenter.lat + (Math.random() - 0.5) * 2 * radiusLat;
  const lng = cityCenter.lng + (Math.random() - 0.5) * 2 * radiusLng;

  return {
    latitude: Math.max(NEPAL_BOUNDS.minLat, Math.min(NEPAL_BOUNDS.maxLat, lat)),
    longitude: Math.max(NEPAL_BOUNDS.minLng, Math.min(NEPAL_BOUNDS.maxLng, lng))
  };
}

function getRandomPriority(): 'severe' | 'intermediate' | 'normal' {
  const rand = Math.random();
  if (rand < 0.2) return 'severe';
  if (rand < 0.5) return 'intermediate';
  return 'normal';
}

async function seed() {
  // Clear existing data
  await prisma.coordinate.deleteMany();
  await prisma.cluster.deleteMany();

  // Generate coordinates for each city
  const coordinates: Prisma.CoordinateCreateInput[] = [];

  NEPAL_CITIES.forEach(city => {
    // Generate 5-15 coordinates per city
    const numCoordinates = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < numCoordinates; i++) {
      const location = generateRandomLocation(city, 5); // 5km radius
      coordinates.push({
        latitude: location.latitude,
        longitude: location.longitude,
        priority: getRandomPriority(),
        createdAt: faker.date.recent({ days: 7 })
      });
    }
  });

  // Add some random coordinates throughout Nepal
  for (let i = 0; i < 20; i++) {
    const randomCity = NEPAL_CITIES[Math.floor(Math.random() * NEPAL_CITIES.length)];
    const location = generateRandomLocation(randomCity, 20); // 20km radius for wider spread
    coordinates.push({
      latitude: location.latitude,
      longitude: location.longitude,
      priority: getRandomPriority(),
      createdAt: faker.date.recent({ days: 7 })
    });
  }

  // Create all coordinates
  for (const coord of coordinates) {
    await prisma.coordinate.create({
      data: coord
    });
  }

  console.log(`Database has been seeded with ${coordinates.length} coordinates`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
