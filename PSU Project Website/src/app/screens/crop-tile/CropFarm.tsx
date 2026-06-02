import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

import {
  Wheat,
  Droplets,
  Thermometer,
  TrendingUp,
  Sprout,
  Zap,
  AlertCircle,
  Calendar,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Badge } from "../../components/ui/badge";
import { useEffect, useState } from "react";

const API_BASE = "/api";

// =====================================================
// TYPE DEFINITIONS (matching database schema)
// =====================================================
interface FarmZone {
  farmZoneId: number;
  farmId: number;
  zoneName: string;
  tileId: number;
  description: string;
  areaSqMeter: number;
  createdAt: string;
}

interface Field {
  fieldId: number;
  zoneId: number;
  fieldName: string;
  areaM2: number;
  soilType: string;
  notes: string;
  createdAt: string;
}

interface Crop {
  cropId: number;
  commonName: string;
  scientificName: string;
  variety: string;
  growthDurationDays: number;
  notes: string;
}

interface CropPlanting {
  cropPlantingId: number;
  fieldId: number;
  cropId: number;
  cropStatus: "planted" | "growing" | "ready_to_harvest" | "harvested" | "failed";
  plantedDate: string;
  expectedHarvestDate: string;
  actualHarvestDate: string | null;
  notes: string;
  createdAt: string;
  crop?: Crop;
  field?: Field;
}

interface CropSensorReading {
  cropSensorReadingId: number;
  plantingId: number;
  deviceId: number;
  sensorType: string;
  value1: number;
  value2: number | null;
  value3: number | null;
  takenAt: string;
}

interface Device {
  deviceId: number;
  zoneId: number;
  deviceName: string;
  deviceType: string;
  location: string;
  protocol: string;
  status: "online" | "offline" | "maintenance";
  lastSeen: string;
}

