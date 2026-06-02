/*
CREATE TABLE animalHealthLogs (
    animalHealthLogId INT AUTO_INCREMENT PRIMARY KEY,
    rfid              VARCHAR(100),
    observation       TEXT NOT NULL,
    actionTaken       TEXT,
    recordedAt        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_healthlogs_rfid FOREIGN KEY (rfid) REFERENCES chickens(rfid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/
import { useEffect, useState } from "react";

type Chicken = {
    rfid: string;
    chickenName: string;
}

function ChickenHealth() {
    const [chickens, setChickens] = useState<Chicken[]>([]);
    const [rfid, setRfid] =useState("")
    const [observation, setObservation] = useState("")
    const [action, setAction] = useState("")
    const [errors, setErrors] = useState<{rfid?: string; observation?: string; action?: string}>({})

     useEffect(() => {
        const fetchChickenNames = async () => {
            try {
                const res = await fetch(`/api/getChickenNames`);
                const data = await res.json();
                setChickens(data)
            }catch(error){
                console.error("Error fetching chicken names:", error);
            }
        };
        fetchChickenNames();
    },[]);


    const valid = (): boolean => {
        const newErrors : {rfid?: string; observation?: string; action?: string} = {}

        if (!rfid || rfid.length != 10) newErrors.rfid = "Please select a chicken.";
        if (!action || action.length < 3) newErrors.action = "Please state the action taken.";
        if (!observation || observation.length < 3) newErrors.observation = "Please state the action taken.";
        setErrors(newErrors);
        return Object.keys(newErrors).length == 0;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!valid()) return;
        const date = new Date().toISOString().replace("T"," ").substring(0,19);
        try{
            const res = await fetch(`/api/addHealthLog`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    rfid: rfid,
                    observation,
                    action,
                    date
                })
            });
            const data = await res.json();
            console.log("Health problem log added:", data);
        }
        catch (error) {
            console.error("Error lgging health problem:", error)
        }
        setAction("")
        setObservation("")
        setRfid("")
    }

    return(
        <form id="log-health-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="log-chicken-name">Name:</label>
            <select className={errors.rfid ? "errorBorder" : ""} name="log-chicken-name" id="log-chicken-name" value={rfid} onChange={(e) => setRfid(e.target.value)}>
                <option value="" disabled>Select a chicken</option>
                {chickens.map((chicken) => (
                    <option key={chicken.rfid} value={chicken.rfid}>{chicken.chickenName}</option>
                ))}
            </select>
            {errors.rfid && <span className="formError">{errors.rfid}</span>}

            <label htmlFor="log-date-laid">Health or Abnormal Health Observation:</label>
            <textarea className={errors.observation ? "errorBorder" : ""}  name="log-observation" id="log-observation" 
            value={observation} onChange={(e) => setObservation(e.target.value)}/>
            {errors.observation && <span className="formError">{errors.observation}</span>}

            <label htmlFor="chicken-eggs">Eggs Laid:</label>
            <textarea className={errors.action ? "errorBorder" : ""} id="action_taken" name="action-taken"
             value={action} onChange={(e) => setAction(e.target.value)}/>
            {errors.action && <span className="formError">{errors.action}</span>}

            <button className="chickenButton" type="submit">Log Health Check</button>
        </form>
    );
}
export default ChickenHealth;

