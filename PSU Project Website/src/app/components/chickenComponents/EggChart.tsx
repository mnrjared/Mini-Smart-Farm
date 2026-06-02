import { useEffect, useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    CartesianGrid, ResponsiveContainer
} from "recharts";

type EggData = {
    date: string;
    eggs: number;
};

function EggChart() {
    const [data, setData] = useState<EggData[]>([]);

    useEffect(() => {
        fetch("/api/eggs")
            .then(res => res.json())
            .then((rawData: EggData[]) => {

                const formattedData = rawData.map(item => ({
                    ...item,
                    date: new Date(item.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    })
                }));

                setData(formattedData);
            })
            .catch(err => console.error(err));
    }, []);

    return (
        <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid stroke="#2c2c2c" />
                    <XAxis dataKey="date" 
                        stroke="#aaa"
                        angle={-30}
                        textAnchor="end"
                        height={70} 
                        />
                    <YAxis stroke="#aaa" domain={[0, 200]}/>
                    <Tooltip />
                    <Line 
                   
                    dataKey="eggs"
                    stroke="#4CAF50"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                    isAnimationActive={true}
                    animationDuration={800}
                />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default EggChart;