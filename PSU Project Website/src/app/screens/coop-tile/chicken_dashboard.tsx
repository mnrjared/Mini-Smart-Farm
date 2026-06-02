import "../../../styles/chickenCss/chicken_dashboard.css";
import ChickenKPI from "../../components/chickenComponents/chickenKPI";
import GraphContainer from "../../components/chickenComponents/graphContainer";
import { useEffect, useState } from "react";
import EggChart from "../../components/chickenComponents/EggChart";
import PredatorChart from "../../components/chickenComponents/PredatorChart";
import MovementChart from "../../components/chickenComponents/MovementChart";

function Chicken_dashboard() {
    const[videoOn, setVideoOn] = useState(false);
    const [data, setData] = useState({
        chickens: 0,
        weeklyEggs: 0,
        predatorIncidents: 0,
        movement: 0
    });

    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetch("/api/dashboard")
            .then(res => res.json())
            .then(data => {
                console.log("API DATA:", data);
                setData(data);
            })
            .catch(err => console.error(err));
    }, []);

    
    const handleExport = async () => {
        try {
            const res = await fetch("/api/eggs");
            const data = await res.json();

            const csv = [
                ["Date", "Eggs"],
                ...data.map((item: any) => [item.date, item.eggs])
            ]
            .map(row => row.join(","))
            .join("\n");

            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "egg_data.csv";
            a.click();

            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error(err);
        }
    };

   
    const handleClear = async () => {
        try {
            await fetch("/api/clear", {
                method: "DELETE"
            });

            alert("Data cleared successfully");

            setData({
                chickens: 0,
                weeklyEggs: 0,
                predatorIncidents: 0,
                movement: 0
            });

        } catch (err) {
            console.error(err);
        }
    };

    return (
        <main className="chicken-dashboard main-content">
            <h1>Data Analysis Dashboard</h1>

            <section id="coop-summary">
                <ChickenKPI text="Total Chickens" kpiValue={data.chickens}/>
                <ChickenKPI text="This Week's Egg Production:" kpiValue={data.weeklyEggs}/>
                <ChickenKPI text="Predator Incidents:" kpiValue={data.predatorIncidents}/>
                <ChickenKPI text="Movement Events:" kpiValue={data.movement}/>
            </section>

            <section id="Chicken-Video-Container">
                <button id="Chicken-Video-Button" onClick={() => setVideoOn(!videoOn)}>
                    {videoOn ? "Hide Video" : "Show Video"}
                </button>
                {videoOn && (
                    <img id="Chicken-Video" src="/api/chickenAiStream" alt="Stream Down" />
                )}
            </section>

            <section id="chart-container" style={{ marginBottom: "40px" }}>
                <GraphContainer 
                    containerID="egg-production" 
                    title="Egg Production Over Time" 
                    child={<EggChart />} 
                    chartID="egg-production-chart"
                />

                <GraphContainer 
                    containerID="predator" 
                    title="Predator Incidents Over Time" 
                    child={<PredatorChart />} 
                    chartID="predator-chart"
                />

                <GraphContainer 
                    containerID="movement" 
                    title="Chicken Movement Over Time" 
                    child={<MovementChart />} 
                    chartID="movement-chart"
                />
            </section>

          
            <section id="export" style={{ marginTop: "40px" }}>
                <h2>Data Management</h2>
                <hr className="graph-hr"/>

                <section id="export-buttons">
                    <button className="data export" onClick={handleExport}>
                        Export Data as CSV
                    </button>

                    <button className="data delete" onClick={() => setShowModal(true)}>
                        Clear All Data
                    </button>
                </section>
            </section>

           
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Are you sure?</h3>
                        <p>This will delete all data permanently.</p>

                        <div className="modal-buttons">
                            <button 
                                className="data delete"
                                onClick={() => {
                                    handleClear();
                                    setShowModal(false);
                                }}
                            >
                                Yes, Delete
                            </button>

                           <button 
                            className="data cancel"
                            onClick={() => setShowModal(false)}
                        >
                            Cancel
                        </button>
                        </div>
                    </div>
                </div>
            )}

        </main>
    );
}

export default Chicken_dashboard;