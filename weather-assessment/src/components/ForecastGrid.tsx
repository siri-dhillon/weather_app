export default function ForecastGrid({ forecast }: { forecast: any[] }) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4 text-slate-700">5-Day Forecast</h3>
      {/* Responsive Grid: 1 col on mobile, 5 on large screens */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {forecast.map((day, index) => (
          <div 
            key={index} 
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium text-slate-500">
              {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
            </p>
            {/* Dynamic Weather Icon */}
            <img 
              src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`} 
              alt={day.weather[0].description}
              className="w-16 h-16"
            />
            <p className="text-xl font-bold">{Math.round(day.main.temp)}°C</p>
            <p className="text-xs text-slate-400 capitalize">{day.weather[0].description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}