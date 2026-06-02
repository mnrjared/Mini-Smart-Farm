import { useState } from "react";

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
    try{fetch(`/api/updateCoop`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            coopId,
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
    try{fetch(`/api/deleteCoop`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ coopId }),
    });}
    catch(err){
        console.error("Network error:", err);
    }

}
    

function UpdateCoopForm({coopId, zoneId, coopName, capacity, notes, doorOpen, doorClose, reminderDate, reminderPeriod, setSubmitted}: UpdateCoopProps) {
    const [errors, setErrors] = useState<{ coopName?: string; capacity?: string; notes?: string; doorOpen?: string; doorClose?: string; reminderDate?: string; reminderTime?: string; reminderPeriod?: string}>({});
    const [coopNameInput, setCoopNameInput] = useState(coopName);
    const [capacityInput, setCapacityInput] = useState(capacity);
    const [notesInput, setNotesInput] = useState(notes);
    const [doorOpenInput, setDoorOpenInput] = useState(doorOpen);
    const [doorCloseInput, setDoorCloseInput] = useState(doorClose);
    const [reminderDateInput, setReminderDateInput] = useState(reminderDate);
    const [reminderTimeInput, setReminderTimeInput] = useState(reminderDate.split("T")[1] ? reminderDate.split("T")[1].slice(0,5) : ""); 
    const [reminderPeriodInput, setReminderPeriodInput] = useState(reminderPeriod);
    
    const valid = ():boolean => {
        const newErrors: { coopName?: string; capacity?: string; notes?: string; doorOpen?: string; doorClose?: string; reminderDate?: string; reminderTime?: string; reminderPeriod?: string} = {};
        if (coopNameInput.length < 1) newErrors.coopName = "Please enter a coop name.";
        if (capacityInput <= 0 || typeof capacityInput === "string") newErrors.capacity = "Please enter a valid capacity.";
        if (doorOpenInput === "") newErrors.doorOpen = "Please enter a door open time.";
        if (doorCloseInput === "") newErrors.doorClose = "Please enter a door close time.";
        else if (doorOpenInput !== "" && new Date(`1970-01-01T${doorOpenInput}`) >= new Date(`1970-01-01T${doorCloseInput}`)) 
            newErrors.doorClose = "Door close time must be after door open time.";
        if (reminderDateInput === "") newErrors.reminderDate = "Please enter a reminder date.";
            else if (new Date(reminderDateInput) < new Date()) newErrors.reminderDate = "Reminder date cannot be in the past.";
        if (reminderTimeInput === "") newErrors.reminderTime = "Please enter a reminder time.";
        else if (new Date(`${reminderDateInput}T${reminderTimeInput}`) < new Date()) newErrors.reminderTime = "Reminder time cannot be in the past.";
        if (reminderPeriodInput <= 0 || typeof reminderPeriodInput === "string") newErrors.reminderPeriod = "Reminder period must be a positive number.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }  
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (valid()) {
            UpdateCoop(coopId.toLocaleString(), zoneId.toLocaleString(), coopNameInput, capacityInput.toLocaleString(), notesInput, doorOpenInput, doorCloseInput, reminderDateInput, reminderPeriodInput.toLocaleString());
            alert("Coop updated successfully!");
            setSubmitted(true);
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
        <form onSubmit={handleSubmit}>
            <label htmlFor="coop-name">Coop Name:</label>
            <input type="text" id="coop-name" value={coopNameInput} onChange={(e) => setCoopNameInput(e.target.value)} placeholder="Coop Name" 
            className={errors.coopName ? "errorBorder" : ""}/>
            {errors.coopName && <span className="formError">{errors.coopName}</span>}
            <label htmlFor="capacity">Capacity:</label>
            <input type="number" id="capacity" value={capacityInput} onChange={(e) => setCapacityInput(Number(e.target.value))} placeholder="Capacity"
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
            <input type="datetime-local" id="reminder-date" value={reminderDateInput} onChange={(e) => setReminderDateInput(e.target.value)} className={errors.reminderDate ? "errorBorder" : ""}/>
            {errors.reminderDate && <span className="formError">{errors.reminderDate}</span>}
            <label htmlFor="reminder-time">Reminder Time:</label>
            <input type="time" id="reminder-time" value={reminderTimeInput} onChange={(e) => setReminderTimeInput(e.target.value)} className={errors.reminderTime ? "errorBorder" : ""}/>
            {errors.reminderTime && <span className="formError">{errors.reminderTime}</span>}
            <label htmlFor="reminder-period">Reminder Period (days):</label>
            <input type="number" id="reminder-period" value={reminderPeriodInput} onChange={(e) => setReminderPeriodInput(Number(e.target.value))} placeholder="Reminder Period in days" 
            className={errors.reminderPeriod ? "errorBorder" : ""}/>
            {errors.reminderPeriod && <span className="formError">{errors.reminderPeriod}</span>}




            <button type="submit" onClick={() => setSubmitted(true)} >Update Coop</button>
            <button type="button" onClick={() => { handleDelete(); setSubmitted(true); }}>Delete Coop</button>
        </form>
    );

}
export default UpdateCoopForm;
