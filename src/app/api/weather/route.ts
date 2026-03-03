import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = process.env.OPENWEATHER_API_KEY;

export async function POST(req: Request) {
  try {
    const { location, startDate, endDate } = await req.json();
    const start = new Date(startDate);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    // 1. SMART RESOLVER: Handle Coordinates vs City Names
    let lat: string, lon: string, name: string;

    if (location.includes(',')) {
      // Input is GPS coordinates (e.g., "49.28, -122.84")
      const [la, lo] = location.split(',');
      lat = la.trim();
      lon = lo.trim();

      try {
        // Perform Reverse Geocoding to get the real city name
        const reverseGeoRes = await fetch(
          `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
        );
        const reverseGeoData = await reverseGeoRes.json();

        if (reverseGeoData && reverseGeoData.length > 0) {
          name = reverseGeoData[0].name; // Successfully found the city name
        } else {
          name = `Location (${lat.slice(0, 5)}, ${lon.slice(0, 5)})`; // Fallback if no city found
        }
      } catch (err) {
        name = "Current Location"; // Fallback on network error
      }
    } else {
      // Input is a city name (e.g., "Coquitlam")
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`
      );
      const geoData = await geoRes.json();

      if (!geoData || geoData.length === 0) {
        return NextResponse.json({ error: "Location not found" }, { status: 404 });
      }

      lat = geoData[0].lat.toString();
      lon = geoData[0].lon.toString();
      name = geoData[0].name;
    }

    // 2. ALWAYS fetch Live/Today's data for the Large Blue Tile
    const liveRes = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,hourly,daily&appid=${API_KEY}`
    );
    const liveData = await liveRes.json();

    let forecastArray = [];

    // 3. Conditional Forecast Logic (Parallel Historical vs Standard Future)
    if (start < todayMidnight) {
      const dayRequests = [0, 1, 2, 3, 4].map((offset) => {
        const targetDate = new Date(start);
        targetDate.setDate(targetDate.getDate() + offset);
        const unixTime = Math.floor(targetDate.getTime() / 1000);
        return fetch(
          `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${unixTime}&units=metric&appid=${API_KEY}`
        ).then((res) => res.json());
      });

      const results = await Promise.all(dayRequests);
      forecastArray = results.map((res) => ({
        temp: res.data[0].temp,
        icon: res.data[0].weather[0].icon,
        description: res.data[0].weather[0].description,
      }));
    } else {
      const futureRes = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,hourly&appid=${API_KEY}`
      );
      const futureData = await futureRes.json();
      forecastArray = futureData.daily.slice(0, 5).map((d: any) => ({
        temp: d.temp.day,
        icon: d.weather[0].icon,
        description: d.weather[0].description,
      }));
    }

    // 4. CRUD: Save to SQLite
    const record = await prisma.weatherQuery.create({
      data: {
        location: name,
        temp: liveData.current.temp,
        description: liveData.current.weather[0].description,
        startDate: start,
        endDate: new Date(endDate),
        tempDay1: forecastArray[0]?.temp || 0,
        tempDay2: forecastArray[1]?.temp || 0,
        tempDay3: forecastArray[2]?.temp || 0,
        tempDay4: forecastArray[3]?.temp || 0,
        tempDay5: forecastArray[4]?.temp || 0,
      },
    });

    return NextResponse.json({
      today: {
        name,
        temp: liveData.current.temp,
        humidity: liveData.current.humidity,
        wind: liveData.current.wind_speed,
        icon: liveData.current.weather[0].icon,
        description: liveData.current.weather[0].description,
      },
      forecast: forecastArray,
      record,
    });
  } catch (error) {
    console.error("Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const history = await prisma.weatherQuery.findMany({ 
      orderBy: { createdAt: 'desc' }, 
      take: 15 
    });
    return NextResponse.json(history);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) await prisma.weatherQuery.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}