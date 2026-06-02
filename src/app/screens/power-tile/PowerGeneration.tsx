import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Zap, TrendingUp, Battery, Sun, Sunrise, Sunset, AlertCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "../../components/ui/badge";
import { useIsMobile } from "../../components/ui/use-mobile";
import { Progress } from "../../components/ui/progress";
import {BatteryStatus, useBatteryData} from "./BatteryLevel";
import {LightLevelPercentage} from "./LightLevel";
import {useSunData} from "./SunData";
import { generatePowerWarnings } from "./PowerWarnings";
import { useSolarPower, useZonePower, powerOutFunction } from "./SolarPower";
import React, { useMemo } from "react";

export function PowerGeneration() {
  const isMobile = useIsMobile();
  const { sunrise: sunriseTime, sunset: sunsetTime } = useSunData();
  const { chartData, loading } = useSolarPower();
  const { powerOutChartData, powerOutLoading} = powerOutFunction();
  const { batteryLevelData, isBatteryLoading, batteryError} = useBatteryData(1);
  const { rawData, energyDistributionloading } = useZonePower(10000);
  const currentBatteryLevel = BatteryStatus();
  const latestSolarPower =
  chartData.length > 0 ? chartData[chartData.length - 1].power : 0;
  const latestPowerOut =
  powerOutChartData.length > 0
    ? powerOutChartData[powerOutChartData.length - 1].power
    : 0;
    const crossTileAlerts = {
      chickenCoop: {
        temperatureSystemOffline: true,
        ventilationFailure: false,
        lightingSystemInactive: false,
        highPowerDemand: true,
      },
      cropFarm: {
        irrigationInactive: true,
        highPowerDemand: false,
        lowPowerAffectingOperations: true,
      },
      waterDistribution: {
        pumpNotOperating: true,
        lowWaterFlowDueToPower: true,
        highPowerDemand: false,
      },
    };
    const warnings = generatePowerWarnings({
      batteryLevel: currentBatteryLevel,
      latestSolarPower,
      latestPowerOut,
      zonePowerData: rawData,
      crossTileAlerts,
    });
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  
const energyDistribution = useMemo(() => {
    return rawData.map((item, index) => ({
      name: item.zoneName,
      value: item.totalPower, // Raw value for Pie slice sizing
      displayPercent: item.percentage, // Pre-calculated percentage from hook
      color: COLORS[index % COLORS.length]
    }));
  }, [rawData]);

  return (
    <div className="space-y-6">
      {/* Header */}
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


      <Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-red-500" />
      Warning Signs
    </CardTitle>
  </CardHeader>
  <CardContent>
    {warnings.length === 0 ? (
      <p className="text-sm text-green-600 font-medium">
        No active warning signs at the moment.
      </p>
    ) : (
      <div className="space-y-3">
        {warnings.map((warning) => (
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
            <p className="font-semibold">{warning.source}</p>
            <p className="text-sm">{warning.message}</p>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>

      {/* Light Level & Sun Times Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Light Level */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-yellow-500" />
                Light Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-slate-900">{LightLevelPercentage()}%</span>
                <span className="text-sm text-slate-600">Current intensity</span>
              </div>
              <Progress value={LightLevelPercentage()} className="h-3" />
            </CardContent>
          </Card>

          {/* Sunrise & Sunset Times */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Sun Times what ya meana- Bela Bela, Gauteng</CardTitle>
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
        {/* Battery Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Battery className="w-5 h-5 text-green-500" />
              Battery Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-slate-900"> {currentBatteryLevel}%</span>
              <span className="text-sm text-slate-600">Charge level</span>
            </div>
            <Progress value={currentBatteryLevel} className="h-3" />
          </CardContent>
        </Card>

        {/* Power Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Power In Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Power In (Wh) - Hourly</CardTitle>
              <CardDescription>{loading? "Fetching live readings..." : "Live solar generation from database"}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={12}
                    interval={isMobile ? 5 : 2}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    label={{ value: 'Wh', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
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

          {/* Power Out Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Power Out (Wh) - Hourly</CardTitle>
              <CardDescription>{powerOutLoading? "Fetching live readings..." : "Power consumption throughout the day"}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={powerOutChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={12}
                    interval={isMobile ? 5 : 2}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    label={{ value: 'Wh', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="power"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Power Out"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Battery Level Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Battery Level (%) - 10 Min Intervals</CardTitle>
              <CardDescription>Battery charge level over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={batteryLevelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={12}
                    interval={isMobile ? 11 : 5}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    domain={[0, 100]}
                    label={{ value: '%', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
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
                    {energyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* 2. Tooltip: Shows Name, raw kW, and % when you hover */}
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [`${value} kW (${Number(props.payload.displayPercent).toFixed(1)}%)`, name]}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'}}
                    />
                </PieChart>
              </ResponsiveContainer>
<div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
  {/* Add a loading check for the distribution specifically */}
  {energyDistributionloading ? (
    <p className="text-sm text-slate-500">Loading zones...</p>
  ) : (
    energyDistribution.map((entry) => (
      <div key={entry.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
          <span className="truncate text-slate-700">{entry.name}</span>
        </div>
        {/* Use the fixed percentage from the hook */}
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
        {/* Footer - Data Source Note */}
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
