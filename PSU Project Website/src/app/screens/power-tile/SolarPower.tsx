// ============================================================
// SolarPower.tsx
// ------------------------------------------------------------
// This file contains THREE custom React hooks and one shared
// TypeScript interface for power chart data. Each hook polls a
// local backend API every 30 seconds (or configurable interval)
// and returns formatted data arrays ready to feed into Recharts
// line/pie charts in PowerGeneration.tsx.
//
// Hooks exported:
//   useSolarPower()   — hourly solar input (Power In)
//   powerOutFunction() — hourly consumption (Power Out)
//   useZonePower()    — per-zone power breakdown (pie chart)
// ============================================================

import { useState, useEffect } from 'react';

// Shared shape for a single point on the Power In / Power Out line charts.
// "time" is a display-friendly HH:mm string; "power" is in Wh.
export interface PowerDataPoint {
  time: string;
  power: number;
}

// ============================================================
// useSolarPower — Power In (solar generation)
// ============================================================
// Fetches hourly-averaged solar generation readings from the
// local Flask/Express backend at /api/solar-hourly.
// Returns the formatted array and a loading boolean.
export const useSolarPower = () => {
  const [chartData, setChartData] = useState<PowerDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = () => {
      // ⚠️  POTENTIAL PROBLEM: The API URL is hardcoded to localhost:5000.
      // This only works when the backend is running on the same machine
      // as the browser. On any other device on the network (phone, tablet,
      // another PC) these fetches will fail silently. Consider using a
      // relative URL (e.g. '/api/solar-hourly') or an environment variable
      // (e.g. process.env.REACT_APP_API_URL) to make deployment flexible.
      fetch('http://localhost:5000/api/solar-hourly')
        .then((res) => res.json())
        .then((data) => {
          // Safety check: the API should return an array.
          // If it returns an error object instead, bail out early.
          if (!Array.isArray(data)) {
            console.error("API did not return an array:", data);
            return;
          }

          const formatted = data.map((item: any) => {
            // --- Time label ---
            // item.hour_bucket is expected to be an ISO 8601 date string.
            // If it's invalid, we fall back to "00:00" to prevent a crash.
            const dateObj = new Date(item.hour_bucket);
            const timeLabel = isNaN(dateObj.getTime()) 
              ? "00:00"
              : dateObj.toLocaleTimeString('en-ZA', {
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: false
                });

            // --- Power value ---
            // item.avg_power comes from the DB as a string (common with
            // some SQL drivers), so parseFloat() converts it first.
            // If it's not a valid number, default to 0.
            const rawValue = parseFloat(item.avg_power);
            const powerValue = isNaN(rawValue) ? 0 : parseFloat(rawValue.toFixed(2));

            return {
              time: timeLabel,
              power: powerValue
            };
          });

          setChartData(formatted);
          setLoading(false);
        })
        .catch(err => {
          // Network error (backend down, CORS issue, etc.)
          // loading is set to false so the UI doesn't spin forever.
          console.error("Connection Error:", err);
          setLoading(false);
          // ⚠️  POTENTIAL PROBLEM: chartData is left as [] on error.
          // The chart will render as empty with no user-facing error
          // message. Consider adding an error state and showing a
          // "Could not load data" message in the chart area.
        });
    };

    fetchData();
    // Re-fetch every 30 seconds to keep the chart up to date
    const interval = setInterval(fetchData, 30000);
    // Cleanup: cancel the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  return { chartData, loading };
};

