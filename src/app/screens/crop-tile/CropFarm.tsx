import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Wheat, Droplets, Thermometer, TrendingUp, Sprout, AlertTriangle, FlaskConical, Scale } from "lucide-react";
import {
    LineChart, Line,
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from "recharts";
import { Badge } from "../../components/ui/badge";
import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Planting {
    cropPlantingId:      number;
    cropName:            string;
    variety:             string;
    fieldName:           string;
    zoneName:            string;
    cropStatus:          string;
    plantedDate:         string;
    expectedHarvestDate: string | null;
    daysToHarvest:       number;
    growthDurationDays:  number | null;
}

interface SensorSummary {
    zoneName:    string;
    sensorType:  string;
    avgValue1:   number;
    avgValue2:   number | null;
    avgValue3:   number | null;
    readingCount: number;
}

interface AiPrediction {
    cropAiPredictionId: number;
    cropName:           string;
    fieldName:          string;
    zoneName:           string;
    diseaseName:        string | null;
    confidenceScore:    number | null;
    status:             'healthy' | 'unhealthy';
    createdAt:          string;
}

// ─── Colours ─────────────────────────────────────────────────────────────────

const ZONE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
const CROP_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

// ─── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_SOIL: any[] = [
    { time: '00:00', 'Vegetable Garden Block': 68 },
    { time: '04:00', 'Vegetable Garden Block': 65 },
    { time: '08:00', 'Vegetable Garden Block': 62 },
    { time: '12:00', 'Vegetable Garden Block': 58 },
    { time: '16:00', 'Vegetable Garden Block': 55 },
    { time: '20:00', 'Vegetable Garden Block': 72 },
    { time: '23:00', 'Vegetable Garden Block': 70 },
];
const MOCK_ZONES = ['Vegetable Garden Block'];
const MOCK_GROWTH: any[] = [
    { week: 'Week 1', Spinach: 5,  Tomato: 0  },
    { week: 'Week 2', Spinach: 12, Tomato: 4  },
    { week: 'Week 3', Spinach: 18, Tomato: 9  },
    { week: 'Week 4', Spinach: 22, Tomato: 16 },
    { week: 'Week 5', Spinach: 25, Tomato: 24 },
    { week: 'Week 6', Spinach: 28, Tomato: 31 },
];
const MOCK_PLANTINGS: Planting[] = [
    {
        cropPlantingId: 1, cropName: 'Spinach', variety: 'Fordhook Giant',
        fieldName: 'Spinach Demonstration Field', zoneName: 'Vegetable Garden Block',
        cropStatus: 'growing', plantedDate: '2026-04-01', expectedHarvestDate: '2026-05-16',
        daysToHarvest: 12, growthDurationDays: 45,
    },
    {
        cropPlantingId: 2, cropName: 'Tomato', variety: 'Roma VF',
        fieldName: 'Tomato Tunnel Plot', zoneName: 'Vegetable Garden Block',
        cropStatus: 'planted', plantedDate: '2026-04-15', expectedHarvestDate: '2026-07-14',
        daysToHarvest: 71, growthDurationDays: 90,
    },
];

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(
    path: string,
    fallback: T,
): Promise<{ data: T; error: string | null }> {
    try {
        const res = await fetch(`http://localhost:5000${path}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: T = await res.json();
        return {
            data:  Array.isArray(data) && data.length === 0 ? fallback : data,
            error: null,
        };
    } catch (e: any) {
        console.error(`${path} fetch failed:`, e);
        return { data: fallback, error: 'Could not load live data — showing cached values.' };
    }
}

// ─── Status badge helpers ─────────────────────────────────────────────────────

function statusLabel(raw: string) {
    return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusColor(raw: string) {
    if (raw === 'ready_to_harvest') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (raw === 'growing')          return 'bg-green-50 text-green-700 border-green-200';
    if (raw === 'planted')          return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function GrowthBar({ planting }: { planting: Planting }) {
    if (!planting.growthDurationDays || !planting.plantedDate) return null;
    const daysSincePlanted = Math.max(
        0,
        Math.floor((Date.now() - new Date(planting.plantedDate).getTime()) / 86_400_000),
    );
    const pct = Math.min(100, Math.round((daysSincePlanted / planting.growthDurationDays) * 100));
    return (
        <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Growth progress</span>
                <span>{pct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                    className="h-1.5 rounded-full bg-green-500 transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CropFarm() {
    // Chart data
    const [soilData,    setSoilData]    = useState<any[]>(MOCK_SOIL);
    const [zones,       setZones]       = useState<string[]>(MOCK_ZONES);
    const [growthData,  setGrowthData]  = useState<any[]>(MOCK_GROWTH);
    const [cropNames,   setCropNames]   = useState<string[]>(['Spinach', 'Tomato']);

    // Card / table data
    const [plantings,   setPlantings]   = useState<Planting[]>(MOCK_PLANTINGS);
    const [sensors,     setSensors]     = useState<SensorSummary[]>([]);
    const [predictions, setPredictions] = useState<AiPrediction[]>([]);

    // UI state
    const [loading,     setLoading]     = useState(true);
    const [soilError,   setSoilError]   = useState<string | null>(null);
    const [growthError, setGrowthError] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    // ── Derived values for summary cards ──────────────────────────────────────

    // Average moisture across all zones from sensor summary
    const avgMoisture = (() => {
        const rows = sensors.filter((s) => s.sensorType === 'moisture');
        if (!rows.length) return null;
        const avg = rows.reduce((sum, r) => sum + r.avgValue1, 0) / rows.length;
        return Math.round(avg);
    })();

    // Average temperature
    const avgTemp = (() => {
        const rows = sensors.filter((s) => s.sensorType === 'temperature');
        if (!rows.length) return null;
        const avg = rows.reduce((sum, r) => sum + r.avgValue1, 0) / rows.length;
        return avg.toFixed(1);
    })();

    // Unhealthy flags from AI predictions (last 7 days)
    const unhealthyAlerts = predictions.filter((p) => p.status === 'unhealthy');

    // Next-to-harvest planting
    const nextHarvest = [...plantings].sort((a, b) => a.daysToHarvest - b.daysToHarvest)[0];

    // ── Data fetch ────────────────────────────────────────────────────────────

    useEffect(() => {
        const controller = new AbortController();

        async function fetchAll() {
            setLoading(true);

            // 1. Zone names → needed before soil data for chart keys
            const zonesRes = await apiFetch<string[]>('/api/soil-moisture/zones', MOCK_ZONES);
            if (zonesRes.data.length) setZones(zonesRes.data);

            // 2. Soil moisture (hourly, pivoted by zone)
            const soilRes = await apiFetch<any[]>('/api/soil-moisture', MOCK_SOIL);
            setSoilError(soilRes.error);
            if (soilRes.data.length) setSoilData(soilRes.data);

            // 3. Yield/growth chart — /api/crops/growth (pivoted by crop)
            const growthRes = await apiFetch<any[]>('/api/crops/growth', MOCK_GROWTH);
            setGrowthError(growthRes.error);
            if (growthRes.data.length) {
                setGrowthData(growthRes.data);
                // Derive crop names from the first row's keys (excluding 'week')
                const keys = Object.keys(growthRes.data[0]).filter((k) => k !== 'week');
                if (keys.length) setCropNames(keys);
            }

            // 4. Active plantings → crop cards
            const plantingsRes = await apiFetch<Planting[]>('/api/crops/plantings', MOCK_PLANTINGS);
            if (plantingsRes.data.length) setPlantings(plantingsRes.data);

            // 5. Sensor summary → summary cards
            const sensorsRes = await apiFetch<SensorSummary[]>('/api/crops/sensors/summary', []);
            setSensors(sensorsRes.data);

            // 6. AI predictions → farm status panel
            const predRes = await apiFetch<AiPrediction[]>('/api/crops/predictions', []);
            setPredictions(predRes.data);

            setLoading(false);
        }

        fetchAll();
        const timer = setInterval(fetchAll, 5 * 60 * 1000);
        return () => { controller.abort(); clearInterval(timer); };
    }, []);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Wheat className="w-8 h-8 text-green-600" />
                        Crop Farm Management
                    </h2>
                    <p className="text-slate-600 mt-1">Smart irrigation and crop monitoring system</p>
                </div>
                <Badge
                    variant="outline"
                    className={`self-start px-4 py-2 text-base sm:self-auto ${
                        loading
                            ? 'bg-slate-50 text-slate-500 border-slate-200'
                            : unhealthyAlerts.length
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                    }`}
                >
                    {loading ? 'Loading…' : unhealthyAlerts.length ? `${unhealthyAlerts.length} Alert${unhealthyAlerts.length > 1 ? 's' : ''}` : 'Healthy'}
                </Badge>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Active plantings count */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Active Plantings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Sprout className="w-5 h-5 text-green-600" />
                            <span className="text-2xl font-bold text-slate-900">{plantings.length}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            crops currently growing
                        </p>
                    </CardContent>
                </Card>

                {/* Avg soil moisture from live sensors */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Avg Soil Moisture</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Droplets className="w-5 h-5 text-blue-500" />
                            <span className="text-2xl font-bold text-slate-900">
                                {avgMoisture !== null ? `${avgMoisture}%` : '—'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">last 24 h across all zones</p>
                    </CardContent>
                </Card>

                {/* Avg temperature from live sensors */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Avg Temperature</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Thermometer className="w-5 h-5 text-orange-500" />
                            <span className="text-2xl font-bold text-slate-900">
                                {avgTemp !== null ? `${avgTemp}°C` : '—'}
                            </span>
                        </div>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Ideal range
                        </p>
                    </CardContent>
                </Card>

                {/* Next harvest */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-600">Next Harvest</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-yellow-500" />
                            <span className="text-2xl font-bold text-slate-900">
                                {nextHarvest ? `${nextHarvest.daysToHarvest}d` : '—'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {nextHarvest ? `${nextHarvest.cropName} · ${nextHarvest.fieldName}` : 'No upcoming harvests'}
                        </p>
                    </CardContent>
                </Card>

            </div>

            {/* ── Floating Farm Status Panel ── */}
            <div className="fixed right-4 bottom-4 z-50">
                {!isMinimized ? (
                    <Card className="border-l-4 border-l-green-500 w-80 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-base">
                                <span>Farm Status</span>
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                                >
                                    ✕
                                </button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 shrink-0" />
                                    <span>All irrigation systems functioning properly</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 shrink-0" />
                                    <span>
                                        {avgMoisture !== null
                                            ? `Avg soil moisture ${avgMoisture}% — optimal`
                                            : 'Soil moisture sensors active'}
                                    </span>
                                </li>
                                {/* Crops close to harvest */}
                                {plantings
                                    .filter((p) => p.daysToHarvest <= 14)
                                    .map((p) => (
                                        <li key={p.cropPlantingId} className="flex items-start gap-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                                            <span>
                                                {p.cropName} in {p.fieldName} — harvest in {p.daysToHarvest} day{p.daysToHarvest !== 1 ? 's' : ''}
                                            </span>
                                        </li>
                                    ))}
                                {/* AI disease alerts */}
                                {unhealthyAlerts.slice(0, 2).map((a) => (
                                    <li key={a.cropAiPredictionId} className="flex items-start gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0" />
                                        <span>
                                            AI alert: {a.diseaseName ?? 'disease detected'} in {a.cropName} ({a.zoneName})
                                            {a.confidenceScore ? ` — ${(a.confidenceScore * 100).toFixed(0)}% confidence` : ''}
                                        </span>
                                    </li>
                                ))}
                                <li className="flex items-start gap-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 shrink-0" />
                                    <span>Rain expected Thursday — irrigation will auto-adjust</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                ) : (
                    <button
                        onClick={() => setIsMinimized(false)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition text-sm font-medium"
                    >
                        Farm Status
                    </button>
                )}
            </div>

            {/* ── Charts ── */}
            <div className="space-y-6">

                {/* Soil Moisture Line Chart — zone names are dynamic dataKeys */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Soil Moisture Levels (24 h)
                            {loading && (
                                <span className="text-xs font-normal text-slate-400 animate-pulse">
                                    Refreshing…
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {soilError
                                ? <span className="text-amber-600">{soilError}</span>
                                : 'Moisture % by zone · updated hourly via cropSensorReadings'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={soilData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="time"  stroke="#64748b" fontSize={12} />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    domain={[0, 100]}
                                    label={{ value: '%', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                />
                                <Legend />
                                {zones.map((zone, i) => (
                                    <Line
                                        key={zone}
                                        type="monotone"
                                        dataKey={zone}
                                        stroke={ZONE_COLORS[i % ZONE_COLORS.length]}
                                        strokeWidth={2}
                                        dot={{ fill: ZONE_COLORS[i % ZONE_COLORS.length] }}
                                        connectNulls
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Harvest Yield Area Chart — crop names are dynamic dataKeys */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Weekly Harvest Yield
                            {loading && (
                                <span className="text-xs font-normal text-slate-400 animate-pulse">
                                    Refreshing…
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {growthError
                                ? <span className="text-amber-600">{growthError}</span>
                                : 'Total kg harvested per crop per week · last 10 weeks · from harvestRecords'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={growthData}>
                                <defs>
                                    {cropNames.map((crop, i) => (
                                        <linearGradient key={crop} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor={CROP_COLORS[i % CROP_COLORS.length]} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={CROP_COLORS[i % CROP_COLORS.length]} stopOpacity={0}   />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    label={{ value: 'kg', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                />
                                <Legend />
                                {cropNames.map((crop, i) => (
                                    <Area
                                        key={crop}
                                        type="monotone"
                                        dataKey={crop}
                                        stroke={CROP_COLORS[i % CROP_COLORS.length]}
                                        strokeWidth={2}
                                        fill={`url(#grad-${i})`}
                                        dot={{ fill: CROP_COLORS[i % CROP_COLORS.length] }}
                                        connectNulls
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

            </div>

            {/* ── Active Crop Cards ── */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Plantings</CardTitle>
                    <CardDescription>
                        Live data from /api/crops/plantings — showing non-harvested, non-failed crops
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {plantings.length === 0 ? (
                        <p className="text-sm text-slate-500">No active plantings found.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {plantings.map((planting) => {
                                // Check if this crop has an unhealthy AI flag
                                const alert = unhealthyAlerts.find(
                                    (a) => a.cropName === planting.cropName && a.zoneName === planting.zoneName,
                                );
                                // Zone moisture from sensor summary
                                const zoneMoisture = sensors.find(
                                    (s) => s.sensorType === 'moisture' && s.zoneName === planting.zoneName,
                                );

                                return (
                                    <div
                                        key={planting.cropPlantingId}
                                        className={`border-2 rounded-lg p-4 transition-colors ${
                                            alert
                                                ? 'border-amber-300 bg-amber-50'
                                                : 'border-slate-200 hover:border-green-300'
                                        }`}
                                    >
                                        {/* Card header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="font-bold text-lg text-slate-900 leading-tight">
                                                    {planting.cropName}
                                                </div>
                                                {planting.variety && (
                                                    <div className="text-xs text-slate-400 italic">{planting.variety}</div>
                                                )}
                                                <div className="text-sm text-slate-500 mt-0.5">
                                                    {planting.fieldName}
                                                </div>
                                                <div className="text-xs text-slate-400">{planting.zoneName}</div>
                                            </div>
                                            {alert
                                                ? <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                                                : <Sprout className="w-6 h-6 text-green-600 shrink-0" />
                                            }
                                        </div>

                                        {/* Status rows */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Status</span>
                                                <Badge variant="outline" className={statusColor(planting.cropStatus)}>
                                                    {statusLabel(planting.cropStatus)}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Harvest in</span>
                                                <span className={`font-bold ${planting.daysToHarvest <= 7 ? 'text-blue-600' : 'text-slate-900'}`}>
                                                    {planting.daysToHarvest} day{planting.daysToHarvest !== 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            {zoneMoisture && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-500">Zone moisture</span>
                                                    <span className="font-bold text-blue-600">
                                                        {zoneMoisture.avgValue1}%
                                                    </span>
                                                </div>
                                            )}

                                            {alert && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-500">AI alert</span>
                                                    <span className="font-bold text-amber-600 text-xs">
                                                        {alert.diseaseName ?? 'Disease detected'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Growth progress bar */}
                                            <div className="pt-1">
                                                <GrowthBar planting={planting} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Sensor Summary Table ── */}
            {sensors.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-purple-500" />
                            Live Sensor Summary
                        </CardTitle>
                        <CardDescription>
                            Average readings per zone · last 24 h · from cropSensorReadings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-slate-500 text-xs uppercase tracking-wide">
                                        <th className="pb-2 pr-4">Zone</th>
                                        <th className="pb-2 pr-4">Sensor</th>
                                        <th className="pb-2 pr-4">Value 1</th>
                                        <th className="pb-2 pr-4">Value 2</th>
                                        <th className="pb-2 pr-4">Value 3</th>
                                        <th className="pb-2">Readings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sensors.map((s, i) => (
                                        <tr key={i} className="py-2">
                                            <td className="py-2 pr-4 font-medium text-slate-700">{s.zoneName}</td>
                                            <td className="py-2 pr-4">
                                                <Badge variant="outline" className="text-xs">
                                                    {s.sensorType}
                                                </Badge>
                                            </td>
                                            <td className="py-2 pr-4 text-slate-600">{s.avgValue1 ?? '—'}</td>
                                            <td className="py-2 pr-4 text-slate-600">{s.avgValue2 ?? '—'}</td>
                                            <td className="py-2 pr-4 text-slate-600">{s.avgValue3 ?? '—'}</td>
                                            <td className="py-2 text-slate-500">{s.readingCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Data Source Note ── */}
            <Card className="bg-slate-50 border-slate-200">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
                        <span>
                            Live data via LoRa network · Last update: {new Date().toLocaleTimeString()} · Group 4 Module
                        </span>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}