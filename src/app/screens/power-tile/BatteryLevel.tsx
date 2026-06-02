import { useState, useEffect } from "react";

// 1. Hook for the single current battery level percentage
export function BatteryStatus() {
    const [batteryLevel, setBatteryLevel] = useState<number>(0);

    useEffect(() => {
        const fetchBatteryLevel = async () => {
            try {
                const res = await fetch(`api/batteryLevel`);
                const data = await res.json();
                if (data && data.length > 0) {
                    setBatteryLevel(data[0].batteryLevelPercent);
                }
            } catch (error) {
                console.error("Error fetching battery level data:", error);
            }
        };

        fetchBatteryLevel(); // Fetch immediately
        const interval = setInterval(fetchBatteryLevel, 30000); // Refresh every 30s

        return () => clearInterval(interval); // Cleanup timer
    }, []);

    return batteryLevel;
}

// 2. Shape for the graph data
export interface BatteryData {
    time: string;
    level: number;
}

// 3. Hook for the 10-minute interval graph data
export const useBatteryData = (batteryId: string | number) => {
    const [batteryLevelData, setChartData] = useState<BatteryData[]>([]);
    const [isBatteryLoading, setIsBatteryLoading] = useState<boolean>(true);
    const [batteryError, setBatteryError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // No need to set loading to true every time, 
                // so the graph doesn't flicker/disappear on every refresh
                const response = await fetch(`api/batteryLevel-everyTenMinutes?id=${batteryId}`);
                
                if (!response.ok) {
                    throw new Error(`Server Error: ${response.status}`);
                }

                const results = await response.json();

                const formatted = results.map((row: any) => ({
                    time: new Date(row.intervalTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }),
                    level: Math.round(parseFloat(row.avgLevel) * 10) / 10 
                }));

                setChartData(formatted);
                setBatteryError(null);
            } catch (err: any) {
                setBatteryError(err.message);
                console.error("Fetch failed:", err);
            } finally {
                setIsBatteryLoading(false);
            }
        };

        if (batteryId) {
            fetchData(); // Initial fetch
            const interval = setInterval(fetchData, 30000); // Refresh every 30s
            
            return () => clearInterval(interval); // Cleanup timer
        }
    }, [batteryId]);

    // Renamed loading/error here to avoid conflicts in your frontend file
    return { batteryLevelData, isBatteryLoading, batteryError };
};

export default BatteryStatus;