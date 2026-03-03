import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = process.env.OPENWEATHER_API_KEY;

export async function POST(req: Request) {
  const { location, startDate, endDate } = await req.json();

  // 1. Validate Location & Fetch Data
  const weatherRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${API_KEY}`
  );
  const data = await weatherRes.json();

  // Fetch Current Weather
  const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${API_KEY}`);
  const currentData = await currentRes.json();

  // Fetch 5-Day Forecast
  const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=metric&appid=${API_KEY}`);
  const forecastData = await forecastRes.json();

  // Filter to get one record per day (every 24 hours / 8 intervals)
  const dailyForecast = forecastData.list.filter((_: any, index: number) => index % 8 === 0);



  if (data.cod !== 200) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  // 2. Save to DB (CRUD: Create)
  const record = await prisma.weatherQuery.create({
    data: {
      location: data.name,
      temp: data.main.temp,
      description: data.weather[0].description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    }
  });

  return NextResponse.json({ current: currentData, forecast: dailyForecast });
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