import { useState } from 'react';
import styles from './profile.module.css';
import prettyDates from '../../../services/prettyDates';
import { IoIosArrowDropup, IoIosArrowDropdownCircle } from "react-icons/io";
import { urlBuilder } from '../../../services/modelMap';
import { Link } from 'react-router-dom';
function ModelSection({ category, objects }){
    //control expansion
    const [expanded, setExpanded] = useState(false);
    //replace camal case with spaces
    function insertCharAt(str, char, index) {
        return str.slice(0, index) + char + str.slice(index);
    }
    //clean up the names 
    const cleanModelName = (modelStr) => {
        let cleaned = modelStr.split('.')[1]
        let cleaned2 = cleaned;
        let tracker = 0
        for (let i = 0; i < cleaned.length; i++) {
            if (cleaned[i] >= 'A' && cleaned[i] <= 'Z') {
                if(i===0) continue;
                cleaned2 = insertCharAt(cleaned2, ' ', i + tracker);
                tracker ++
            }
        }
        if(cleaned2[cleaned2.length-1] === 'y') cleaned2 = cleaned2.slice(0, -1) + 'ies';
        else cleaned2 += 's';
        return cleaned2
    }
    return(
        <div className={styles.card}>
            <div className={styles.toggleDropdown} onClick={() => setExpanded(!expanded)}>
                <h3 style={{ textAlign: 'start'}}>{cleanModelName(category)}</h3>
                {expanded ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
            </div>
            {expanded && <div>
                {objects.length > 0 ? objects.map((obj) =>( <div key={`${category}_${obj.id}`} className={styles.activityCard}>
                    {urlBuilder(category, obj.id. obj?.parent, obj?.second_parent) ?
                    <Link to={urlBuilder(category, obj.id, obj?.parent, obj?.second_parent)}><h3>{obj.display_name}</h3></Link> :
                        <h3>{obj.display_name}</h3>}
                    {obj.created && <p><i>Created at {prettyDates(obj.created_at, true)}</i></p>}
                    {obj.updated && <p><i>Updated at {prettyDates(obj.updated_at, true)}</i></p>}
                </div>)) : <p>Nothing here.</p>}
                
            </div>}
        </div>
    )
}

export default function Activity({ activity }){
    //create section for each model
    return(
        <div>
            <h2>Audit Logs</h2>
            {Object.keys(activity).map((cat) => (
                <ModelSection key={cat} category={cat} objects = {activity[cat]} />
            ))}
        </div>
    )
    
}