export function CropFarm() {
  const [isMinimized, setIsMinimized] = useState(false);

  // Zone and field state
  const [cropZones, setCropZones] = useState<FarmZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [fields, setFields] = useState<Field[]>([]);

  // Crop and sensor state
  const [plantings, setPlantings] = useState<CropPlanting[]>([]);
  const [sensorReadings, setSensorReadings] = useState<CropSensorReading[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // LOAD CROP ZONES (Crop Tile zones only)
  // =====================================================
  const loadCropZones = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/farmzones?tileId=crop`);
      if (!response.ok) throw new Error("Failed to fetch crop zones");
      const data = await response.json();
      setCropZones(data);
      if (data.length > 0 && !selectedZoneId) {
        setSelectedZoneId(data[0].farmZoneId);
      }
    } catch (err) {
      console.error("Error loading crop zones:", err);
      setError("Failed to load crop zones");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD FIELDS FOR SELECTED ZONE
  // =====================================================
  const loadFieldsForZone = async (zoneId: number) => {
    try {
      const response = await fetch(`${API_BASE}/fields?zoneId=${zoneId}`);
      if (!response.ok) throw new Error("Failed to fetch fields");
      const data = await response.json();
      setFields(data);
    } catch (err) {
      console.error("Error loading fields:", err);
      setError("Failed to load fields");
    }
  };

  // =====================================================
  // LOAD PLANTINGS FOR ZONE
  // =====================================================
  const loadPlantingsForZone = async (zoneId: number) => {
    try {
      const response = await fetch(`${API_BASE}/crops/plantings?zoneId=${zoneId}`);
      if (!response.ok) throw new Error("Failed to fetch plantings");
      const data = await response.json();
      setPlantings(data);
    } catch (err) {
      console.error("Error loading plantings:", err);
      setError("Failed to load plantings");
    }
  };

  // =====================================================
  // LOAD SENSOR READINGS FOR ZONE
  // =====================================================
  const loadSensorReadingsForZone = async (zoneId: number) => {
    try {
      const response = await fetch(
        `${API_BASE}/crops/sensors?zoneId=${zoneId}&hours=24`
      );
      if (!response.ok) throw new Error("Failed to fetch sensor readings");
      const data = await response.json();
      setSensorReadings(data);
    } catch (err) {
      console.error("Error loading sensor readings:", err);
      setError("Failed to load sensor readings");
    }
  };

  // =====================================================
  // LOAD DEVICES FOR ZONE
  // =====================================================
  const loadDevicesForZone = async (zoneId: number) => {
    try {
      const response = await fetch(`${API_BASE}/devices?zoneId=${zoneId}`);
      if (!response.ok) throw new Error("Failed to fetch devices");
      const data = await response.json();
      setDevices(data);
    } catch (err) {
      console.error("Error loading devices:", err);
      setError("Failed to load devices");
    }
  };

  // =====================================================
  // INITIAL LOAD - GET ZONES
  // =====================================================
  useEffect(() => {
    setLoading(true);
    loadCropZones();
  }, []);

  // =====================================================
  // LOAD DATA WHEN ZONE CHANGES
  // =====================================================
  useEffect(() => {
    if (selectedZoneId) {
      setLoading(true);
      Promise.all([
        loadFieldsForZone(selectedZoneId),
        loadPlantingsForZone(selectedZoneId),
        loadSensorReadingsForZone(selectedZoneId),
        loadDevicesForZone(selectedZoneId),
      ]).then(() => setLoading(false));
    }
  }, [selectedZoneId]);

  // =====================================================
  // AUTO-REFRESH SENSOR DATA
  // =====================================================
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedZoneId) {
        loadSensorReadingsForZone(selectedZoneId);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedZoneId]);

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================
  const getLatestSensorValue = (sensorType: string, fieldId?: number) => {
    const filtered = fieldId
      ? sensorReadings.filter((r) => {
          const planting = plantings.find(
            (p) => p.cropPlantingId === r.plantingId && p.fieldId === fieldId
          );
          return planting && r.sensorType === sensorType;
        })
      : sensorReadings.filter((r) => r.sensorType === sensorType);

    if (filtered.length === 0) return null;
    const latest = filtered.sort(
      (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
    )[0];
    return latest;
  };

  const getAverageSensorValue = (sensorType: string, valueIndex: 1 | 2 | 3 = 1) => {
    const filtered = sensorReadings.filter((r) => r.sensorType === sensorType);
    if (filtered.length === 0) return 0;

    const values =
      valueIndex === 1
        ? filtered.map((r) => r.value1)
        : valueIndex === 2
          ? filtered.map((r) => r.value2 || 0)
          : filtered.map((r) => r.value3 || 0);

    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const formatChartData = (sensorType: string) => {
    return sensorReadings
      .filter((r) => r.sensorType === sensorType)
      .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime())
      .map((r) => ({
        time: new Date(r.takenAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: r.value1,
        value2: r.value2,
        value3: r.value3,
      }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "growing":
        return "bg-green-50 text-green-700 border-green-200";
      case "ready_to_harvest":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "harvested":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getCurrentZone = () => cropZones.find((z) => z.farmZoneId === selectedZoneId);

  const moistureReading = getLatestSensorValue("moisture");
  const temperatureReading = getLatestSensorValue("temperature");
  const npkReading = getLatestSensorValue("NPK");

  const moistureAvg = getAverageSensorValue("moisture");
  const temperatureAvg = getAverageSensorValue("temperature");
  const ecAvg = getAverageSensorValue("EC");

  const moistureChartData = formatChartData("moisture");

  if (loading && cropZones.length === 0) {
    return (
      <div className="p-6 text-slate-600">
        <div className="flex items-center gap-2 animate-pulse">
          <Zap className="w-5 h-5" />
          Loading crop farm dashboard...
        </div>
      </div>
    );
  }

  if (error && cropZones.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    );
  }

  const currentZone = getCurrentZone();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Wheat className="w-8 h-8 text-green-600" />
            Crop Farm Management
          </h2>

          <p className="text-slate-600 mt-1">
            {currentZone
              ? `${currentZone.zoneName} • ${currentZone.areaSqMeter}m²`
              : "Smart irrigation and crop monitoring system"}
          </p>
        </div>

        <Badge
          variant="outline"
          className="self-start bg-green-50 text-green-700 border-green-200 text-base sm:text-lg px-4 py-2 sm:self-auto"
        >
          {cropZones.some((z) =>
            devices.some((d) => d.status === "online")
          )
            ? "Live Monitoring"
            : "Idle"}
        </Badge>
      </div>

      {/* ZONE SELECTOR */}
      {cropZones.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Select Crop Zone</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-2">
              {cropZones.map((zone) => (
                <button
                  key={zone.farmZoneId}
                  onClick={() => setSelectedZoneId(zone.farmZoneId)}
                  className={`px-4 py-2 rounded-lg border-2 transition ${
                    selectedZoneId === zone.farmZoneId
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-green-300"
                  }`}
                >
                  {zone.zoneName}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SOIL MOISTURE */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Soil Moisture (Avg)
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />

              <span className="text-2xl font-bold text-slate-900">
                {moistureAvg.toFixed(1)}%
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-1">
              {moistureReading
                ? `Last: ${new Date(moistureReading.takenAt).toLocaleTimeString()}`
                : "No recent readings"}
            </p>
          </CardContent>
        </Card>

        {/* TEMPERATURE */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Soil Temperature (Avg)
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-orange-500" />

              <span className="text-2xl font-bold text-slate-900">
                {temperatureAvg.toFixed(1)}°C
              </span>
            </div>

            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {temperatureReading
                ? `Last: ${new Date(temperatureReading.takenAt).toLocaleTimeString()}`
                : "No recent readings"}
            </p>
          </CardContent>
        </Card>

        {/* ELECTROCONDUCTIVITY */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              EC (Nutrient Level)
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-500" />

              <span className="text-2xl font-bold text-slate-900">
                {ecAvg.toFixed(2)} S/m
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-1">
              {npkReading
                ? `N: ${npkReading.value1?.toFixed(1)}, P: ${npkReading.value2?.toFixed(1)}, K: ${npkReading.value3?.toFixed(1)}`
                : "Nutrient conductivity"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* LIVE SENSOR CHART */}
      {moistureChartData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Soil Moisture - Last 24 Hours</CardTitle>

            <CardDescription>
              Real-time IoT sensor readings from {devices.length} device
              {devices.length !== 1 ? "s" : ""} in {currentZone?.zoneName}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={moistureChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={12}
                />

                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  domain={[0, 100]}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-slate-600">
              <AlertCircle className="w-5 h-5" />
              <span>No sensor data available for this zone</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FIELDS SECTION */}
      {fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fields in {currentZone?.zoneName}</CardTitle>

            <CardDescription>
              {fields.length} field{fields.length !== 1 ? "s" : ""} •{" "}
              {fields.reduce((sum, f) => sum + (f.areaM2 || 0), 0).toFixed(0)}m² total
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field) => {
                const fieldPlantings = plantings.filter(
                  (p) => p.fieldId === field.fieldId
                );

                return (
                  <div
                    key={field.fieldId}
                    className="border-2 border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-lg text-slate-900">
                          {field.fieldName}
                        </div>

                        <div className="text-sm text-slate-600">
                          {field.areaM2}m² • {field.soilType}
                        </div>
                      </div>

                      <Wheat className="w-6 h-6 text-amber-600" />
                    </div>

                    {fieldPlantings.length > 0 ? (
                      <div className="space-y-2">
                        {fieldPlantings.map((planting) => (
                          <div
                            key={planting.cropPlantingId}
                            className="bg-slate-50 p-2 rounded text-sm"
                          >
                            <div className="font-medium text-slate-900">
                              {planting.crop?.commonName}
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <span className="text-slate-600">
                                {new Date(planting.plantedDate).toLocaleDateString()}
                              </span>

                              <Badge
                                variant="outline"
                                className={`text-xs ${getStatusColor(planting.cropStatus)}`}
                              >
                                {planting.cropStatus.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600 italic">
                        No active plantings
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ACTIVE CROPS / PLANTINGS */}
      {plantings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Crop Plantings</CardTitle>

            <CardDescription>
              {plantings.filter((p) => p.cropStatus !== "harvested" && p.cropStatus !== "failed").length}{" "}
              growing • {plantings.filter((p) => p.cropStatus === "ready_to_harvest").length} ready
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plantings
                .filter((p) => p.cropStatus !== "harvested" && p.cropStatus !== "failed")
                .map((planting) => {
                  const plantingAge = Math.floor(
                    (Date.now() - new Date(planting.plantedDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );

                  const expectedDays = planting.crop?.growthDurationDays || 0;
                  const progressPercent = expectedDays > 0 ? (plantingAge / expectedDays) * 100 : 0;

                  return (
                    <div
                      key={planting.cropPlantingId}
                      className={`border-2 rounded-lg p-4 ${
                        getStatusColor(planting.cropStatus).split(" ")[0] ===
                        "bg-green-50"
                          ? "border-green-200"
                          : getStatusColor(planting.cropStatus).split(" ")[0] ===
                              "bg-yellow-50"
                            ? "border-yellow-200"
                            : "border-blue-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-bold text-lg text-slate-900">
                            {planting.crop?.commonName}
                          </div>

                          <div className="text-sm text-slate-600">
                            {planting.field?.fieldName}
                          </div>
                        </div>

                        <Sprout className="w-6 h-6 text-green-600" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Status</span>

                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(planting.cropStatus)}`}
                          >
                            {planting.cropStatus.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Planted</span>

                          <span className="font-medium text-slate-900">
                            {new Date(planting.plantedDate).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Age</span>

                          <span className="font-medium text-slate-900">
                            {plantingAge} days
                          </span>
                        </div>

                        {expectedDays > 0 && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">
                                Expected Harvest
                              </span>

                              <span className="font-medium text-slate-900 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(planting.expectedHarvestDate).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-600">Growth Progress</span>

                                <span className="font-medium">
                                  {Math.min(Math.round(progressPercent), 100)}%
                                </span>
                              </div>

                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(progressPercent, 100)}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DEVICES STATUS */}
      {devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>

            <CardDescription>
              {devices.filter((d) => d.status === "online").length} online •{" "}
              {devices.filter((d) => d.status === "offline").length} offline •{" "}
              {devices.filter((d) => d.status === "maintenance").length} maintenance
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.deviceId}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {device.deviceName}
                    </div>

                    <div className="text-sm text-slate-600">
                      {device.deviceType} • {device.location}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        device.status === "online"
                          ? "bg-green-500"
                          : device.status === "maintenance"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    ></div>

                    <span className="text-sm font-medium capitalize text-slate-700">
                      {device.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* LIVE STATUS CARD */}
      <div className="fixed right-4 bottom-4 z-50">
        {!isMinimized ? (
          <Card className="border-l-4 border-l-green-500 w-80 shadow-lg relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Zone Status</span>

                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-slate-500 hover:text-yellow-500 text-xl"
                >
                  ✕
                </button>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  Zone: {currentZone?.zoneName}
                </li>

                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                  Fields: {fields.length}
                </li>

                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-amber-500 rounded-full"></span>
                  Plantings: {plantings.length}
                </li>

                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-purple-500 rounded-full"></span>
                  Online Devices: {devices.filter((d) => d.status === "online").length}
                </li>

                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live sync: Every 30 seconds
                </li>
              </ul>
            </CardContent>
          </Card>
        ) : (
          <div
            onClick={() => setIsMinimized(false)}
            className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition"
          >
            Zone Status
          </div>
        )}
      </div>

      {/* FOOTER */}
      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>

            <span>
              Live data via IoT sensor network • Auto-refresh every 30 seconds • Zone-scoped
              monitoring
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}