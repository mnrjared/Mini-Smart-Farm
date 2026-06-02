// ============================================================
// PowerGeneration.tsx
// ------------------------------------------------------------
// Main "Power" tile of the combined dashboard.
//
// Responsibility breakdown:
//   - Pulls live data from 5 custom hooks
//   - Generates warnings from DB sensor values
//   - TODO: Re-connect MQTT warnings via dedicated broker + ESP32
//   - Renders: Warning Signs card, Light Level, Sun Times,
//     Battery Status, Power In chart, Power Out chart,
//     Battery Level chart, Energy Distribution pie chart
// ============================================================

import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Zap, Battery, Sun, Sunrise, Sunset, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "../../components/ui/badge";
import { useIsMobile } from "../../components/ui/use-mobile";
import { Progress } from "../../components/ui/progress";
import { BatteryStatus, useBatteryData } from "./BatteryLevel";
import { useSunData } from "./SunData";
import { useSolarPower, useZonePower, powerOutFunction } from "./SolarPower";
import { generatePowerWarnings } from "./PowerWarnings";
// TODO: Re-import mqtt and your dedicated broker config here tomorrow
// import mqtt from 'mqtt';

export function PowerGeneration() {
  // ---- RESPONSIVE LAYOUT ----
  // isMobile is used to reduce chart axis density on small screens
  const isMobile = useIsMobile();

  // ---- DATA HOOKS ----
  // Each hook manages its own fetch + polling interval internally.

  // Sunrise/sunset times from the public API (SunData.tsx)
  const { sunrise: sunriseTime, sunset: sunsetTime } = useSunData();

  // Hourly solar generation data for the Power In line chart (SolarPower.tsx)
  const { chartData, loading } = useSolarPower();

  // Hourly consumption data for the Power Out line chart (SolarPower.tsx)
  // ⚠️  NOTE: powerOutFunction should be renamed to usePowerOut to follow
  // React's hook naming convention — update this in SolarPower.tsx when convenient.
  const { powerOutChartData, powerOutLoading } = powerOutFunction();

  // Historical battery level data for the Battery Level line chart.
  // The argument "1" sets a time range (last 1 day).
  // ⚠️  NOTE: isBatteryLoading and batteryError are also available from this
  // hook if you want to add error/loading states to the battery chart later.
  const { batteryLevelData } = useBatteryData(1);

  // Per-zone power breakdown for the Energy Distribution pie chart.
  // Refreshes every 10 seconds (faster than the 30s default).
  const { rawData, energyDistributionloading } = useZonePower(10000);

  // Current battery percentage as a single number — sourced from the database.
  const currentBatteryLevel = BatteryStatus();

  // ---- MQTT WARNING STATE (disabled — HiveMQ removed) ----
  // TODO: Restore this tomorrow when connecting to the dedicated broker + ESP32.
  // const [mqttWarnings, setMqttWarnings] = useState([]);

  // ---- MQTT LISTENER EFFECT ----
  // TODO: Replace the block below with your dedicated broker connection.
  // Template to restore tomorrow:
  //
  // useEffect(() => {
  //   let client;
  //   try {
  //     client = mqtt.connect('<YOUR_BROKER_URL>', {
  //       // Add credentials / options for your dedicated broker here
  //       reconnectPeriod: 5000,
  //     });
  //
  //     client.on('connect', () => {
  //       client.subscribe('<YOUR_TOPIC>', (err) => {
  //         if (err) console.error("Subscription error:", err);
  //       });
  //     });
  //
  //     client.on('message', (topic, message) => {
  //       try {
  //         const payload = JSON.parse(message.toString());
  //         const warning = {
  //           id: `mqtt-${Date.now()}-${Math.random()}`,
  //           source: payload.source ?? "ESP32 Alert",
  //           message: payload.message ?? payload.alert ?? payload.warning ?? `Warning from ${topic}`,
  //           severity: payload.severity ?? payload.level ?? "high",
  //         };
  //         setMqttWarnings(prev => [...prev, warning]);
  //         // Auto-remove after 30 seconds
  //         setTimeout(() => {
  //           setMqttWarnings(prev => prev.filter(w => w.id !== warning.id));
  //         }, 30000);
  //       } catch {
  //         // Fallback for plain-text (non-JSON) messages from ESP32
  //         const warning = {
  //           id: `mqtt-${Date.now()}-${Math.random()}`,
  //           source: "ESP32 Alert",
  //           message: message.toString(),
  //           severity: "high",
  //         };
  //         setMqttWarnings(prev => [...prev, warning]);
  //         setTimeout(() => {
  //           setMqttWarnings(prev => prev.filter(w => w.id !== warning.id));
  //         }, 30000);
  //       }
  //     });
  //
  //     client.on('error', (err) => console.error("MQTT error:", err));
  //   } catch (error) {
  //     console.error("Failed to create MQTT client:", error);
  //   }
  //   return () => { if (client) client.end(); };
  // }, []);

  // ---- LATEST SENSOR SNAPSHOT VALUES ----
  // Grabs the most recent data point from each time-series array.
  // Used to feed generatePowerWarnings() below. Defaults to 0 while loading.
  const latestSolarPower = chartData.length > 0 ? chartData[chartData.length - 1].power : 0;
  const latestPowerOut = powerOutChartData.length > 0 ? powerOutChartData[powerOutChartData.length - 1].power : 0;

  // ---- DATABASE-DERIVED WARNINGS ----
  // generatePowerWarnings() is a pure function (no side effects),
  // so useMemo means it only re-runs when its inputs actually change.
  const databaseWarnings = useMemo(() => {
    return generatePowerWarnings({
      batteryLevel: currentBatteryLevel,
      latestSolarPower,
      latestPowerOut,
      zonePowerData: rawData,
    });
  }, [currentBatteryLevel, latestSolarPower, latestPowerOut, rawData]);

  // ---- ALL WARNINGS ----
  // Currently only DB warnings.
  // TODO: Once ESP32 broker is live, merge like so:
  //   const allWarnings = useMemo(
  //     () => [...databaseWarnings, ...mqttWarnings],
  //     [databaseWarnings, mqttWarnings]
  //   );
  const allWarnings = databaseWarnings;

  // ---- PIE CHART COLOURS ----
  // Fixed palette of 6 colours, cycled via modulo for more than 6 zones.
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // ---- PIE CHART DATA ----
  // Maps rawData (from useZonePower) into the shape Recharts expects,
  // attaching a colour to each zone.
  const energyDistribution = useMemo(() => {
    return rawData.map((item, index) => ({
      name: item.zoneName,
      value: item.totalPower,          // Drives the slice size
      displayPercent: item.percentage, // Shown in labels and tooltip
      color: COLORS[index % COLORS.length]
    }));
  }, [rawData]);

  // ============================================================
  // JSX / RENDER
  // ============================================================
  return (
    <div className="space-y-6">

      {/* ---- PAGE HEADER ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            Power Generation
          </h2>
          <p className="text-slate-600 mt-1">Solar energy monitoring and management</p>
        </div>
        <Badge variant="outline" className="self-start bg-green-50 text-green-700 border-green-200 text-base sm:text-lg px-4 py-2 sm:self-auto">
          Online
        </Badge>
      </div>

      {/* ---- WARNING SIGNS CARD ----
          Severity drives border/background colour:
            high   → red
            medium → yellow
            low    → blue
          TODO: Restore the MQTT warning count badge once the ESP32 broker is live:
            {mqttWarnings.length > 0 && (
              <Badge variant="destructive" className="ml-2">{mqttWarnings.length} MQTT</Badge>
            )}
      */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Warning Signs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allWarnings.length === 0 ? (
            <p className="text-sm font-medium text-green-600">
              No active warning signs at the moment.
            </p>
          ) : (
            <div className="space-y-3">
              {allWarnings.map((warning) => (
                <div
                  key={warning.id}
                  className={`rounded-lg border p-3 ${
                    warning.severity === "high"
                      ? "border-red-300 bg-red-50"
                      : warning.severity === "medium"
                      ? "border-yellow-300 bg-yellow-50"
                      : "border-blue-300 bg-blue-50"
                  }`}
                >
                  {/* TODO: Restore the MQTT source badge once ESP32 is connected:
                      <div className="flex justify-between items-start">
                        <p className="font-semibold">{warning.source}</p>
                        {warning.id.startsWith('mqtt') && (
                          <Badge variant="outline" className="text-xs">MQTT</Badge>
                        )}
                      </div>
                  */}
                  <p className="font-semibold">{warning.source}</p>
                  <p className="text-sm">{warning.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- LIGHT LEVEL & SUN TIMES ROW ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Light Level
            Storing the result in a variable avoids calling
            LightLevelPercentage() twice on the same render. */}
        {/* <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-500" />
              Light Level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const lightLevel = LightLevelPercentage();
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-slate-900">{lightLevel}%</span>
                    <span className="text-sm text-slate-600">Current intensity</span>
                  </div>
                  <Progress value={lightLevel} className="h-3" />
                </>
              );
            })()}
          </CardContent>
        </Card> */}

        {/* Sun Times — displays values from useSunData() */}
        <Card className="w-full col-span-full">
          <CardHeader className="pb-3">
            <CardTitle>Sun Times - Bela Bela, Gauteng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Sunrise className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Sunrise</p>
                  <p className="text-2xl font-bold text-slate-900">{sunriseTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Sunset className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Sunset</p>
                  <p className="text-2xl font-bold text-slate-900">{sunsetTime}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---- BATTERY STATUS CARD ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Battery className="w-5 h-5 text-green-500" />
            Battery Status
          </CardTitle>
          <CardDescription>Data sourced from database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-slate-900">{currentBatteryLevel}%</span>
            <span className="text-sm text-slate-600">Charge level</span>
          </div>
          <Progress value={currentBatteryLevel} className="h-3" />
        </CardContent>
      </Card>

      {/* ---- CHART GRID ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Power In (Solar Generation) — yellow line chart */}
        <Card>
          <CardHeader>xa
            <CardTitle>Power In (Wh) - Hourly</CardTitle>
            <CardDescription>{loading ? "Fetching live readings..." : "Live solar generation from database"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                {/* interval prop reduces label crowding on mobile */}
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} interval={isMobile ? 5 : 2} />
                <YAxis stroke="#64748b" fontSize={12} label={{ value: 'Wh', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="power"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  name="Power In"
                  dot={false}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Power Out (Consumption) — red line chart */}
        <Card>
          <CardHeader>
            <CardTitle>Power Out (Wh) - Hourly</CardTitle>
            <CardDescription>{powerOutLoading ? "Fetching live readings..." : "Power consumption throughout the day"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={powerOutChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} interval={isMobile ? 5 : 2} />
                <YAxis stroke="#64748b" fontSize={12} label={{ value: 'Wh', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="power"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Power Out"
                  dot={false}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Battery Level Over Time — green line chart, 10-min intervals */}
        <Card>
          <CardHeader>
            <CardTitle>Battery Level (%) - 10 Min Intervals</CardTitle>
            <CardDescription>Battery charge level over time from database</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={batteryLevelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                {/* Higher interval values (11/5) because 10-min data
                    produces more data points than the hourly charts */}
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} interval={isMobile ? 11 : 5} />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  domain={[0, 100]}
                  label={{ value: '%', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                {/* Note: dataKey is "level" here, not "power" —
                    this chart uses a different data shape from BatteryLevel.tsx */}
                <Line
                  type="monotone"
                  dataKey="level"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Battery Level"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Energy Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Energy Distribution</CardTitle>
            <CardDescription>Power consumption by farm operation</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={energyDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={isMobile ? false : (props) => {
                    return `${props.name}: ${Number(props.payload.displayPercent).toFixed(1)}%`;
                  }}
                  outerRadius={isMobile ? 70 : 100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {/* Each zone gets its own colour from the COLORS array */}
                  {energyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {/* ⚠️  NOTE: Tooltip label says "kW" but data is in Wh —
                    verify the correct unit with the backend team. */}
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [`${value} kW (${Number(props.payload.displayPercent).toFixed(1)}%)`, name]}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend below the chart — colour dot, zone name, percentage */}
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {energyDistributionloading ? (
                <p className="text-sm text-slate-500">Loading zones...</p>
              ) : (
                energyDistribution.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                      <span className="truncate text-slate-700">{entry.name}</span>
                    </div>
                    <span className="font-medium text-slate-900">
                      {Number(entry.displayPercent).toFixed(1)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---- FOOTER / DATA SOURCE NOTE ---- */}
      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live data via LoRa network • Last update: {new Date().toLocaleTimeString()} • Group 2 Module</span>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
