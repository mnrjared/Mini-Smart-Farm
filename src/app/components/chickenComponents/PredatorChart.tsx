import { useEffect, useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    CartesianGrid, ResponsiveContainer
} from "recharts";

type PredatorData = {
    date: string;
    count: number;
};

function PredatorChart() {
    const [data, setData] = useState<PredatorData[]>([]);

    useEffect(() => {
        const fetchData = () => {
            fetch("/api/predators")
                .then(res => res.json())
                .then((rawData: PredatorData[]) => {

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
        };

        fetchData();

        const interval = setInterval(fetchData, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ width: "100%", height: 400, marginBottom: "40px" }}>
            <ResponsiveContainer>
                <LineChart data={data}   margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid stroke="#2c2c2c" />
                    <XAxis  dataKey="date" 
                        stroke="#aaa"
                        angle={-30}
                        textAnchor="end"
                        height={70}
                         />
                    <YAxis stroke="#aaa" domain={[0, 'dataMax + 10']}  />
                    <Tooltip />
                    <Line 
                                              
                        type="monotone"
                        dataKey="count" 
                        stroke="#FF5722"
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

export default PredatorChart;