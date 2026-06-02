import { useState, useRef, useEffect } from "react";

interface UpdateCoopProps {
    coopId: number;
    zoneId: number;
    coopName: string;
    capacity: number;
    notes: string;
    doorOpen: string;
    doorClose: string;
    reminderDate: string;
    reminderPeriod: number;
    setSubmitted: (value: boolean) => void;
}

function UpdateCoop( coopId: string, zoneId: string, coopName: string, capacity: string, notes: string, doorOpen: string, doorClose: string, reminderDate: string, reminderPeriod: string ) {
    try{fetch(`/api/updateCoop/${coopId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            zoneId,
            coopName,
            capacity,
            notes,
            doorOpen,
            doorClose,
            reminderDate,
            reminderPeriod
        })
    });}
    catch(err){
        console.error("Network error:", err);
    }
}

function deleteCoop(coopId: number) {
    try{fetch(`/api/deleteCoop/${coopId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        }
    });}
    catch(err){
        console.error("Network error:", err);
    }

}

function parseReminderDateTime(value: string): { datePart: string; timePart: string } {
    const [rawDate = "", rawTime = ""] = value.trim().split(/[ T]/);
    const datePart = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : "";
    const timePart = /^\d{2}:\d{2}/.test(rawTime) ? rawTime.slice(0, 5) : "";

    return { datePart, timePart };
}
    

