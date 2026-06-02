import { useState, useEffect } from "react";

export function LightLevelPercentage()
{
    const [lightLevel, setLightLevel] = useState<number>(0);

        useEffect(() => {
        const fetchLightLevel = async () => {
            try {
                const res = await fetch(`api/lightLevel`);
                const data = await res.json();
                setLightLevel(data[0].lightLevel);
            } catch (error) {
                console.error("Error fetching light level data:", error);
            }
        };
        fetchLightLevel();
    }, []);

    return lightLevel
}

export default LightLevelPercentage;