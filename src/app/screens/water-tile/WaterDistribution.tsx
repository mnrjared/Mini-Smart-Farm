import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Droplets,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Waves,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WaterSensorReading {
  waterSensorReadingId: number;
  nodeId: number;
  deviceId: number;
  takenAt: string;
  depthLevelCm: number;
  turbidityNtu: number;
  // NOTE FOR DB ARCHITECT: Replace single flowRateMlPerSec with these two columns:
  flowRateValve1MlPerSec: number;
  flowRateValve2MlPerSec: number;
  notes: string | null;
}

type ValveState = "open" | "closed" | "pending";

interface ValveStatus {
  id: number;
  label: string;
  state: ValveState;
  lastChanged: string;
  flowRate: number | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = "/api";

// Depth thresholds (cm) — too low OR too high is bad
const DEPTH_MIN_CM       = 0;
const DEPTH_MAX_CM       = 120;
const DEPTH_CRIT_LOW_CM  = 15;   // below this → critical
const DEPTH_WARN_LOW_CM  = 30;   // below this → warning
const DEPTH_WARN_HIGH_CM = 70;   // above this → warning
const DEPTH_CRIT_HIGH_CM = 90;   // above this → critical

// Turbidity thresholds (NTU) — higher is always worse
const TURBIDITY_MAX_NTU  = 150;
const TURBIDITY_WARN_NTU = 50;
const TURBIDITY_CRIT_NTU = 100;

// ─── Mock data ────────────────────────────────────────────────────────────────

function generateMockReadings(): WaterSensorReading[] {
  const now = Date.now();
  return Array.from({ length: 10 }, (_, i) => ({
    waterSensorReadingId: 1000 - i,
    nodeId: 1,
    deviceId: 42,
    takenAt: new Date(now - i * 5 * 60 * 1000).toISOString(),
    depthLevelCm: Math.round(50 + Math.sin(i * 0.8) * 20),
    turbidityNtu: Math.round(40 + Math.random() * 60),
    flowRateValve1MlPerSec: Math.round((120 + Math.random() * 40) * 10) / 10,
    flowRateValve2MlPerSec: Math.round((95  + Math.random() * 35) * 10) / 10,
    notes: i === 3 ? "Manual flush triggered" : null,
  }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

type Status = "ok" | "warning" | "critical";

// Dual-threshold status: bad at both low AND high ends
function getDualStatus(
  value: number,
  critLow: number, warnLow: number,
  warnHigh: number, critHigh: number
): Status {
  if (value <= critLow || value >= critHigh) return "critical";
  if (value <= warnLow || value >= warnHigh) return "warning";
  return "ok";
}

// One-directional status: only high end is bad
function getHighStatus(value: number, warn: number, crit: number): Status {
  if (value >= crit) return "critical";
  if (value >= warn) return "warning";
  return "ok";
}

const STATUS_COLORS: Record<Status, { text: string; bg: string; label: string }> = {
  ok:       { text: "text-green-600", bg: "bg-green-50",  label: "OK"       },
  warning:  { text: "text-amber-600", bg: "bg-amber-50",  label: "Warning"  },
  critical: { text: "text-red-600",   bg: "bg-red-50",    label: "Critical" },
};

const NEEDLE_COLOR: Record<Status, string> = {
  ok:       "#22c55e",
  warning:  "#f59e0b",
  critical: "#ef4444",
};

function turbidityTableLabel(ntu: number): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (ntu < 50)  return { text: "Clear",  variant: "default"     };
  if (ntu < 100) return { text: "Cloudy", variant: "secondary"   };
  return             { text: "High",   variant: "destructive" };
}

// ─── Shared SVG gauge helpers ─────────────────────────────────────────────────

const CX = 110;
const CY = 100;
const R  = 80;

// Maps a value in [min, max] to an SVG angle: 180° (left) → 0° (right)
function toAngle(value: number, min: number, max: number): number {
  return 180 - ((Math.min(Math.max(value, min), max) - min) / (max - min)) * 180;
}

// Polar → SVG cartesian
function polar(angleDeg: number, radius = R): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

// Filled annulus arc between two angles
function arcPath(startDeg: number, endDeg: number, radius = R, trackWidth = 16): string {
  const inner = radius - trackWidth;
  const s  = polar(startDeg, radius);
  const e  = polar(endDeg,   radius);
  const si = polar(startDeg, inner);
  const ei = polar(endDeg,   inner);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return [
    `M ${s.x} ${s.y}`,
    `A ${radius} ${radius} 0 ${large} 0 ${e.x} ${e.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${inner} ${inner} 0 ${large} 1 ${si.x} ${si.y}`,
    "Z",
  ].join(" ");
}

// ─── Dual-threshold gauge (depth) ────────────────────────────────────────────
//
//  Arc zones from left to right:
//    [min → critLow]   red
//    [critLow → warnLow]  yellow
//    [warnLow → warnHigh] green   ← sweet spot
//    [warnHigh → critHigh] yellow
//    [critHigh → max]  red

interface DualGaugeProps {
  value: number;
  min: number;
  max: number;
  critLow: number;
  warnLow: number;
  warnHigh: number;
  critHigh: number;
  unit: string;
  label: string;
}

function DualGauge({ value, min, max, critLow, warnLow, warnHigh, critHigh, unit, label }: DualGaugeProps) {
  const a = (v: number) => toAngle(v, min, max);

  const critLowAngle  = a(critLow);
  const warnLowAngle  = a(warnLow);
  const warnHighAngle = a(warnHigh);
  const critHighAngle = a(critHigh);
  const needleAngle   = a(value);

  const needleTip = polar(needleAngle, R - 8);
  const needleL   = polar(needleAngle + 90, 7);
  const needleR   = polar(needleAngle - 90, 7);

  const status     = getDualStatus(value, critLow, warnLow, warnHigh, critHigh);
  const colors     = STATUS_COLORS[status];
  const needleCol  = NEEDLE_COLOR[status];

  // Tick label positions (just outside arc)
  const lp = (v: number) => polar(a(v), R + 12);

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-sm font-medium text-slate-500 text-center mb-1">{label}</p>
        <svg viewBox="0 0 220 118" className="w-full max-w-[260px] mx-auto block">
          {/* Background */}
          <path d={arcPath(180, 0)} fill="#e2e8f0" />
          {/* Critical low */}
          <path d={arcPath(180, critLowAngle)} fill="#fca5a5" />
          {/* Warning low */}
          <path d={arcPath(critLowAngle, warnLowAngle)} fill="#fde68a" />
          {/* OK sweet spot */}
          <path d={arcPath(warnLowAngle, warnHighAngle)} fill="#bbf7d0" />
          {/* Warning high */}
          <path d={arcPath(warnHighAngle, critHighAngle)} fill="#fde68a" />
          {/* Critical high */}
          <path d={arcPath(critHighAngle, 0)} fill="#fca5a5" />

          {/* Needle */}
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleL.x},${needleL.y} ${needleR.x},${needleR.y}`}
            fill={needleCol} opacity={0.95}
          />
          <circle cx={CX} cy={CY} r={7} fill={needleCol} />
          <circle cx={CX} cy={CY} r={3} fill="white" />

          {/* Corner labels */}
          <text x="16"  y="110" fontSize="9" fill="#b91c1c" fontWeight="700">LOW</text>
          <text x="92"  y="20"  fontSize="9" fill="#15803d" fontWeight="700" textAnchor="middle">OK</text>
          <text x="204" y="110" fontSize="9" fill="#b91c1c" fontWeight="700" textAnchor="end">HIGH</text>

          {/* Threshold ticks */}
          {[
            { v: critLow,  color: "#991b1b" },
            { v: warnLow,  color: "#92400e" },
            { v: warnHigh, color: "#92400e" },
            { v: critHigh, color: "#991b1b" },
          ].map(({ v, color }) => {
            const p = lp(v);
            return (
              <text key={v} x={p.x} y={p.y} fontSize="8" fill={color} textAnchor="middle">{v}</text>
            );
          })}
        </svg>

        <div className="text-center -mt-1">
          <span className={`text-3xl font-bold ${colors.text}`}>{value}</span>
          <span className="text-slate-500 text-sm ml-1">{unit}</span>
        </div>
        <div className={`flex items-center justify-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold w-fit mx-auto ${colors.bg} ${colors.text}`}>
          {status !== "ok" && <AlertTriangle size={11} />}
          {colors.label}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── One-directional gauge (turbidity) ───────────────────────────────────────
//
//  Arc zones from left to right:
//    [0 → warn]   green
//    [warn → crit] yellow
//    [crit → max]  red

interface HighGaugeProps {
  value: number;
  max: number;
  warnThreshold: number;
  critThreshold: number;
  unit: string;
  label: string;
}

function HighGauge({ value, max, warnThreshold, critThreshold, unit, label }: HighGaugeProps) {
  const a = (v: number) => toAngle(v, 0, max);

  const warnAngle   = a(warnThreshold);
  const critAngle   = a(critThreshold);
  const needleAngle = a(value);

  const needleTip = polar(needleAngle, R - 8);
  const needleL   = polar(needleAngle + 90, 7);
  const needleR   = polar(needleAngle - 90, 7);

  const status    = getHighStatus(value, warnThreshold, critThreshold);
  const colors    = STATUS_COLORS[status];
  const needleCol = NEEDLE_COLOR[status];

  const lp = (v: number) => polar(a(v), R + 12);

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-sm font-medium text-slate-500 text-center mb-1">{label}</p>
        <svg viewBox="0 0 220 118" className="w-full max-w-[260px] mx-auto block">
          {/* Background */}
          <path d={arcPath(180, 0)} fill="#e2e8f0" />
          {/* OK zone */}
          <path d={arcPath(180, warnAngle)} fill="#bbf7d0" />
          {/* Warning zone */}
          <path d={arcPath(warnAngle, critAngle)} fill="#fde68a" />
          {/* Critical zone */}
          <path d={arcPath(critAngle, 0)} fill="#fca5a5" />

          {/* Needle */}
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleL.x},${needleL.y} ${needleR.x},${needleR.y}`}
            fill={needleCol} opacity={0.95}
          />
          <circle cx={CX} cy={CY} r={7} fill={needleCol} />
          <circle cx={CX} cy={CY} r={3} fill="white" />

          {/* Corner labels */}
          <text x="16"  y="110" fontSize="9" fill="#15803d" fontWeight="700">OK</text>
          <text x="92"  y="20"  fontSize="9" fill="#b45309" fontWeight="700" textAnchor="middle">WARN</text>
          <text x="204" y="110" fontSize="9" fill="#b91c1c" fontWeight="700" textAnchor="end">CRIT</text>

          {/* Threshold ticks */}
          {[
            { v: warnThreshold, color: "#92400e" },
            { v: critThreshold, color: "#991b1b" },
          ].map(({ v, color }) => {
            const p = lp(v);
            return (
              <text key={v} x={p.x} y={p.y} fontSize="8" fill={color} textAnchor="middle">{v}</text>
            );
          })}
        </svg>

        <div className="text-center -mt-1">
          <span className={`text-3xl font-bold ${colors.text}`}>{value}</span>
          <span className="text-slate-500 text-sm ml-1">{unit}</span>
        </div>
        <div className={`flex items-center justify-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold w-fit mx-auto ${colors.bg} ${colors.text}`}>
          {status !== "ok" && <AlertTriangle size={11} />}
          {colors.label}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Valve Control ────────────────────────────────────────────────────────────

function ValveControl({
  valve,
  onToggle,
}: {
  valve: ValveStatus;
  onToggle: (id: number, desiredState: "open" | "closed") => void;
}) {
  const isOpen    = valve.state === "open";
  const isPending = valve.state === "pending";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{valve.label}</CardTitle>
          <Badge
            variant={isPending ? "secondary" : isOpen ? "default" : "outline"}
            className={
              isPending
                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                : isOpen
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }
          >
            {isPending ? "Updating…" : isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center my-3">
          <div className={`relative w-16 h-16 rounded-full border-4 transition-all duration-500 flex items-center justify-center ${
            isPending ? "border-yellow-400 bg-yellow-50"
            : isOpen  ? "border-green-500 bg-green-50"
                      : "border-slate-300 bg-slate-100"
          }`}>
            <Droplets size={28} className={`transition-colors duration-500 ${
              isPending ? "text-yellow-500" : isOpen ? "text-green-500" : "text-slate-400"
            }`} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mb-3">
          <Waves size={14} className="text-blue-400" />
          {valve.flowRate !== null
            ? <span className="text-sm text-slate-600"><span className="text-slate-900 font-bold">{valve.flowRate}</span> mL/s</span>
            : <span className="text-sm text-slate-400">— mL/s</span>
          }
        </div>

        <p className="text-xs text-center text-slate-400 mb-4">Last changed: {valve.lastChanged}</p>

        <div className="flex gap-2">
          <Button variant={isOpen ? "default" : "outline"} className="flex-1"
            disabled={isPending || isOpen} onClick={() => onToggle(valve.id, "open")}>
            <ChevronUp size={14} className="mr-1" />Open
          </Button>
          <Button variant={!isOpen ? "destructive" : "outline"} className="flex-1"
            disabled={isPending || !isOpen} onClick={() => onToggle(valve.id, "closed")}>
            <ChevronDown size={14} className="mr-1" />Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function WaterDistribution() {
  const [readings,    setReadings]    = useState<WaterSensorReading[]>([]);
  const [valves,      setValves]      = useState<ValveStatus[]>([
    { id: 1, label: "Solenoid Valve 1", state: "closed", lastChanged: "Never", flowRate: null },
    { id: 2, label: "Solenoid Valve 2", state: "closed", lastChanged: "Never", flowRate: null },
  ]);
  const [loading,     setLoading]     = useState(true);
  const [connected,   setConnected]   = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchReadings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/water-sensor-readings?limit=10&order=desc`);
      if (!res.ok) throw new Error("Non-2xx");
      const data: WaterSensorReading[] = await res.json();
      setReadings(data);
      setConnected(true);
      if (data[0]) {
        setValves(prev => prev.map(v => ({
          ...v,
          flowRate: v.id === 1 ? data[0].flowRateValve1MlPerSec : data[0].flowRateValve2MlPerSec,
        })));
      }
    } catch {
      const mock = generateMockReadings();
      setReadings(mock);
      setConnected(false);
      if (mock[0]) {
        setValves(prev => prev.map(v => ({
          ...v,
          flowRate: v.id === 1 ? mock[0].flowRateValve1MlPerSec : mock[0].flowRateValve2MlPerSec,
        })));
      }
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  const fetchValveStates = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/valves`);
      if (!res.ok) throw new Error("Non-2xx");
      const data: { id: number; state: "open" | "closed"; lastChanged: string }[] = await res.json();
      setValves(prev => prev.map(v => {
        const remote = data.find(d => d.id === v.id);
        return remote ? { ...v, state: remote.state, lastChanged: remote.lastChanged } : v;
      }));
    } catch { /* keep existing state */ }
  }, []);

