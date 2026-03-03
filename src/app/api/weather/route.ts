import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = process.env.OPENWEATHER_API_KEY;

export async function POST(req: Request) {
  try {
    const { location, startDate, endDate } = await req.json();

    // 1. Determine the correct URLs based on input type (City vs GPS)
    let weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${API_KEY}`;
    let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=metric&appid=${API_KEY}`;

    if (location.includes(',')) {
      const [lat, lon] = location.split(',');
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat.trim()}&lon=${lon.trim()}&units=metric&appid=${API_KEY}`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat.trim()}&lon=${lon.trim()}&units=metric&appid=${API_KEY}`;
    }

    // 2. Fetch Current Weather
    const currentRes = await fetch(weatherUrl);
    const currentData = await currentRes.json();

    if (currentData.cod !== 200) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 }); //
    }

    // 3. Fetch 5-Day Forecast
    const forecastRes = await fetch(forecastUrl);
    const forecastData = await forecastRes.json();
    
    // Filter to get one record per day (every 8th interval)
    const dailyForecast = forecastData.list ? 
      forecastData.list.filter((_: any, index: number) => index % 8 === 0) : [];

    // 4. Save to DB (CRUD: Create)
    const record = await prisma.weatherQuery.create({
      data: {
        location: currentData.name, // returned by API
        temp: currentData.main.temp,
        description: currentData.weather[0].description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      }
    });

    return NextResponse.json({ 
      current: currentData, 
      forecast: dailyForecast, 
      record 
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 }); //
  }
}

export async function GET() {
  try {
    const history = await prisma.weatherQuery.findMany({
      orderBy: { createdAt: 'desc' }, // Show newest first
      take: 20 // Limit to 20 for performance
    });
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

// DELETE: Remove a record by ID
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.weatherQuery.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}