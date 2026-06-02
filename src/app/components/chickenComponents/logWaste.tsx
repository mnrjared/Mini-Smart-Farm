import { useEffect, useState } from "react";

interface LogWasteProps {
    coopId: number;
    period: number;
    reminderDate: string;
    setReminderDate: (value: string) => void;
}

function newCleaningLog(coopId: number, lastCleaned: string, nextCleanDue: string, weightKg: number, notes: string, period: number) {
    /* Database call to log waste collection for the coop with the given coopId */

    ///import.meta.env.VITE_API_BASE_URL
    fetch("/api/addCleaningLog", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        
        body: JSON.stringify({ coopId, lastCleaned, nextCleanDue, weightKg, notes }),
    })
    .then(response => response.json()) // always parse the body
    .catch(err => {
        console.error("Fetch error:", err);
    });
    ///import.meta.env.VITE_API_BASE_URL

    fetch(`/api/updateCleaningTimes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderDate: nextCleanDue, reminderPeriod: period, coopId }),
    })  
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error("Error updating cleaning times:", error);
    });    
}

function logWaste({ coopId, period, reminderDate, setReminderDate }: LogWasteProps){
     const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [quantity, setQuantity] = useState<number | "">(0);
    const [notes, setNotes] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<{ date?: string; quantity?: string}>({});


    const valid = (): { date?: string; quantity?: string} => {
        const newErrors: { date?: string; quantity?: string} = {};
        if (date === "") newErrors.date = "Please enter a date.";
            else if (new Date(date) > new Date()) newErrors.date = "Date cannot be in the future.";

        if (quantity === "" || typeof quantity === "string") newErrors.quantity = "Please enter a valid quantity.";
        else if (quantity <= 0) newErrors.quantity = "Quantity must be a positive number.";
        return newErrors;
    };

    useEffect(() => {
        if (!submitted) return;
        setErrors(valid());
    }, [date, quantity]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        const validationErrors = valid();
        if (Object.keys(validationErrors).length > 0) 
            {
                setErrors(validationErrors);
            }
        else{
            let nextCleanDue = new Date(`${date}T${reminderDate.split("T")[1] || "00:00"}`);
            nextCleanDue.setDate(nextCleanDue.getDate() + period);

            let nextDate = nextCleanDue.toLocaleDateString('sv-SE').split("T")[0]+ 
            ` ${nextCleanDue.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
            let collectionDate = new Date(`${date}T${nextCleanDue.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`).toLocaleDateString('sv-SE').split("T")[0]+ ` ${reminderDate.split("T")[1] || "00:00"}`;

            nextDate = nextDate.substring(0, 19);
            collectionDate = collectionDate.substring(0, 19);

            console.log("Logging new cleaning with data:", { coopId, lastCleaned: collectionDate, 
            nextCleanDue: nextDate, weightKg: quantity, notes });
            newCleaningLog(coopId, collectionDate, nextDate, Number(quantity), notes, period);
            setReminderDate(nextDate);
            setDate(new Date().toISOString().split("T")[0]);
            setQuantity(0);
            setErrors({});
            setSubmitted(false);
        };
    }

    const handleBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    if ((e.relatedTarget as HTMLElement)?.id === "log-poop-button") return;
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDate(new Date().toISOString().split("T")[0]);
            setQuantity(0);
            setErrors({});
            setSubmitted(false);
        }
    }

    return(
        <form id = "poop-form" onSubmit={handleSubmit} onBlur={handleBlur} noValidate>
            <hr id="waste-hr"/>
                    <label htmlFor="collect-date">Date Collected:</label>
                    <input type="date" name="collect-date" id="collect-date" value={date} onChange={(e) => setDate(e.target.value)}
                    className={errors.date ? "errorBorder" : ""} required/>
                    {errors.date && <span className="formError">{errors.date}</span>}

                    <label htmlFor="quantity">Quantity Collected (kg):</label>
                    <input type="number" name="quantity" id="quantity" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className={errors.quantity ? "errorBorder" : ""} required/>
                    {errors.quantity && <span className="formError">{errors.quantity}</span>}

                    <label htmlFor="notes">Notes:</label>
                    <textarea name="notes" id="notes" rows={4} placeholder="Additional details about the collection..."
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                    <button type="submit" id = "log-poop-button">Log Collection</button>

        </form>
    )
}
export default logWaste;