'use client';

import { useState, useEffect } from 'react';
import { 
  Cloud, MapPin, Download, Trash2, Search, 
  AlertCircle, Thermometer, Wind, Droplets, Calendar 
} from 'lucide-react';

export default function WeatherApp() {
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [todayWeather, setTodayWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to fix the Day Behind bug
  const formatLocalDate = (dateStr: string, options: Intl.DateTimeFormatOptions = {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', options);
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/weather');
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load history");
    }
  };

  useEffect(() => { 
    fetchHistory(); 
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    const fiveDaysLater = new Date();
    fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
    setEndDate(fiveDaysLater.toISOString().split('T')[0]);
  }, []);

  // Handler for Start Date Change (Auto-sets End Date +5 Days)
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = e.target.value;
    setStartDate(start);
    if (start) {
      const date = new Date(start);
      date.setDate(date.getDate() + 5);
      setEndDate(date.toISOString().split('T')[0]);
    }
  };

  // POST Handler for Weather Search
  const handleSearch = async (locToSearch?: string) => {
    const searchTarget = locToSearch || location;
    if (!searchTarget) { setError("Please enter a location."); return; }
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: searchTarget, startDate, endDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      
      setTodayWeather(data.today);
      setForecast(data.forecast || []);
      fetchHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // GET Current Location Handler
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
        setLocation(coords);
        handleSearch(coords);
      },
      () => {
        setLoading(false);
        setError("Location access denied.");
      }
    );
  };

  // DELETE Handler for History Records
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this record?")) return;
    try {
      const res = await fetch(`/api/weather?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchHistory();
    } catch (err) {
      console.error("Delete failed");
    }
  };

  // EXPORT: CSV/JSON Data Export
  const exportData = (format: 'json' | 'csv') => {
    if (history.length === 0) {
      alert("No history to export.");
      return;
    }

    let content = '';
    const type = format === 'json' ? 'application/json' : 'text/csv';
    
    if (format === 'json') {
      content = JSON.stringify(history, null, 2);
    } else {
      // CSV Headers matching your schema
      const headers = "Location,CurrentTemp,Description,RangeStart,RangeEnd,Day1,Day2,Day3,Day4,Day5,DateSearched\n";
      const rows = history.map((r: any) => {
        return `${r.location},${Math.round(r.temp)},"${r.description}",${r.startDate},${r.endDate},${Math.round(r.tempDay1)},${Math.round(r.tempDay2)},${Math.round(r.tempDay3)},${Math.round(r.tempDay4)},${Math.round(r.tempDay5)},${r.createdAt}`;
      }).join("\n");
      content = headers + rows;
    }

    // Create and trigger download
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather_history_export_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-600"><Cloud size={32} /> Weather App | Full Stack Tech Assessment</h1>
            <p className="text-sm text-slate-500 mt-1">AI Engineer Intern Assessment | Sirpreet Kaur Dhillon</p>
            <div className="mt-4 md:mt-0 text-[10px] text-slate-400 leading-relaxed italic">
              The Product Manager Accelerator (PM Accelerator) is an intensive program designed to help professionals transition into high-impact roles in Product Management and AI. It focuses on hands-on technical skill-building, AI-driven product strategy, and career optimization to empower the next generation of AI product leaders.
            </div>
          </div>
          
        </header>

        {/* Search & Inputs */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="City name or Zip code..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button onClick={handleGetCurrentLocation} className="p-3 border rounded-xl hover:bg-slate-50 text-slate-600 transition">
              <MapPin size={20} />
            </button>
            <button 
              onClick={() => handleSearch()}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition"
            >
              {loading ? 'Searching...' : 'Get Weather'}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={12}/> Start Date</label>
              <input type="date" className="w-full p-2 border rounded-xl text-sm" value={startDate} onChange={handleStartDateChange} />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={12}/> End Date (Locked +5 Days)</label>
              <input type="date" className="w-full p-2 border rounded-xl text-sm bg-slate-50 text-slate-500" value={endDate} readOnly />
            </div>
          </div>
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs"><AlertCircle size={14} />{error}</div>}
        </section>

        {/* Today's Live Weather Tile */}
        {todayWeather && (
          <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-blue-100 font-semibold text-lg"><MapPin size={20} /> {todayWeather.name}</div>
                <p className="text-sm text-blue-200 font-medium flex items-center gap-2">
                  <Calendar size={14} /> Today, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
              </div>
              <h2 className="text-8xl font-black tracking-tighter">{Math.round(todayWeather.temp)}°C</h2>
              <div className="flex gap-6 text-sm">
                <span className="flex items-center gap-2 font-medium"><Wind size={18} className="text-blue-300"/> {todayWeather.wind} m/s</span>
                <span className="flex items-center gap-2 font-medium"><Droplets size={18} className="text-blue-300"/> {todayWeather.humidity}%</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <img src={`https://openweathermap.org/img/wn/${todayWeather.icon}@4x.png`} className="w-48 h-48 drop-shadow-2xl" alt="Weather Icon" />
              <p className="capitalize font-bold text-blue-100 text-lg">{todayWeather.description}</p>
            </div>
          </section>
        )}

        {/* 5-Day Forecast Row */}
        {forecast.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Travel Window Outlook</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {forecast.map((day, idx) => {
                const [year, month, dayNum] = startDate.split('-').map(Number);
                const baseDate = new Date(year, month - 1, dayNum);
                baseDate.setDate(baseDate.getDate() + idx);
                return (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                    <span className="text-[10px] font-bold text-blue-600 uppercase mb-1">{baseDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="text-[9px] text-slate-400 mb-2">{baseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <img src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} className="w-12 h-12" alt="Icon" />
                    <span className="text-2xl font-bold text-slate-800">{Math.round(day.temp)}°</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Detailed History Cards */}
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center font-bold text-slate-700">
            <h3 className="flex items-center gap-2 tracking-tight"><Thermometer size={18} className="text-blue-500" /> Search History (One Call 3.0)</h3>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button 
                onClick={() => exportData('csv')} 
                className="text-[10px] font-bold border px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 transition flex items-center gap-1 shadow-sm"
              >
                <Download size={12}/> CSV
              </button>
              <button 
                onClick={() => exportData('json')} 
                className="text-[10px] font-bold border px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 transition flex items-center gap-1 shadow-sm"
              >
                <Download size={12}/> JSON
              </button>
            </div>

          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {history.length === 0 ? (
              <p className="p-10 text-center text-slate-400 italic text-sm">No records found.</p>
            ) : (
              history.map((row: any) => (
                <div key={row.id} className="p-5 hover:bg-slate-50 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 flex items-center gap-1">{row.location}</p>
                      <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-tighter">
                        Range: {formatLocalDate(row.startDate.split('T')[0], { month: 'short', day: 'numeric', year: 'numeric' })} — {formatLocalDate(row.endDate.split('T')[0], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-black text-slate-800">{Math.round(row.temp)}°C</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Saved {new Date(row.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => handleDelete(row.id)} className="text-slate-200 hover:text-red-500 transition-colors p-2"><Trash2 size={18}/></button>
                    </div>
                  </div>
                  {/* Forecast Snapshots in History */}
                  <div className="flex gap-1 mt-4">
                    {[row.tempDay1, row.tempDay2, row.tempDay3, row.tempDay4, row.tempDay5].map((t, i) => (
                      <div key={i} className="flex-1 bg-slate-100/50 p-2 rounded-lg text-center border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Day {i+1}</p>
                        <p className="text-[11px] font-black text-slate-600">{Math.round(t)}°</p>
                      </div>
                    ))}
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