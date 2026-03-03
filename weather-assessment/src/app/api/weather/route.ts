import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = 'YOUR_OPENWEATHER_API_KEY';

export async function POST(req: Request) {
  const { location, startDate, endDate } = await req.json();

  // 1. Validate Location & Fetch Data
  const weatherRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${API_KEY}`
  );
  const data = await weatherRes.json();

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

  return NextResponse.json({ record, weather: data });
}

export async function GET() {
  // CRUD: Read
  const history = await prisma.weatherQuery.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(history);
}