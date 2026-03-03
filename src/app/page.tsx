'use client';

import { useState, useEffect } from 'react';
import { Cloud, MapPin, Download, Trash2, Search, AlertCircle, Thermometer, Wind, Droplets } from 'lucide-react';

export default function WeatherApp() {
  const [location, setLocation] = useState('');
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/weather');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history");
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!location) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          location, 
          startDate: new Date(), 
          endDate: new Date() 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Location not found");

      setCurrentWeather(data.weather);
      setForecast(data.forecast || []);
      setLocation('');
      fetchHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format: 'json' | 'csv') => {
    let content = '';
    let type = '';
    
    if (format === 'json') {
      content = JSON.stringify(history, null, 2);
      type = 'application/json';
    } else {
      const headers = "Location,Temp,Description,Date\n";
      const rows = history.map((r: any) => 
        `${r.location},${r.temp},${r.description},${new Date(r.createdAt).toLocaleDateString()}`
      ).join("\n");
      content = headers + rows;
      type = 'text/csv';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weather_export_${new Date().getTime()}.${format}`;
    link.click();
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header - Assessment Requirement 1.0 */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-600">
              <Cloud size={32} /> Weather App POC
            </h1>
            <p className="text-sm text-slate-500 mt-1">AI Engineer Intern Technical Assessment | Sirpreet Kaur Dhillon</p>
          </div>
          <div className="mt-4 md:mt-0 text-xs text-slate-400 max-w-xs">
            Product Manager Accelerator: Empowering professionals to master AI-driven product development.
          </div>
        </header>

        {/* Input & Error Handling - */}
        <section className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                placeholder="City, Zip Code, or Landmark..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button 
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition shadow-lg shadow-blue-100"
            >
              {loading ? 'Searching...' : 'Get Weather'}
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
        </section>

        {/* Main Weather Card - Displays Location Name & Basic Details */}
        {currentWeather && (
          <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 rounded-3xl shadow-xl">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-100">
                  <MapPin size={20} />
                  <span className="text-xl font-semibold">{currentWeather.name}, {currentWeather.sys?.country}</span>
                </div>
                <h2 className="text-8xl font-black">{Math.round(currentWeather.main.temp)}°C</h2>
                <p className="text-2xl capitalize text-blue-100 font-medium">{currentWeather.weather[0].description}</p>
                
                {/* Basic Details: Wind & Humidity */}
                <div className="flex gap-6 mt-6 pt-6 border-t border-blue-400/30">
                  <div className="flex items-center gap-2">
                    <Wind size={20} className="text-blue-200" />
                    <span>{currentWeather.wind.speed} m/s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets size={20} className="text-blue-200" />
                    <span>{currentWeather.main.humidity}% Humidity</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img 
                  src={`https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@4x.png`} 
                  alt="Weather Condition"
                  className="w-48 h-48 drop-shadow-lg"
                />
              </div>
            </div>
          </section>
        )}

        {/* 5-Day Forecast with Dates - */}
        {forecast.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-slate-700 mb-4 px-2">5-Day Forecast</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {forecast.map((day, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-[10px] text-slate-400 mb-2">
                    {new Date(day.dt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`} alt="Icon" className="w-14 h-14" />
                  <span className="text-2xl font-bold text-slate-800">{Math.round(day.main.temp)}°C</span>
                  <span className="text-[10px] text-slate-500 capitalize">{day.weather[0].description}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Persistence Section - Assessment 2.1 & 2.3 */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Thermometer size={18} /> Search History (SQLite)
            </h3>
            <div className="flex gap-2">
              <button onClick={() => exportData('csv')} className="text-xs font-semibold flex items-center gap-1 bg-white border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
                <Download size={14} /> CSV
              </button>
              <button onClick={() => exportData('json')} className="text-xs font-semibold flex items-center gap-1 bg-white border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
                <Download size={14} /> JSON
              </button>
            </div>
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {history.length === 0 ? (
              <p className="p-8 text-center text-slate-400 italic">No search history found.</p>
            ) : (
              history.map((row: any) => (
                <div key={row.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                  <div>
                    <p className="font-semibold text-slate-800">{row.location}</p>
                    <p className="text-[10px] text-slate-400">{new Date(row.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">{row.temp}°C</span>
                    <button title="Delete Record" className="text-slate-300 hover:text-red-500 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}