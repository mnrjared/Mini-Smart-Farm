import "../../../styles/chickenCss/chicken.css";
import AddChickenForm from "../../components/chickenComponents/addChickenForm";
import EggsLayedForm from "../../components/chickenComponents/eggsLayedForm";
import { useState } from "react";
import ChickenProfiles from "../../components/chickenComponents/chickenProfiles";
import ChickenHealth from "../../components/chickenComponents/chickenHealth"
function Chicken(){
    const [hideChicken, setHideChicken] = useState(true);
    const [hideEggs, setHideEggs] = useState(true);
    const [hideHealth, setHideHealth] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    return(
        <main className="chickenMain main-content">
            <h1>Chicken Management</h1>
            <section id="add-chicken">
            <div onClick={() => setHideChicken((current) => !current)} style={{userSelect:"none"}}> 
                <h2 className={hideChicken ? "formTitlesBefore" : "formTitlesAfter"} style={{cursor:"pointer"}}>Add New Chicken  
                    <img className="formIcons" src={hideChicken ? "/chickenImages/down-arrow.svg" : "/chickenImages/up-arrow.svg"} alt=""/>
                </h2>
            </div>
            {!hideChicken && <AddChickenForm onChickenAdded={() => setRefreshKey(k => k + 1)} />}
            </section>{/* End of add-chicken form */}

            <section id = "eggs-layed">
            <div onClick={() => setHideEggs((current) => !current)} style={{userSelect:"none"}}>
                <h2 className={hideEggs ? "formTitlesBefore" : "formTitlesAfter"} style={{cursor:"pointer"}}>Log Eggs Collected 
                    <img className="formIcons" src={hideEggs ? "/chickenImages/down-arrow.svg" : "/chickenImages/up-arrow.svg"} alt=""/>
                </h2>
            </div>
            {!hideEggs && <EggsLayedForm/>}
            </section>{/* End of eggs-layed form */}

            <section id="log-chicken-health">
            <div onClick={() => setHideHealth((current) => !current)} style={{userSelect:"none"}}> 
                <h2 className={hideHealth ? "formTitlesBefore" : "formTitlesAfter"} style={{cursor:"pointer"}}>Log Chicken Checkup  
                    <img className="formIcons" src={hideHealth ? "/chickenImages/down-arrow.svg" : "/chickenImages/up-arrow.svg"} alt=""/>
                </h2>
            </div>
            {!hideHealth && <ChickenHealth/> }
            </section>{/* End of add-chicken form */}

            <section id = "chicken-list">
            <div>
                <h2>Your Chickens</h2>
                <hr className="chickenHr"/>
            </div>
            {/* Insert the different chicken cards here */}
            <ChickenProfiles refreshKey={refreshKey}/>
            </section> {/* End of chicken-list section */}
            
        </main>
    )
}

export default Chicken