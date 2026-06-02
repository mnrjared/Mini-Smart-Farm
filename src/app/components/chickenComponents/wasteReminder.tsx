import { useEffect, useState } from "react";

interface WasteReminderProps  {
    date: string;
    period: number;
    setDate: (value: string) => void;
    setPeriod: (value: number) => void;
    coopId: number;
    coopName: string;
}

function updateWasteReminder(coopId: number, reminderDate: string, reminderPeriod: number) {
    //console.log("Making API call to:", `/updateCleaningTimes`);
    //console.log("With data:", { reminderDate, reminderPeriod, coopId });

    /* Database call to update waste reminder for the coop with the given coopId */
    fetch("/api/updateCleaningTimes", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ reminderDate, reminderPeriod, coopId }),
    })
    .then(response => {
        //console.log("Response status:", response.status);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Success:", data);
    })
    .catch(error => {
        console.error("Error updating waste reminder:", error);
    });
}

function wasteReminder({ date, period, setDate, setPeriod, coopId, coopName }: WasteReminderProps){
    //console.log("WasteReminder component rendered with date:", date, "and period:", period);
    const [reminderTime, setReminderTime] = useState("");
    const [reminderPeriod, setReminderPeriod] = useState<number | "">(0);
    const [reminderDate, setReminderDate] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<{ reminderTime?: string; reminderPeriod?: string; reminderDate?: string }>({});

    const parseDbDate = (value: string) => {
        if (!value) return { date: "", time: "" };

        const trimmed = value.trim();
        const isUtcIso = trimmed.endsWith("Z");
        const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");

        if (isUtcIso) {
            const utcDate = new Date(normalized);
            return {
                date: utcDate.toISOString().split("T")[0],
                time: utcDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
            };
        }

        const [datePart, timePart] = normalized.split("T");
        return {
            date: datePart || "",
            time: timePart?.substring(0, 5) || "",
        };
    };

    const { date: reminderDateValue, time: reminderTimeValue } = parseDbDate(date);


    const valid = (): { reminderTime?: string; reminderPeriod?: string; reminderDate?: string } => {
        const newErrors: { reminderTime?: string; reminderPeriod?: string; reminderDate?: string } = {};
        if (reminderTime === "") newErrors.reminderTime = "Please enter a reminder time.";
        else if (new Date(`${reminderDate}T${reminderTime}`) < new Date()) newErrors.reminderTime = "Reminder time cannot be in the past.";
        if (reminderPeriod === "" || reminderPeriod <= 0)
            newErrors.reminderPeriod = reminderPeriod === "" ? "Please enter a reminder period." : "Reminder period must be greater than 0.";
        if (reminderDate === "") newErrors.reminderDate = "Please enter a reminder date.";
            else if (new Date(reminderDate) < new Date()) newErrors.reminderDate = "Reminder date cannot be in the past.";
        return newErrors;
    };

    useEffect(() => {
        if (!submitted) return;
        setErrors(valid());
    }, [reminderTime, reminderPeriod, reminderDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        const validationErrors = valid();
        
        if (Object.keys(validationErrors).length > 0) 
            {
                setErrors(validationErrors);
            }
        else{

        /* Enter data into database here */
            let newDate = `${reminderDate} ${reminderTime}:00`;
            
            setDate(newDate);
            console.log("Setting reminder date to:", newDate);
            setPeriod(parseInt(reminderPeriod.toString()));
            //let tempdate =`${reminderDate} ${reminderTime}:00`;
            //console.log(tempdate);
            
            updateWasteReminder(coopId, newDate, reminderPeriod as number);
            setReminderDate("");
            setReminderTime("");
            setReminderPeriod("");
            setErrors({});
            setSubmitted(false);
        };

    }

    const handleBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    if ((e.relatedTarget as HTMLElement)?.id === "reminder-button") return;
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setReminderDate("");
            setReminderTime("");
            setReminderPeriod("");
            setErrors({});
            setSubmitted(false);
        }
    }; 
    const temptime = reminderTimeValue;
    const collectionDate = reminderDateValue;
    return(
        <section id = "reminder">
                    <p className = "coop-text">Daily Reminder</p>
                    <hr className="coop-hr"/>
                    
                    <p id="collection">Clean {coopName} coop every {period} days. Next clean: {collectionDate} {temptime}</p>
                    <hr className="coop-hr"/>
                    
                    <form id="reminder-form" onSubmit={handleSubmit} onBlur={handleBlur} noValidate>
                        <label htmlFor="reminder-time" >Set Reminder Time:</label>
                        <section>
                            <input type="date" name="reminder-date" id="reminder-date"    
                            onChange={(e)=> {setReminderDate(e.target.value === "" ? "" : e.target.value);}} 
                            className={errors.reminderDate ? "errorBorder" : ""}  
                            value={reminderDate} required/>
                            {errors.reminderDate && <span className="formError">{errors.reminderDate}</span>}

                            <input type="time" name="reminder-time" id="reminder-time" 
                            onChange={(e)=> {setReminderTime(e.target.value === "" ? "" : e.target.value);}}
                            className={errors.reminderTime ? "errorBorder" : ""} 
                            value={reminderTime} required/>
                            {errors.reminderTime && <span className="formError">{errors.reminderTime}</span>}
                        </section>
                        <label htmlFor="reminder-period" >Set Reminder Period Days:</label>
                        <input type="number" name="reminder-period" id="reminder-period" 
                            onChange={(e)=> {setReminderPeriod(e.target.value === "" ? "" : parseInt(e.target.value));}}
                            className={errors.reminderPeriod ? "errorBorder" : ""} 
                            value={reminderPeriod} required/>
                        {errors.reminderPeriod && <span className="formError">{errors.reminderPeriod}</span>}
                        <button id="reminder-button" type="submit">Set Reminder</button>
                    </form>
        </section>
    )
}

export default wasteReminder;