import { NextResponse } from 'next/server';
import type { CoordinatesPayload } from '@/app/types/coordinates';

// Mock data with more test points spread around Delhi NCR
const mockData: CoordinatesPayload = {
  coordinates: [
    { latitude: 28.6139, longitude: 77.2090, priority: 'severe' },     // New Delhi
    { latitude: 28.4595, longitude: 77.0266, priority: 'normal' },     // Gurgaon
    { latitude: 28.5355, longitude: 77.3910, priority: 'intermediate' },// Noida
    { latitude: 28.6692, longitude: 77.4538, priority: 'severe' },     // Ghaziabad
    { latitude: 28.4089, longitude: 77.3178, priority: 'normal' },     // Faridabad
    { latitude: 28.7041, longitude: 77.1025, priority: 'intermediate' },// Delhi University
    { latitude: 28.5503, longitude: 77.2699, priority: 'severe' },     // South Delhi
    { latitude: 28.6304, longitude: 77.2177, priority: 'normal' }      // Central Delhi
  ]
};

export async function GET() {
  try {
    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        data: mockData.coordinates 
      }), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
      }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch coordinates' 
      }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body || !body.coordinates || !Array.isArray(body.coordinates)) {
      throw new Error('Invalid payload format');
    }

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        data: body.coordinates 
      }), 
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
      }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Invalid payload' 
      }), 
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
      }
    );
  }
}
