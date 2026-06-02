import { useEffect, useState } from "react";

type Chicken = {
    rfid: string;
    chickenName: string;
}

function EggsLaidForm() {
    const [chickens, setChickens] = useState<Chicken[]>([]);
    const [rfid, setRfid] = useState("");
    const [recordedAt, setRecordedAt] = useState("");
    const [eggCount, setEggCount] = useState<number | "">("");
    const [errors, setErrors] = useState<{ rfid?: string; recordedAt?: string; eggCount?: string }>({});

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
        const newErrors: { rfid?: string; recordedAt?: string; eggCount?: string } = {};

        if (!rfid) newErrors.rfid = "Please select a chicken.";
        if (!recordedAt) newErrors.recordedAt = "Please enter a date.";
        else if (new Date(recordedAt) > new Date()) newErrors.recordedAt = "Date cannot be in the future.";
        if (eggCount === "" || eggCount < 0)
            newErrors.eggCount = eggCount === "" ? "Please enter the number of eggs." : "Eggs laid cannot be negative.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!valid()) return;

        try{
            const res = await fetch(`/api/addChickenEgg`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    rfid: rfid,
                    recordedAt,
                    eggCount
                })
            });
            const data = await res.json();
            console.log("Egg log added:", data);
        }catch(error){
            console.error("Error logging eggs:", error);
        }
        setRfid("");
        setRecordedAt("");
        setEggCount("");
    };

    return (
        <form id="log-eggs-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="log-chicken-name">Name:</label>
            <select className={errors.rfid ? "errorBorder" : ""} name="log-chicken-name" id="log-chicken-name" value={rfid} onChange={(e) => setRfid(e.target.value)}>
                <option value="" disabled>Select a chicken</option>
                {chickens.map((chicken) => (
                    <option key={chicken.rfid} value={chicken.rfid}>{chicken.chickenName}</option>
                ))}
            </select>
            {errors.rfid && <span className="formError">{errors.rfid}</span>}

            <label htmlFor="log-date-laid">Date Laid:</label>
            <input className={errors.recordedAt ? "errorBorder" : ""} type="datetime-local" name="log-date-laid" id="log-date-laid" value={recordedAt} onChange={(e) => setRecordedAt(e.target.value)}/>
            {errors.recordedAt && <span className="formError">{errors.recordedAt}</span>}

            <label htmlFor="chicken-eggs">Eggs Laid:</label>
            <input className={errors.eggCount ? "errorBorder" : ""} type="number" id="chicken-eggs" name="chicken-eggs" min={0} value={eggCount} onChange={(e) => setEggCount(e.target.value === "" ? "" : Number(e.target.value))}/>
            {errors.eggCount && <span className="formError">{errors.eggCount}</span>}

            <button className="chickenButton" type="submit">Log Eggs</button>
        </form>
    );
}

export default EggsLaidForm;
