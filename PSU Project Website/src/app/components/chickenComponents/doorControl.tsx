import { useEffect, useRef, useState } from "react";
interface doorControlProps {
    doorState: boolean;
    setDoorState: (value: boolean) => void;
    times: string[];
    setOpenTime: (value: string) => void;
    setCloseTime: (value: string) => void;
    coopId: number;
}
function updateDoorTimes(coopId: number, openTime: string, closeTime: string) {
    /* Database call to update door times for the coop with the given coopId */
    fetch(`/api/updateDoorTimes`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ coopId, openTime, closeTime }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
    });
}


function DoorControl({ doorState, setDoorState, times , setOpenTime, setCloseTime, coopId   }: doorControlProps) {

    const[doorOpenTime, setDoorOpenTime] = useState<string>("");
    const[doorCloseTime, setDoorCloseTime] = useState<string>("");
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<{ doorOpenTime?: string; doorCloseTime?: string}>({});
    const formRef = useRef<HTMLFormElement>(null);
    const clickedInsideRef = useRef(false);

    useEffect(() => {
        if (times && times[0]) setDoorOpenTime(times[0]);
        if (times && times[1]) setDoorCloseTime(times[1]);
    }, [times[0], times[1]]);

    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            clickedInsideRef.current = !!(formRef.current && formRef.current.contains(e.target as Node));
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, []);

    const valid = (): { doorOpenTime?: string; doorCloseTime?: string} => {
        const newErrors: { doorOpenTime?: string; doorCloseTime?: string} = {};
        if (doorOpenTime === "") newErrors.doorOpenTime = "Please enter a door open time.";
        if (doorCloseTime === "") newErrors.doorCloseTime = "Please enter a door close time.";
        else if (doorOpenTime !== "" && new Date(`1970-01-01T${doorOpenTime}`) >= new Date(`1970-01-01T${doorCloseTime}`)) 
            newErrors.doorCloseTime = "Door close time must be after door open time.";
        return newErrors;
    }

    useEffect(() => {
        if (!submitted) return;
        setErrors(valid());
    }, [doorOpenTime, doorCloseTime]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        const validationErrors = valid();
        if (Object.keys(validationErrors).length > 0)
            {
                setErrors(validationErrors);
            }
        else{
            
        updateDoorTimes(coopId, doorOpenTime, doorCloseTime);

            setOpenTime(doorOpenTime); 
            setCloseTime(doorCloseTime)
            setErrors({});
            setSubmitted(false);
        }
    }

    const handleBlur = (e: React.FocusEvent<HTMLFormElement>) => {
        if (clickedInsideRef.current) {
            clickedInsideRef.current = false;
            return;
        }
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDoorOpenTime(times[0]); 
            setDoorCloseTime(times[1]);
            setErrors({});
            setSubmitted(false);
        }
    };
//console.log(times);
    return (
        <section id = "door">
                    <p className = "coop-text">Door Status</p>
                    <hr className="coop-hr"/>
                    {doorState ? (
                        <p id = "door-status" className = "openDoor">Door Open!</p>
                    ) : (
                        <p id = "door-status" className = "closedDoor">Door Closed!</p>
                    )}
                    <hr className="coop-hr"/>
                        <button id="control-door" onClick={async () => {
                        const newState = !doorState;
                        setDoorState(newState);
                        await fetch('/api/door', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ state: newState ? 'open' : 'close' })
                        });
                    }}>
                        {doorState ? "Close Door" : "Open Door"}
                    </button>
                    <form id = "door-form" ref={formRef} onSubmit={handleSubmit} onBlur={handleBlur} noValidate>
                        <section className = "set-time">
                            <label htmlFor="open">Door Opens</label>
                            <input type="time" name="open" id="open" onChange={(e)=>setDoorOpenTime(e.target.value)} 
                            className={errors.doorOpenTime ? "errorBorder" : ""} value={doorOpenTime} required/>
                            {errors.doorOpenTime && <span className="formError">{errors.doorOpenTime}</span>}  
                        </section>
                        <section className = "set-time">
                            <label htmlFor="close">Door Closes</label>
                            <input type="time" name="close" id="close" onChange={(e)=>setDoorCloseTime(e.target.value)} 
                            className={errors.doorCloseTime ? "errorBorder" : ""} value={doorCloseTime} required/>
                            {errors.doorCloseTime && <span className="formError">{errors.doorCloseTime}</span>}
                        </section>
                        <section>
                            <button id = "change" type="submit" 
                                >Change Time</button> 
                        </section>
                        
                    </form>
                    
                </section>
    )
}

export default DoorControl;