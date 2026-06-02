import { useState, useEffect } from "react";
import { fetchWeatherApi } from "openmeteo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import type { LucideIcon } from "lucide-react";
import { 
  Cloud, 
  Droplets, 
  Wind, 
  Thermometer, 
  Zap, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Sun,
  CloudRain
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "../../components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryData {
  currentPowerKw: number;
  waterAvailableL: number;
  systemHealthPct: number;
  onlineDevices: number;
  totalDevices: number;
}

interface PowerChartPoint {
  time: string;
  generation: number;
  usage: number;
}

interface WaterChartPoint {
  time: string;
  level: number;
}

interface WaterStatusData {
  deviceCount: number;
  totalDepthCm: number;
  averageDepthCm: number;
  latestTakenAt: string | null;
}

interface CurrentWeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  icon: LucideIcon;
}

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: string;
  icon: LucideIcon;
}

interface DeviceRow {
  deviceName: string;
  protocol: string;
  status: string;
  lastSeen: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Base URL so you only need to change it in one place
const API = "http://localhost:5000";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const BELA_BELA_COORDS = {
  latitude: -24.885,
  longitude: 28.294,
};
const WEATHER_REFRESH_MS = 15 * 60_000;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

const range = (start: number, stop: number, step: number) =>
  Array.from({ length: (stop - start) / step }, (_, index) => start + index * step);

function getWeatherPresentation(weatherCode: number): { condition: string; icon: LucideIcon } {
  if ([0, 1].includes(weatherCode)) {
    return { condition: weatherCode === 0 ? "Clear" : "Mostly Clear", icon: Sun };
  }

  if ([2, 3, 45, 48].includes(weatherCode)) {
    return { condition: weatherCode === 2 ? "Partly Cloudy" : weatherCode === 3 ? "Overcast" : "Foggy", icon: Cloud };
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return { condition: "Thunderstorm", icon: AlertTriangle };
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86].includes(weatherCode)) {
    return { condition: "Rain", icon: CloudRain };
  }

  return { condition: "Cloudy", icon: Cloud };
}