  const handleValveToggle = async (valveId: number, desiredState: "open" | "closed") => {
    setValves(prev => prev.map(v => v.id === valveId ? { ...v, state: "pending" } : v));
    try {
      const res = await fetch(`${API_BASE}/valves/${valveId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: desiredState }),
      });
      if (!res.ok) throw new Error("Failed");
      setValves(prev => prev.map(v =>
        v.id === valveId ? { ...v, state: desiredState, lastChanged: new Date().toLocaleTimeString() } : v
      ));
    } catch {
      setValves(prev => prev.map(v =>
        v.id === valveId ? { ...v, state: desiredState === "open" ? "closed" : "open" } : v
      ));
    }
  };

  useEffect(() => {
    fetchReadings();
    fetchValveStates();
    const id = setInterval(() => { fetchReadings(); fetchValveStates(); }, 30_000);
    return () => clearInterval(id);
  }, [fetchReadings, fetchValveStates]);

  const latest = readings[0] ?? null;

  //chart data
  const chartData = readings
  .slice()
  .reverse()
  .map(r => ({
    time: formatDateTime(r.takenAt),
    depth: r.depthLevelCm,
    turbidity: r.turbidityNtu,
    flow1: r.flowRateValve1MlPerSec,
    flow2: r.flowRateValve2MlPerSec,
  }));

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Water Distribution</h2>
          <p className="text-sm text-slate-500 mt-0.5">LoRa Node · Live sensor readings &amp; valve control</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            {connected ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-amber-500" />}
            {connected ? "Connected" : "Using mock data"}
          </span>
          {lastRefresh && <span className="text-xs text-slate-400">Updated {lastRefresh.toLocaleTimeString()}</span>}
          <Button variant="outline" size="sm"
            onClick={() => { fetchReadings(); fetchValveStates(); }} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="ml-1">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Gauges */}
        <DualGauge
          label="Water Depth"
          value={loading ? 0 : (latest?.depthLevelCm ?? 0)}
          min={DEPTH_MIN_CM}
          max={DEPTH_MAX_CM}
          critLow={DEPTH_CRIT_LOW_CM}
          warnLow={DEPTH_WARN_LOW_CM}
          warnHigh={DEPTH_WARN_HIGH_CM}
          critHigh={DEPTH_CRIT_HIGH_CM}
          unit="cm"
        />
        {/* Turbidity: one-directional — only high is bad */}
        <HighGauge
          label="Turbidity"
          value={loading ? 0 : (latest?.turbidityNtu ?? 0)}
          max={TURBIDITY_MAX_NTU}
          warnThreshold={TURBIDITY_WARN_NTU}
          critThreshold={TURBIDITY_CRIT_NTU}
          unit="NTU"
        />

        {/* Valves */}
        {valves.map(valve => (
          <ValveControl key={valve.id} valve={valve} onToggle={handleValveToggle} />
        ))}
      </div>

      {/* Data Charts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Water Depth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[250px]">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="depth"
                  name="Depth (cm)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Turbidity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[250px]">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="turbidity"
                  name="Turbidity (NTU)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Flow Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[250px]">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="flow1"
                  name="Valve 1 (mL/s)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="flow2"
                  name="Valve 2 (mL/s)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Readings table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-slate-500" />
            <CardTitle className="text-base">Recent Readings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left  py-3 px-4 font-medium text-slate-600">Time</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Depth (cm)</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Turbidity</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">V1 Flow (mL/s)</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">V2 Flow (mL/s)</th>
                  <th className="text-left  py-3 px-4 font-medium text-slate-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading…</td></tr>
                ) : readings.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">No readings available</td></tr>
                ) : readings.map((r, idx) => {
                  const turb      = turbidityTableLabel(r.turbidityNtu);
                  const depthStat = getDualStatus(r.depthLevelCm, DEPTH_CRIT_LOW_CM, DEPTH_WARN_LOW_CM, DEPTH_WARN_HIGH_CM, DEPTH_CRIT_HIGH_CM);
                  return (
                    <tr key={r.waterSensorReadingId}
                      className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${idx === 0 ? "font-medium" : ""}`}>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {idx === 0 && <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 align-middle" />}
                        {formatDateTime(r.takenAt)}
                      </td>
                      <td className={`py-3 px-4 text-right tabular-nums font-medium ${
                        depthStat === "critical" ? "text-red-600"
                        : depthStat === "warning" ? "text-amber-600"
                        : "text-slate-700"}`}>
                        {r.depthLevelCm}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant={turb.variant} className="text-xs">
                          {r.turbidityNtu} – {turb.text}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-700">{r.flowRateValve1MlPerSec}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-700">{r.flowRateValve2MlPerSec}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs max-w-[140px] truncate">{r.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dev checklist */}
      {!connected && (
        <Card className="border-dashed border-slate-300 bg-slate-50">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">API Integration Checklist</p>
            <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
              <li><code>GET {API_BASE}/water-sensor-readings?limit=10&order=desc</code> → <code>WaterSensorReading[]</code></li>
              <li><code>GET {API_BASE}/valves</code> → <code>{"{ id, state, lastChanged }[]"}</code></li>
              <li><code>PUT {API_BASE}/valves/:id</code> body <code>{"{ state: 'open'|'closed' }"}</code> → triggers LoRa command</li>
              <li>DB schema: add <code>flowRateValve1MlPerSec</code> + <code>flowRateValve2MlPerSec</code> (replaces <code>flowRateMlPerSec</code>)</li>
              <li>Update <code>API_BASE</code> at the top of this file to your server URL.</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