// ============================================================
// powerOutFunction — Power Out (consumption)
// ============================================================
// Mirrors useSolarPower() but reads from /api/power-out and
// maps different field names (per_hour, average_power).
//
// ⚠️  POTENTIAL PROBLEM: This is named powerOutFunction instead
// of usePowerOut. React's rules of hooks require custom hooks to
// start with "use" (e.g. usePowerOut). Naming it without "use"
// means React's linter/plugin won't treat it as a hook, which
// can suppress helpful warnings (e.g. calling it inside a
// condition). Rename it to usePowerOut for correctness.
export const powerOutFunction = () => {
  const [powerOutChartData, setChartData] = useState<PowerDataPoint[]>([]);
  const [powerOutLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = () => {
      // Same localhost hardcoding issue as useSolarPower above
      fetch('http://localhost:5000/api/power-out')
        .then((res) => res.json())
        .then((data) => {
          if (!Array.isArray(data)) {
            console.error("API did not return an array:", data);
            return;
          }

          const formatted = data.map((item: any) => {
            // Note: different field names from the solar endpoint —
            // per_hour (not hour_bucket) and average_power (not avg_power)
            const dateObj = new Date(item.per_hour);
            const timeLabel = isNaN(dateObj.getTime()) 
              ? "00:00"
              : dateObj.toLocaleTimeString('en-ZA', {
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: false
                });

            const rawValue = parseFloat(item.average_power);
            const powerValue = isNaN(rawValue) ? 0 : parseFloat(rawValue.toFixed(2));

            return {
              time: timeLabel,
              power: powerValue
            };
          });

          setChartData(formatted);
          setLoading(false);
        })
        .catch(err => {
          console.error("Connection Error:", err);
          setLoading(false);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { powerOutChartData, powerOutLoading };
};

// ============================================================
// ZonePowerData — shape for one row of zone data
// ============================================================
// Used both inside useZonePower and exported for PowerWarnings.ts
export interface ZonePowerData {
    zoneName: string;
    totalPower: number;
    percentage: number; // Pre-calculated share of the grand total (0–100)
}

// ============================================================
// useZonePower — per-zone energy distribution (pie chart)
// ============================================================
// Fetches raw zone power totals, calculates what percentage of
// total consumption each zone accounts for, and returns the
// cleaned array. Used to populate the Energy Distribution pie
// chart and passed to generatePowerWarnings().
//
// refreshInterval defaults to 30000ms but PowerGeneration.tsx
// calls it with 10000ms (10s) for a faster refresh rate on this
// particular dataset.
export const useZonePower = (refreshInterval = 30000) => {
    const [rawData, setRawData] = useState<ZonePowerData[]>([]);
    const [energyDistributionloading, setLoading] = useState<boolean>(true);
    // ⚠️  POTENTIAL PROBLEM: The loading variable name has a lowercase 'l'
    // in "loading" but the export is "energyDistributionloading" —
    // the inconsistent capitalisation (vs. "energyDistributionLoading")
    // could cause confusion. Minor but worth standardising.

    const getPowerData = async () => {
        try {
            // Same localhost hardcoding issue as the other two hooks
            const response = await fetch('http://localhost:5000/api/zone-power-usage');
            const data = await response.json();
            
            // Step 1: Coerce all totalPower values to numbers.
            // SQL drivers sometimes return numeric columns as strings.
            const parsedData = data.map((item: any) => ({
                zoneName: item.zoneName,
                totalPower: Number(item.totalPower)
            }));

            // Step 2: Sum all zones to get the grand total,
            // used to calculate each zone's percentage share.
            const grandTotal = parsedData.reduce((acc: number, curr: any) => acc + curr.totalPower, 0);

            // Step 3: Attach the percentage to each zone.
            // Guard against division by zero if all zones report 0.
            const cleanData: ZonePowerData[] = parsedData.map((item: any) => ({
                ...item,
                percentage: grandTotal > 0 ? (item.totalPower / grandTotal) * 100 : 0
            }));

            setRawData(cleanData);
        } catch (error) {
            // ⚠️  POTENTIAL PROBLEM: On error, rawData stays as the previous
            // value (stale data) rather than being cleared. Depending on the
            // use case this might be acceptable (showing last known state),
            // but it should be a deliberate choice. At minimum, log that
            // stale data is being displayed.
            console.error("Error fetching power data:", error);
        } finally {
            // Always clear the loading spinner, even on error
            setLoading(false);
        }
    };

    useEffect(() => {
        getPowerData();
        // ⚠️  POTENTIAL PROBLEM: refreshInterval is in the dependency array,
        // which is correct. But if the parent component passes a new number
        // on every render (e.g. an inline literal), the interval will be
        // torn down and recreated on every render. PowerGeneration.tsx passes
        // 10000 as a literal, which is fine — just be aware of this if the
        // call site changes to a variable.
        const interval = setInterval(() => {
            getPowerData();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval]);

    return { rawData, energyDistributionloading };
};

// Default export for convenience — allows `import useZonePower from './SolarPower'`
export default useZonePower;
