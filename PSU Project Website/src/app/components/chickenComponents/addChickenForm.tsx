import { useEffect, useState } from "react";
type chickenCoop ={
    coopId: number;
}
function AddChickenForm({ onChickenAdded }: { onChickenAdded: () => void }){
    const [chickenName, setChickenName] = useState("");
    const [rfid, setRfid] = useState("");
    const [coopId, setCoopId] = useState("");
    const [allCoopID, setAllCoopID] = useState<chickenCoop[]>([]);
    const [gender, setGender] = useState("");
    const [species, setSpecies] = useState("");
    const [dob, setDob] = useState("");
    const [weight, setWeight] = useState<number | "">("");
    const [notes, setNotes] = useState("");
    const [imageData, setImageData] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<{ name?: string; rfid?: string; gender?: string; species?: string; dob?: string; weight?: string; photo?: string; coop?: string }>({});
    
    useEffect(() => {
        const fetchCoopIDs = async () => {
            try{
                const res = await fetch(`/api/getCoopIDs`);
                const data = await res.json();
                setAllCoopID(data);
            }catch(error){
                console.error("Error fetching coop IDs:", error);
            }
        };
        fetchCoopIDs();
    }, []);

    /* This :boolean tells the valid function it expects a boolean to be returned */
    const valid = (): boolean =>{

        /* Creates an array to store the error messages */
        const newErrors: { name?: string; rfid?: string; gender?: string; species?: string; dob?: string; weight?: string; photo?: string; coop?: string } = {};
        
        /* Validation checks */

        /* When checking Name make sure it doesnt exist in the database */
        if(!chickenName) newErrors.name = "Please enter a name for the chicken.";
        
        /* Checks if there is an RFID tag number */
        if(!rfid) newErrors.rfid = "Please enter an RFID tag number.";
        else if(!/^\d{10}$/.test(rfid)) 
            newErrors.rfid = "RFID tag number must be in the format '0000000000'.";
        
        /* Checks if a coopID is selected */
        if(!coopId) newErrors.coop = "Please select a coop.";
        /* Compares the inserted RFID tag number against the expected format */
        
        
        if(!gender) newErrors.gender = "Please select a gender.";
        
        if(!species) newErrors.species = "Please enter a species.";
        
        if(!dob) newErrors.dob = "Please enter a date of birth.";
        else if(new Date(dob) > new Date()) 
            newErrors.dob = "Date of birth cannot be in the future.";

        if(weight === "" || weight <= 0) newErrors.weight = weight === "" ? "Please enter a weight." : "Weight must be greater than 0.";
        
        /* Checks if there is a file if there is it checks if it is a valid type */
        if(imageFile && !["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) newErrors.photo = "Photo must be a JPG, PNG or WEBP image.";
        /* Adds the errors to the state */
        setErrors(newErrors);
        /* Checks to see that no errors were added to the state if they were then it returns false to say it failed */
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!valid()) return;
            
        try{
            const res = await fetch(`/api/addChicken`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },                
                body: JSON.stringify({
                    rfid,
                    chickenName,
                    gender,
                    dob,
                    species,
                    weightKg: weight,
                    imageData: imageData,
                    regDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    notes
                })
            });
            const data = await res.json();
            console.log("Chicken added:", data);
            onChickenAdded();
            setChickenName("");
            setRfid("");
            setCoopId("");
            setGender("");
            setSpecies("");
            setDob("");
            setWeight("");
            setNotes("");
            setImageData(null);
            setImageFile(null);
            setErrors({});
        }catch(error){
            console.error("Error adding chicken:", error);
        }
    }

    return(
        <form id = "add-chicken-form" onSubmit={handleSubmit}>
                <label htmlFor="chicken-name">Name:</label>
                <input className={errors.name? "errorBorder" : ""} type="text" id="chicken-name" name="chicken-name" value={chickenName} onChange={(e) => setChickenName(e.target.value)}/>
                {errors.name && <span className="formError">{errors.name}</span>}

                <label htmlFor="chicken-rfid">RFID tag number:</label>
                <input className={errors.rfid? "errorBorder" : ""} type="text" id="chicken-rfid" name="chicken-rfid" value={rfid} onChange={(e) => setRfid(e.target.value)}/>
                {errors.rfid && <span className="formError">{errors.rfid}</span>}

                <label htmlFor="chicken-coop">Select Coop:</label>
                <select className={errors.coop? "errorBorder" : ""} name="chicken-coop" id="chicken-coop" value={coopId} onChange={(e) => setCoopId(e.target.value)}>
                    <option value="">Select a coop</option>
                    {allCoopID.map((coop) => (
                        <option key={coop.coopId} value={coop.coopId}>
                            Coop {coop.coopId}
                        </option>
                    ))}
                </select>
                {errors.coop && <span className="formError">{errors.coop}</span>}

                <label htmlFor="chicken-gender">Gender:</label>
                <select className={errors.gender? "errorBorder" : ""} name="chicken-gender" id="chicken-gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                </select>
                {errors.gender && <span className="formError">{errors.gender}</span>}

                <label htmlFor="chicken-species">Species:</label>
                <input className={errors.species? "errorBorder" : ""} type="text" id="chicken-species" name="chicken-species" value={species} onChange={(e) => setSpecies(e.target.value)}/>
                {errors.species && <span className="formError">{errors.species}</span>}

                <label htmlFor="chicken-dob">Date of Birth:</label>
                <input className={errors.dob? "errorBorder" : ""} type="date" id="chicken-dob" name="chicken-dob" value={dob} onChange={(e) => setDob(e.target.value)}/>
                {errors.dob && <span className="formError">{errors.dob}</span>}

                <label htmlFor="chicken-weight">Weight (kg):</label>
                <input className={errors.weight? "errorBorder" : ""} type="number" id="chicken-weight" name="chicken-weight" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}/>{/* Checks if the input is empty if its empty leave it empty else convert it to a number */}
                {errors.weight && <span className="formError">{errors.weight}</span>}

                <label htmlFor="chicken-notes">Notes:</label>
                <textarea className="chickenTextArea" id="chicken-notes" name="chicken-notes" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>

                <label htmlFor="chicken-photo">Photo:</label>
                <input type="file" id="chicken-photo" name="chicken-photo" accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setImageData(reader.result as string);
                            setImageFile(file);
                        };
                        reader.readAsDataURL(file);
                    }}/>
                {errors.photo && <span className="formError">{errors.photo}</span>}

                <button className="chickenButton" type="submit">Add Chicken</button>
            </form>
    )
}
export default AddChickenForm;