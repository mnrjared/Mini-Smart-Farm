import { useState, useEffect } from 'react';

// Define what a single data point looks like
export interface PowerDataPoint {
  time: string;
  power: number;
}

export const useSolarPower = () => {
  const [chartData, setChartData] = useState<PowerDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

useEffect(() => {
    const fetchData = () => {
      fetch('api/solar-hourly')
        .then((res) => res.json())
        .then((data) => {
          // Safety Check: Ensure 'data' is actually an array
          if (!Array.isArray(data)) {
            console.error("API did not return an array:", data);
            return;
          }

          const formatted = data.map((item: any) => {
            // 1. Safe Date Parsing
            const dateObj = new Date(item.hour_bucket);
            const timeLabel = isNaN(dateObj.getTime()) 
              ? "00:00" // Fallback if date is broken
              : dateObj.toLocaleTimeString('en-ZA', {
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: false
                });

            // 2. Safe Power Parsing (Prevents .toFixed crashes)
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
          console.error("Connection Error:", err);
          setLoading(false);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { chartData, loading };
};

export const powerOutFunction = () => {
  const [powerOutChartData, setChartData] = useState<PowerDataPoint[]>([]);
  const [powerOutLoading, setLoading] = useState<boolean>(true);

useEffect(() => {
    const fetchData = () => {
      fetch('api/power-out')
        .then((res) => res.json())
        .then((data) => {
          // Safety Check: Ensure 'data' is actually an array
          if (!Array.isArray(data)) {
            console.error("API did not return an array:", data);
            return;
          }

          const formatted = data.map((item: any) => {
            // 1. Safe Date Parsing
            const dateObj = new Date(item.per_hour);
            const timeLabel = isNaN(dateObj.getTime()) 
              ? "00:00" // Fallback if date is broken
              : dateObj.toLocaleTimeString('en-ZA', {
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: false
                });

            // 2. Safe Power Parsing (Prevents .toFixed crashes)
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

export interface ZonePowerData {
    zoneName: string;
    totalPower: number;
    percentage: number; // Added to store calculated percentage
}

export const useZonePower = (refreshInterval = 30000) => {
    const [rawData, setRawData] = useState<ZonePowerData[]>([]);
    const [energyDistributionloading, setLoading] = useState<boolean>(true);

    const getPowerData = async () => {
        try {
            const response = await fetch('api/zone-power-usage');
            const data = await response.json();
            
            // 1. First, parse all incoming data to ensure we have numbers
            const parsedData = data.map((item: any) => ({
                zoneName: item.zoneName,
                totalPower: Number(item.totalPower)
            }));

            // 2. Calculate the Grand Total of ALL power usage combined
            const grandTotal = parsedData.reduce((acc: number, curr: any) => acc + curr.totalPower, 0);

            // 3. Map the data again to include the true percentage
            const cleanData: ZonePowerData[] = parsedData.map((item: any) => ({
                ...item,
                // If grandTotal is 0, percentage is 0 to avoid Division by Zero
                percentage: grandTotal > 0 ? (item.totalPower / grandTotal) * 100 : 0
            }));

            setRawData(cleanData);
        } catch (error) {
            console.error("Error fetching power data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getPowerData();
        const interval = setInterval(() => {
            getPowerData();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval]);

    return { rawData, energyDistributionloading };
};

export default useZonePower;

