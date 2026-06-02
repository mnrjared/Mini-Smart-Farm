import e from 'cors';
import {useState, useEffect, useRef} from 'react'

async function addCoop(zoneId: string, coopName: string, capacity: string, notes: string,
        openTime: string, closeTime: string, reminderDate: string, reminderPeriod: string, reminderTime: string): Promise<void> {
    try {
        const response = await fetch('/api/addCoop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                zoneId,
                coopName,
                capacity,
                notes,
                doorOpen: openTime,
                doorClose: closeTime,
                reminderDate,
                reminderPeriod,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Failed to add coop:', error.error);
            return;
        }

        const result = await response.json();
        console.log(result.message, '| Coop ID:', result.coopId);

    } catch (err) {
        console.error('Network error:', err);
    }
}

function AddCoopForm(){
    const [zoneId, setZoneId] = useState(3);
    const [coopName, setCoopName] = useState("");
    const [capacity, setCapacity] = useState<number | "">(0);
    const [notes, setNotes] = useState("");
    const [openTime,setOpenTime]=useState("");
    const [closeTime,setCloseTime]=useState("");
    const [reminderTime, setReminderTime] = useState("")
    const [reminderDate, setReminderDate] = useState("");
    const [reminderPeriod, setReminderPeriod] = useState<number | "">(0);
    const [errors, setErrors] = useState<{zoneId?: string; coopName?: string; capacity?: string; notes?: string;
        openTime?: string; closeTime?: string; reminderDate?: string; reminderPeriod?: string; reminderTime?: string}>({});
    const [submitted, setSubmitted] = useState(false);
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
        const  newErrors: {zoneId?: string; coopName?: string; capacity?: string; notes?: string;
        openTime?: string; closeTime?: string; reminderDate?: string; reminderPeriod?: string; reminderTime?: string} = {};

        if (coopName.length<1) newErrors.coopName = "Please enter a coop name."
        if (openTime === "") newErrors.openTime = "Please enter a door open time.";
        if (closeTime === "") newErrors.closeTime = "Please enter a door close time.";
        else if (openTime !== "" && new Date(`1970-01-01T${openTime}`) >= new Date(`1970-01-01T${closeTime}`)) 
            newErrors.closeTime = "Door close time must be after door open time.";
        if (reminderTime === "") newErrors.reminderTime = "Please enter a reminder time.";
        else if (new Date(`${reminderDate}T${reminderTime}`) < new Date()) newErrors.reminderTime = "Reminder time cannot be in the past.";
        if (reminderPeriod <= 0)
            newErrors.reminderPeriod = "Reminder period must be greater than 0.";
        if (reminderDate === "") newErrors.reminderDate = "Please enter a reminder date.";
            else if (new Date(reminderDate) < new Date()) newErrors.reminderDate = "Reminder date cannot be in the past.";
        if (capacity == 0) newErrors.capacity = "Capacity must be greater than 0."

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        
        if (!valid()) 
            {
                return
            }
        else{

        /* Enter data into database here */
            let newDate = `${reminderDate} ${reminderTime}`;
            
            setReminderDate(newDate);
            //let tempdate =`${reminderDate} ${reminderTime}:00`;
            //console.log(tempdate);
            
            addCoop(zoneId.toString(), coopName, capacity.toString(), notes, openTime, closeTime, newDate, reminderPeriod.toString(), reminderTime);
            setZoneId(3);
            setCapacity(0);
            setCoopName("");
            setNotes("");
            setOpenTime("");
            setReminderDate("");
            setReminderTime("");
            setReminderPeriod(0);
            setErrors({});
            setSubmitted(false);
        };

    }

    const handleBlur = (e: React.FocusEvent<HTMLFormElement>) => {
        if (clickedInsideRef.current) {
            clickedInsideRef.current = false;
            return;
        }
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setZoneId(3);
            setCapacity(0);
            setCoopName("");
            setNotes("");
            setOpenTime("");
            setReminderDate("");
            setReminderTime("");
            setReminderPeriod(0);
            setErrors({});
            setSubmitted(false);
        }
    };

    return( 
        <form ref={formRef} onSubmit={handleSubmit} onBlur={handleBlur} className="add-coop-form">
            <label htmlFor="add-coop-name">Coop Name:</label>
            <input type="text" id="add-coop-name" value={coopName} onChange={(e) => setCoopName(e.target.value)} 
                className={errors.coopName ? "errorBorder" : ""} />
            {errors.coopName && <span className="formError">{errors.coopName}</span>}

            <label htmlFor="add-capacity">Capacity:</label>
            <input type="number" id="add-capacity" value={capacity} onChange={(e) => setCapacity(e.target.value === "" ? "" : Number(e.target.value))} min={1}
                className={errors.capacity ? "errorBorder" : ""} />
            {errors.capacity && <span className="formError">{errors.capacity}</span>}

            <label htmlFor="add-notes">Notes:</label>
            <textarea id="add-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

            <label htmlFor="add-door-open">Door Open Time:</label>
            <input type="time" id="add-door-open" value={openTime} onChange={(e) => setOpenTime(e.target.value)}
                className={errors.openTime ? "errorBorder" : ""} />
            {errors.openTime && <span className="formError">{errors.openTime}</span>}

            <label htmlFor="add-door-close">Door Close Time:</label>
            <input type="time" id="add-door-close" value={closeTime} onChange={(e) => setCloseTime(e.target.value)}
                className={errors.closeTime ? "errorBorder" : ""} />
            {errors.closeTime && <span className="formError">{errors.closeTime}</span>}

            <label htmlFor="add-reminder-date">Reminder Date:</label>
            <input type="date" id="add-reminder-date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)}
                className={errors.reminderDate ? "errorBorder" : ""} />
            {errors.reminderDate && <span className="formError">{errors.reminderDate}</span>}

            <label htmlFor="add-reminder-time">Reminder Time:</label>
            <input type="time" id="add-reminder-time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)}
                className={errors.reminderTime ? "errorBorder" : ""} />
            {errors.reminderTime && <span className="formError">{errors.reminderTime}</span>}

            <label htmlFor="add-reminder-period">Reminder Period (days):</label>
            <input type="number" id="add-reminder-period" value={reminderPeriod} onChange={(e) => setReminderPeriod(e.target.value === "" ? "" : Number(e.target.value))} min={1}
                className={errors.reminderPeriod ? "errorBorder" : ""} />
            {errors.reminderPeriod && <span className="formError">{errors.reminderPeriod}</span>}

            <button type="submit" id="submit-new-coop">Add Coop</button>
        </form>
    )
}
export default AddCoopForm;