async function fetchWeather(): Promise<{ currentWeather: CurrentWeatherData; forecast: ForecastDay[] }> {
  const responses = await fetchWeatherApi(WEATHER_API, {
    latitude: BELA_BELA_COORDS.latitude,
    longitude: BELA_BELA_COORDS.longitude,
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: 5,
    timezone: "Africa/Johannesburg",
  });

  const response = responses[0];
  const current = response?.current();
  const daily = response?.daily();

  if (!response || !current || !daily) {
    throw new Error("Weather data unavailable");
  }

  const utcOffsetSeconds = response.utcOffsetSeconds();
  const dailyTimes = range(Number(daily.time()), Number(daily.timeEnd()), daily.interval())
    .map((timestamp) => new Date((timestamp + utcOffsetSeconds) * 1000))
    .slice(1, 5);
  const dailyCodes = Array.from(daily.variables(0)?.valuesArray() ?? []).slice(1, 5);
  const dailyHighs = Array.from(daily.variables(1)?.valuesArray() ?? []).slice(1, 5);
  const dailyLows = Array.from(daily.variables(2)?.valuesArray() ?? []).slice(1, 5);
  const forecastLength = Math.min(dailyTimes.length, dailyCodes.length, dailyHighs.length, dailyLows.length);

  const currentWeatherCode = Number(current.variables(4)?.value() ?? 0);
  const currentPresentation = getWeatherPresentation(currentWeatherCode);

  return {
    currentWeather: {
      temperature: Math.round(Number(current.variables(0)?.value() ?? 0)),
      condition: currentPresentation.condition,
      humidity: Math.round(Number(current.variables(1)?.value() ?? 0)),
      windSpeed: Math.round(Number(current.variables(2)?.value() ?? 0)),
      precipitation: Math.round(Number(current.variables(3)?.value() ?? 0)),
      icon: currentPresentation.icon,
    },
    forecast: Array.from({ length: forecastLength }, (_, index) => {
      const weatherCode = Number(dailyCodes[index] ?? 0);
      const presentation = getWeatherPresentation(weatherCode);

      return {
        day: dailyTimes[index].toLocaleDateString("en-ZA", { weekday: "short" }),
        high: Math.round(Number(dailyHighs[index] ?? 0)),
        low: Math.round(Number(dailyLows[index] ?? 0)),
        condition: presentation.condition,
        icon: presentation.icon,
      };
    }),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Dashboard() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [powerData, setPowerData] = useState<PowerChartPoint[]>([]);
  const [waterData, setWaterData] = useState<WaterChartPoint[]>([]);
  const [waterStatus, setWaterStatus] = useState<WaterStatusData | null>(null);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // ── Fetch on mount (and refresh every 60 s) ────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [sum, power, water, waterStatusData, devs] = await Promise.all([
          fetchJson<SummaryData>("/api/dashboard/summary"),
          fetchJson<PowerChartPoint[]>("/api/dashboard/power-chart"),
          fetchJson<WaterChartPoint[]>("/api/dashboard/water-chart"),
          fetchJson<WaterStatusData>("/api/dashboard/water-status"),
          fetchJson<DeviceRow[]>("/api/dashboard/devices"),
        ]);

        if (!cancelled) {
          setSummary(sum);
          setPowerData(power);
          setWaterData(water);
          setWaterStatus(waterStatusData);
          setDevices(devs);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60_000); // auto-refresh every 60 s
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        const weather = await fetchWeather();

        if (!cancelled) {
          setCurrentWeather(weather.currentWeather);
          setForecast(weather.forecast);
          setWeatherError(null);
        }
      } catch (e: any) {
        if (!cancelled) setWeatherError(e.message ?? "Failed to load weather data");
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    }

    loadWeather();
    const interval = setInterval(loadWeather, WEATHER_REFRESH_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────
  const onlineCount   = devices.filter(d => d.status === "online").length;
  const totalLoRa     = devices.length;

  // Latest water level for the alert badge
  const latestWaterLevel = waterStatus && waterStatus.deviceCount > 0
    ? waterStatus.averageDepthCm
    : waterData.length > 0
      ? waterData[waterData.length - 1].level
      : null;

  const latestWaterStatusAt = waterStatus?.latestTakenAt
    ? new Date(waterStatus.latestTakenAt).toLocaleString()
    : null;

  // Water status label
  const waterBadge = latestWaterLevel === null
    ? { label: "No data", cls: "bg-slate-50 text-slate-600 border-slate-200" }
    : latestWaterLevel < 40
      ? { label: "Low",    cls: "bg-orange-50 text-orange-700 border-orange-200" }
      : latestWaterLevel < 70
        ? { label: "Medium", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" }
        : { label: "Good",   cls: "bg-green-50 text-green-700 border-green-200" };

  const CurrentWeatherIcon = currentWeather?.icon ?? Cloud;
  const currentWeatherDescription = currentWeather?.condition
    ?? (weatherLoading ? "Loading weather data" : weatherError ? "Unable to load weather data" : "Live weather data");
  const forecastDescription = weatherLoading && forecast.length === 0
    ? "Loading forecast"
    : weatherError && forecast.length === 0
      ? "Unable to load forecast data"
      : "Upcoming weather";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Welcome to Bela-Bela Smart Farm</h2>
        <p className="text-green-50">
          Real-time monitoring and control system for sustainable agriculture
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <Activity className="w-4 h-4" />
          <span>
            {loading
              ? "Loading data…"
              : error
                ? `⚠ ${error}`
                : `All systems operational • Last updated: ${new Date().toLocaleTimeString()}`}
          </span>
        </div>
      </div>

      {/* Weather Section */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Weather Information - Bela-Bela</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrentWeatherIcon className="w-5 h-5 text-yellow-500" />
                Current Conditions
              </CardTitle>
              <CardDescription>{currentWeatherDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-slate-900">{currentWeather ? `${currentWeather.temperature}°C` : "—"}</div>
                  <div className="text-sm text-slate-600">Temperature</div>
                </div>
                <div className="text-center">
                  <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-slate-900">{currentWeather ? `${currentWeather.humidity}%` : "—"}</div>
                  <div className="text-sm text-slate-600">Humidity</div>
                </div>
                <div className="text-center">
                  <Wind className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-slate-900">{currentWeather ? currentWeather.windSpeed : "—"}</div>
                  <div className="text-sm text-slate-600">Wind (km/h)</div>
                </div>
                <div className="text-center">
                  <Cloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-slate-900">{currentWeather ? `${currentWeather.precipitation}%` : "—"}</div>
                  <div className="text-sm text-slate-600">Rain Chance</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4-Day Forecast</CardTitle>
              <CardDescription>{forecastDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {weatherLoading && forecast.length === 0 ? (
                <div className="text-sm text-slate-500">Loading forecast…</div>
              ) : forecast.length === 0 ? (
                <div className="text-sm text-slate-500">
                  {weatherError ? "Unable to load forecast data." : "No forecast data available."}
                </div>
              ) : (
                <div className="space-y-3">
                  {forecast.map((day) => {
                    const Icon = day.icon;
                    return (
                      <div key={day.day} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-slate-600" />
                          <span className="font-medium text-slate-900">{day.day}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-bold text-slate-900">{day.high}°</span>
                          <span className="text-slate-500 ml-1">{day.low}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts Section */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">System Alerts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Power Status */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Power Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600">Load Shedding Risk</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Moderate
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Stage 2 load shedding possible between 16:00 - 22:00. Solar generation compensating 65% of demand.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">Solar panels performing optimally</span>
              </div>
            </CardContent>
          </Card>

          {/* Water Status — uses live data */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-orange-500" />
                Water Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600">Water Remaining</span>
                <Badge variant="outline" className={waterBadge.cls}>
                  {waterBadge.label}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                {waterStatus && waterStatus.deviceCount > 0
                  ? `Latest total across ${waterStatus.deviceCount} water ${waterStatus.deviceCount === 1 ? "node" : "nodes"}: ${waterStatus.totalDepthCm.toFixed(1)} cm depth${latestWaterStatusAt ? `. Last update: ${latestWaterStatusAt}.` : "."}`
                  : "No water sensor readings yet."}
              </p>
              {latestWaterLevel !== null && latestWaterLevel < 70 && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-600 font-medium">Consider water conservation measures</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Visualisation — live charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Power Generation & Usage (24h)</CardTitle>
            <CardDescription>Solar generation vs. farm consumption</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center text-slate-400">Loading…</div>
            ) : error && powerData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-slate-400">Unable to load power data</div>
            ) : powerData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-slate-400">No power data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={powerData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="generation"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Solar Generation (kW)"
                    dot={{ fill: "#22c55e" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="usage"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Usage (kW)"
                    dot={{ fill: "#3b82f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Water Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Water Sensor Depth (24h)</CardTitle>
            <CardDescription>Average depth reading across the latest 24 hours of available water sensor data</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center text-slate-400">Loading…</div>
            ) : error && waterData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-slate-400">Unable to load water data</div>
            ) : waterData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-slate-400">No water data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={waterData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="level"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Depth (cm)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats — live data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">
                {loading ? "—" : `${summary?.currentPowerKw.toFixed(1) ?? "—"} kW`}
              </div>
              <div className="text-sm text-slate-600">Current Power</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">
                {loading
                  ? "—"
                  : summary
                    ? `${summary.waterAvailableL.toLocaleString()} L`
                    : "—"}
              </div>
              <div className="text-sm text-slate-600">Water Capacity</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
              {/* Soil temperature would need a crop sensor reading — showing weather temp for now */}
              <div className="text-2xl font-bold text-slate-900">23°C</div>
              <div className="text-sm text-slate-600">Soil Temp</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">
                {loading ? "—" : `${summary?.systemHealthPct ?? "—"}%`}
              </div>
              <div className="text-sm text-slate-600">System Health</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LoRa Network Status — live */}
      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 sm:items-center">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                loading ? "bg-slate-400" : onlineCount === totalLoRa ? "bg-green-500" : "bg-yellow-500"
              }`} />
              <div>
                <div className="font-medium text-slate-900">
                  LoRa Network Status: {loading ? "Checking…" : onlineCount === totalLoRa ? "Active" : "Degraded"}
                </div>
                <div className="text-sm text-slate-600">
                  {loading
                    ? "Fetching device info…"
                    : `${onlineCount} of ${totalLoRa} sensor nodes connected`}
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`self-start sm:self-auto ${
                loading
                  ? "bg-slate-50 text-slate-600 border-slate-200"
                  : onlineCount === totalLoRa
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
              }`}
            >
              {loading ? "Checking" : onlineCount === totalLoRa ? "All Connected" : `${onlineCount}/${totalLoRa} Online`}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
