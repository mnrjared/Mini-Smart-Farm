import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
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

// Mock data for charts
const powerData = [
  { time: "00:00", usage: 45, generation: 0 },
  { time: "04:00", usage: 35, generation: 0 },
  { time: "08:00", usage: 65, generation: 30 },
  { time: "12:00", usage: 75, generation: 85 },
  { time: "16:00", usage: 70, generation: 60 },
  { time: "20:00", usage: 80, generation: 10 },
  { time: "23:59", usage: 55, generation: 0 },
];

const waterData = [
  { time: "00:00", level: 85 },
  { time: "04:00", level: 82 },
  { time: "08:00", level: 78 },
  { time: "12:00", level: 65 },
  { time: "16:00", level: 58 },
  { time: "20:00", level: 55 },
  { time: "23:59", level: 52 },
];

export function Dashboard() {
  // Mock weather data for Bela-Bela, South Africa
  const currentWeather = {
    temperature: 28,
    condition: "Partly Cloudy",
    humidity: 45,
    windSpeed: 12,
    precipitation: 10,
    icon: Sun,
  };

  const forecast = [
    { day: "Tue", high: 29, low: 18, condition: "Sunny", icon: Sun },
    { day: "Wed", high: 27, low: 16, condition: "Cloudy", icon: Cloud },
    { day: "Thu", high: 25, low: 15, condition: "Rain", icon: CloudRain },
    { day: "Fri", high: 28, low: 17, condition: "Sunny", icon: Sun },
  ];

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
          <span>All systems operational • Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Weather Section */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Weather Information - Bela-Bela</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Current Weather */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <currentWeather.icon className="w-5 h-5 text-yellow-500" />
                Current Conditions
              </CardTitle>
              <CardDescription>Live weather data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-slate-900">{currentWeather.temperature}°C</div>
                  <div className="text-sm text-slate-600">Temperature</div>
                </div>
                <div className="text-center">
                  <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-slate-900">{currentWeather.humidity}%</div>
                  <div className="text-sm text-slate-600">Humidity</div>
                </div>
                <div className="text-center">
                  <Wind className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-slate-900">{currentWeather.windSpeed}</div>
                  <div className="text-sm text-slate-600">Wind (km/h)</div>
                </div>
                <div className="text-center">
                  <Cloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-slate-900">{currentWeather.precipitation}%</div>
                  <div className="text-sm text-slate-600">Rain Chance</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>4-Day Forecast</CardTitle>
              <CardDescription>Upcoming weather</CardDescription>
            </CardHeader>
            <CardContent>
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

          {/* Water Status */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-orange-500" />
                Water Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600">Reservoir Level</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Low
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Main reservoir at 52% capacity. Consider water conservation measures. Borehole backup available.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <TrendingDown className="w-4 h-4 text-orange-600" />
                <span className="text-orange-600 font-medium">-3% from yesterday</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power Generation Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Power Generation & Usage (24h)</CardTitle>
            <CardDescription>Solar generation vs. farm consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={powerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="generation" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  name="Solar Generation (kW)"
                  dot={{ fill: '#22c55e' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  name="Usage (kW)"
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Water Level Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Water Reservoir Level (24h)</CardTitle>
            <CardDescription>Main water storage capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={waterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="level" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="Water Level (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">68 kW</div>
              <div className="text-sm text-slate-600">Current Power</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">15,400 L</div>
              <div className="text-sm text-slate-600">Water Available</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">23°C</div>
              <div className="text-sm text-slate-600">Soil Temp</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">98%</div>
              <div className="text-sm text-slate-600">System Health</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LoRa Network Status */}
      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-medium text-slate-900">LoRa Network Status: Active</div>
                <div className="text-sm text-slate-600">4 sensor nodes connected • Signal strength: Excellent</div>
              </div>
            </div>
            <Badge variant="outline" className="self-start bg-green-50 text-green-700 border-green-200 sm:self-auto">
              All Connected
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
