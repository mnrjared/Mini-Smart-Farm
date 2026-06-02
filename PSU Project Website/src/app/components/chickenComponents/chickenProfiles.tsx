import "../../../styles/chickenCss/chickenProfiles.css";
import { useEffect, useState } from "react";

type Chicken = {
    rfid: string;
    coopId: number;
    chickenName: string;
    gender: string;
    dateOfBirth: string;
    species: string;
    weightKg: number;
    imageData: string | null;
    registerDate: string;
    notes: string;
};

function ChickenProfiles({ refreshKey }: { refreshKey: number }){
    const [allChickens,setAllChickens] = useState<Chicken[]>([]);
    const [selectedChicken, setSelectedChicken] = useState(false);
    const [rfid, setRfid] = useState("");
    const [chickenName, setChickenName] = useState("");
    const [gender, setGender] = useState("");
    const [species, setSpecies] = useState("");
    const [dob, setDob] = useState("");
    const [weight, setWeight] = useState<number | "">("");
    const [notes, setNotes] = useState("");
    const [imageData, setImageData] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<{ name?: string; gender?: string; species?: string; dob?: string; weight?: string; imageData?: string }>({});

    /* Database call to get all the chickens */
    useEffect(() => {
    const fetchChickens = async () => {
        try{
            const res = await fetch(`/api/chickenSelect`);
            if (!res.ok) throw new Error("Failed to fetch chickens");
            const data = await res.json();
            setAllChickens(Array.isArray(data) ? data : []);
        }catch(error){
            console.error("Error fetching chickens:", error);
            setAllChickens([]);
        }
    };
    fetchChickens();
   },[refreshKey]);

    /* This :boolean tells the valid function it expects a boolean to be returned */
    const valid = (): boolean =>{

        /* Creates an array to store the error messages */
        const newErrors: { name?: string; gender?: string; species?: string; dob?: string; weight?: string; imageData?: string } = {};
        
        /* Validation checks */

        /* When checking Name make sure it doesnt exist in the database */
        if(!chickenName) newErrors.name = "Please enter a name for the chicken.";
                
        if(!gender) newErrors.gender = "Please select a gender.";
        
        if(!species) newErrors.species = "Please select a species.";
        if(!dob) newErrors.dob = "Please enter a date of birth.";
        else if(new Date(dob) > new Date()) 
            newErrors.dob = "Date of birth cannot be in the future.";

        if(weight === "" || weight <= 0) newErrors.weight = weight === "" ? "Please enter a weight." : "Weight cannot must be greater than 0.";
        
        /* Checks if there is a file if there is it checks if it is a valid type */
        if(imageFile && !["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) newErrors.imageData = "Image must be a JPG, PNG or WEBP image.";
        /* Adds the errors to the state */
        setErrors(newErrors);
        /* Checks to see that no errors were added to the state if they were then it returns false to say it failed */
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!valid()) return;
        try{
        const res = await fetch(`/api/updateChicken`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chickenName,
                gender,
                dob,
                species,
                weightKg: weight,
                imageData,
                notes,
                rfid
            }),
        });

        if(!res.ok) throw new Error("Failed to update chicken. Please try again.");

        const data = await res.json();
        console.log(data.message);

        setAllChickens((prev) =>
            prev.map((c) =>
                c.rfid === rfid
                    ? { ...c, chickenName, gender, dateOfBirth: dob, species, weightKg: Number(weight), notes, imageData: imageData?? c.imageData }
                    : c
            )
        );

        setSelectedChicken(false);
            
        }catch(error){
            console.error("Error updating chicken:", error);
        }
    };

    const handleDelete = async () =>{
        /* Add in confirm delete */
        /* Temporary way to confirm deletion */
        if(!window.confirm(`Are you sure you want to delete ${chickenName}? This action cannot be undone.`)) return;
        
        try{
            const res = await fetch(`/api/deleteChicken`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rfid }),
            });

            if(!res.ok) throw new Error("Failed to delete chicken. Please try again.");

            setAllChickens((prev) => prev.filter((c) => c.rfid !== rfid));
            setSelectedChicken(false);
        }catch(error){
            console.error("Error deleting chicken:", error);
        }
    };

    const toImageSrc = (imageData: string | null): string => {
        if (!imageData) return "/chickenImages/ChickenFiller.png";
        return imageData;
    };

    return(
        <>
        <div className="chicken-grid">
            {Array.isArray(allChickens) && allChickens.map((chicken) => (
                <div 
                    className="chicken-card" 
                    key={chicken.rfid}
                    onClick={() => {
                        setSelectedChicken(true);
                        setChickenName(chicken.chickenName);
                        setRfid(chicken.rfid);
                        setGender(chicken.gender);
                        setSpecies(chicken.species);
                        setDob((chicken.dateOfBirth).slice(0,10)); /* MySQL saves date as 2023-05-15T00:00:00.000Z you need to cut it to 2023-05-15 with slice(0,10) */
                        setWeight(chicken.weightKg);
                        setNotes(chicken.notes);
                        setImageData(chicken.imageData);
                        setImageFile(null);
                        setErrors({}); /* Clear errors when opening a chicken profile */
                    }}
                    style={{cursor: "pointer"}}
                >
                    <img src={toImageSrc(chicken.imageData)} alt="Fail" />
                    <h3>{chicken.chickenName}</h3>
                </div>
            ))}
        </div>

        {selectedChicken && (
            <div className="chicken-details">
                <h2>Update Chicken Profile</h2>
               <button className="chickenButton closeUpdateChicken" onClick={() => setSelectedChicken(false)} type="button">✕</button>
                <form className="updateChickenProfileForm" onSubmit={handleSubmit}>

                    <label htmlFor="chicken-name">Chicken Name:</label>
                    <input className={errors.name ? "errorBorder" : ""} name="chicken-name" id="chicken-name"  type="text" value={chickenName} onChange={(e) => setChickenName(e.target.value)} />
                    {errors.name && <span className="formError">{errors.name}</span>}

                    <label htmlFor="c-gender">Gender:</label>
                    <select className={errors.gender ? "errorBorder" : ""} name="chicken-gender" id="c-gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="" disabled>Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    {errors.gender && <span className="formError">{errors.gender}</span>}

                    <label htmlFor="chicken-species">Species:</label>
                    {/* These options should come from the database */}
                    <input className={errors.species? "errorBorder" : ""} type="text" id="chicken-species" name="chicken-species" value={species} onChange={(e) => setSpecies(e.target.value)}/>
                    {errors.species && <span className="formError">{errors.species}</span>}

                    <label htmlFor="chicken-dob">Date of Birth:</label>
                    <input className={errors.dob ? "errorBorder" : ""} type="date" id="chicken-dob" name="chicken-dob" value={dob} onChange={(e) => setDob(e.target.value)} />
                    {errors.dob && <span className="formError">{errors.dob}</span>}

                    <label htmlFor="chicken-weight">Weight (kg):</label>
                    <input className={errors.weight ? "errorBorder" : ""} name="chicken-weight" id="chicken-weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} />
                    {errors.weight && <span className="formError">{errors.weight}</span>}

                    {/* Figure out the classname for this one */}
                    <label htmlFor="chicken-notes">Notes:</label>
                    <textarea className="chickenTextArea" name="chicken-notes" id="chicken-notes" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>

                    {/* figure out the classname for this one */}
                    <label htmlFor="profile-pic">Profile Picture:</label>
                    <input type="file" accept="image/*" className={`changeProfilePicture ${errors.imageData ? "errorBorder" : ""}`} name="profile-pic" id="profile-pic" 
                        onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                        setImageData(reader.result as string); // This is a base64 data URL e.g. "data:image/png;base64,iVBOR..."
                        setImageFile(file); // Store the raw file for validation (see next point)
                        };
                        reader.readAsDataURL(file);
                        }} />

                    {errors.imageData && <span className="formError">{errors.imageData}</span>}

                    <button className="chickenButton saveChickenProfile" type="submit">Save Changes</button>
                    <button className="chickenButton deleteChickenProfile" type="button" onClick={handleDelete}>Delete Chicken</button>
                </form>
            </div>
        )}
        </>
    )
}
export default ChickenProfiles;
