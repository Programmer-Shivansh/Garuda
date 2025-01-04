import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Coordinate } from '@/app/types/coordinates';
import { detectClusters } from '@/app/utils/clusterDetector';
import { PriorityLevel } from '@/app/types/coordinates';

export async function GET() {
  try {
    const coordinates = await prisma.coordinate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Ensure proper data formatting
    const mappedCoordinates = coordinates.map(coord => ({
      id: coord.id,
      latitude: parseFloat(coord.latitude.toString()),
      longitude: parseFloat(coord.longitude.toString()),
      priority: coord.priority,
      createdAt: coord.createdAt
    }));

    console.log('Sending coordinates:', mappedCoordinates); // Debug log
    
    return NextResponse.json({ 
      success: true, 
      data: mappedCoordinates 
    });
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch coordinates' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body?.coordinates?.length) {
      throw new Error('Invalid payload format');
    }

  await prisma.coordinate.createMany({
      data: body.coordinates.map((coord: Coordinate) => ({
        latitude: coord.latitude,
        longitude: coord.longitude,
        priority: coord.priority
      }))
    });

    const allCoordinates = await prisma.coordinate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      success: true, 
      data: allCoordinates
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid payload' 
    }, { status: 400 });
  }
}