function UpdateCoopForm({coopId, zoneId, coopName, capacity, notes, doorOpen, doorClose, reminderDate, reminderPeriod, setSubmitted}: UpdateCoopProps) {
    const parsedReminder = parseReminderDateTime(reminderDate);
    const [errors, setErrors] = useState<{ coopName?: string; capacity?: string; notes?: string; doorOpen?: string; doorClose?: string; reminderDate?: string; reminderTime?: string; reminderPeriod?: string}>({});
    const [coopNameInput, setCoopNameInput] = useState(coopName);
    const [capacityInput, setCapacityInput] = useState<number | "">(capacity);
    const [notesInput, setNotesInput] = useState(notes);
    const [doorOpenInput, setDoorOpenInput] = useState(doorOpen);
    const [doorCloseInput, setDoorCloseInput] = useState(doorClose);
    const [reminderDateInput, setReminderDateInput] = useState(parsedReminder.datePart);
    const [reminderTimeInput, setReminderTimeInput] = useState(parsedReminder.timePart);
    const [reminderPeriodInput, setReminderPeriodInput] = useState<number | "">(reminderPeriod);
    const formRef = useRef<HTMLFormElement>(null);
    const clickedInsideRef = useRef(false);

    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            clickedInsideRef.current = !!(formRef.current && formRef.current.contains(e.target as Node));
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, []);
    
    const valid = ():boolean => {
        const newErrors: { coopName?: string; capacity?: string; notes?: string; doorOpen?: string; doorClose?: string; reminderDate?: string; reminderTime?: string; reminderPeriod?: string} = {};
        if (coopNameInput.length < 1) newErrors.coopName = "Please enter a coop name.";
        if (capacityInput <= 0 || typeof capacityInput === "string") newErrors.capacity = "Please enter a valid capacity.";
        if (doorOpenInput === "") newErrors.doorOpen = "Please enter a door open time.";
        if (doorCloseInput === "") newErrors.doorClose = "Please enter a door close time.";
        else if (doorOpenInput !== "" && new Date(`1970-01-01T${doorOpenInput}`) >= new Date(`1970-01-01T${doorCloseInput}`)) 
            newErrors.doorClose = "Door close time must be after door open time.";
        if (reminderDateInput === "") newErrors.reminderDate = "Please enter a reminder date.";
        if (reminderTimeInput === "") newErrors.reminderTime = "Please enter a reminder time.";
        if (reminderDateInput !== "" && reminderTimeInput !== "") {
            const reminderDateTime = new Date(`${reminderDateInput}T${reminderTimeInput}`);
            if (Number.isNaN(reminderDateTime.getTime())) {
                newErrors.reminderTime = "Please enter a valid reminder time.";
            } else if (reminderDateTime < new Date()) {
                newErrors.reminderTime = "Reminder time cannot be in the past.";
            }
        }
        if (reminderPeriodInput <= 0 || typeof reminderPeriodInput === "string") newErrors.reminderPeriod = "Reminder period must be a positive number.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }  
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (valid()) {
            const reminderDateTimeValue = `${reminderDateInput} ${reminderTimeInput}`;
            UpdateCoop(coopId.toLocaleString(), zoneId.toLocaleString(), coopNameInput, capacityInput.toLocaleString(), notesInput, doorOpenInput, doorCloseInput, reminderDateTimeValue, reminderPeriodInput.toLocaleString());
            alert("Coop updated successfully!");
            setSubmitted(true);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLFormElement>) => {
        if (clickedInsideRef.current) {
            clickedInsideRef.current = false;
            return;
        }
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setCoopNameInput(coopName);
            setCapacityInput(capacity);
            setNotesInput(notes);
            setDoorOpenInput(doorOpen);
            setDoorCloseInput(doorClose);
            setReminderDateInput(parsedReminder.datePart);
            setReminderTimeInput(parsedReminder.timePart);
            setReminderPeriodInput(reminderPeriod);
            setErrors({});
        }
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this coop? This action cannot be undone.")) {
            try{deleteCoop(coopId);
            alert("Coop deleted successfully!");        
                setSubmitted(true);
            }
            catch(err){
                console.error("Network error:", err);
            }
        }
    };

    return (
        <form ref={formRef} onSubmit={handleSubmit} onBlur={handleBlur} className="update-coop-form">
            <label htmlFor="coop-name">Coop Name:</label>
            <input type="text" id="coop-name" value={coopNameInput} onChange={(e) => setCoopNameInput(e.target.value)} placeholder="Coop Name" 
            className={errors.coopName ? "errorBorder" : ""}/>
            {errors.coopName && <span className="formError">{errors.coopName}</span>}
            <label htmlFor="capacity">Capacity:</label>
            <input type="number" id="capacity" value={capacityInput} onChange={(e) => setCapacityInput(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Capacity"
            className={errors.capacity ? "errorBorder" : ""}/>
            {errors.capacity && <span className="formError">{errors.capacity}</span>}
            <label htmlFor="notes">Notes:</label>
            <textarea id="notes" value={notesInput} onChange={(e) => setNotesInput(e.target.value)} placeholder="Notes" />
            <label htmlFor="door-open">Door Open Time:</label>
            <input type="time" id="door-open" value={doorOpenInput} onChange={(e) => setDoorOpenInput(e.target.value)} 
            className={errors.doorOpen ? "errorBorder" : ""}/>
            {errors.doorOpen && <span className="formError">{errors.doorOpen}</span>}
            <label htmlFor="door-close">Door Close Time:</label>
            <input type="time" id="door-close" value={doorCloseInput} onChange={(e) => setDoorCloseInput(e.target.value)} className={errors.doorClose ? "errorBorder" : ""}/>
            {errors.doorClose && <span className="formError">{errors.doorClose}</span>}
            <label htmlFor="reminder-date">Reminder Date:</label>
            <input type="date" id="reminder-date" value={reminderDateInput} onChange={(e) => setReminderDateInput(e.target.value)} className={errors.reminderDate ? "errorBorder" : ""}/>
            {errors.reminderDate && <span className="formError">{errors.reminderDate}</span>}
            <label htmlFor="reminder-time">Reminder Time:</label>
            <input type="time" id="reminder-time" value={reminderTimeInput} onChange={(e) => setReminderTimeInput(e.target.value)} className={errors.reminderTime ? "errorBorder" : ""}/>
            {errors.reminderTime && <span className="formError">{errors.reminderTime}</span>}
            <label htmlFor="reminder-period">Reminder Period (days):</label>
            <input type="number" id="reminder-period" value={reminderPeriodInput} onChange={(e) => setReminderPeriodInput(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Reminder Period in days" 
            className={errors.reminderPeriod ? "errorBorder" : ""}/>
            {errors.reminderPeriod && <span className="formError">{errors.reminderPeriod}</span>}




            <button type="submit" onClick={() => setSubmitted(true)} >Update Coop</button>
            <button type="button" onClick={() => { handleDelete(); setSubmitted(true); }}>Delete Coop</button>
        </form>
    );

}
export default UpdateCoopForm;
