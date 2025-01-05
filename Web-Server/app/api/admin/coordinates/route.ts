import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/db';
import type { Coordinate } from '@/app/types/coordinates';

export async function GET() {
  try {
    const coordinates = await prisma.coordinate.findMany({
      orderBy: { createdAt: 'desc' },
      include: { cluster: true }
    });

    return NextResponse.json({ success: true, data: coordinates });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch coordinates' 
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    
    const updated = await prisma.coordinate.update({
      where: { id },
      data
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update coordinate' 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    
    await prisma.coordinate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete coordinate' 
    }, { status: 500 });
  }
}
