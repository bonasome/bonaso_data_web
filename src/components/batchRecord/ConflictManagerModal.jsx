import modalStyles from '../../styles/modals.module.css';
import styles from './conflict.module.css';
import Messages from '../reuseables/Messages';
import { useState, useEffect } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import cleanLabels from '../../../services/cleanLabels';

export default function ConflictManager({ conflicts, onClose }){
    /*
    Simple modal to manage a situation where an uploaded respondent is already in the system and the user
    needs to make a choice between keeping the database version or updating based on the upload. 
    - conflicts (array): A list of the conflicting records, which should include both the db and upload values
    - onClose (function): Close the modal
    */
    const [entries, setEntries] = useState(conflicts); //total # of conflicts
    const [active, setActive] = useState(conflicts[0]); //currently active entry
    const [pos, setPos] = useState(0); //the position of the current entry
    const [dbVals, setDBVals] = useState([]); //db values
    const [uploadVals, setUplaodVals] = useState([]); //upload values

    //page meta
    const [errors, setErrors] = useState([]);
    
    //on override call the api to edit the respondent, data should be good to go
    const handleOverride = async () => {
        try{
            console.log('submitting override...', active.upload)
            const response = await fetchWithAuth(`/api/record/respondents/${active.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(active.upload),
            });
            const returnData = await response.json();
            if(response.ok){
                const filtered = entries.filter((e, index) => index != pos)
                setEntries(filtered);
                if(pos==0) setPos(0)
                else setPos(prev => prev-=1)
            }
            else{
                console.error(returnData)
                setErrors(['Something went wrong, please try again.'])
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('File upload failed: ', err);
        }
    }
    //on skip/keep db, remove this from entries and shift position
    const handleSkip = () => {
        const filtered = entries.filter((e, index) => index != pos)
        setEntries(filtered);
        if(pos==0) setPos(0); //don't accidently go to -1
        else setPos(prev => prev-=1)
    }

    //auto close when all conflicts are resolved
    useEffect(() => {
        if (entries.length === 0){
            onClose()
        }
    }, [entries])

    //for each value, slightly clean up the values so they display properly
    useEffect(() => {
        const db = [];
        const upload = [];

        //join any arrays and merge object values
        const processValue = (value) => {
            if (Array.isArray(value)) {
                return value.join(', ');
            } 
            else if (value && typeof value === 'object') {
                return Object.values(value).join(', ');
            } 
            else {
                return value ?? ''; 
            }
        };

        Object.entries(active.in_database || {}).forEach(([_, val]) => {
            db.push(processValue(val));
        });

        Object.entries(active.upload || {}).forEach(([_, val]) => {
            upload.push(processValue(val));
        });

        setDBVals(db)
        setUplaodVals(upload)
    }, [active]);

    return(
        <div className={modalStyles.modal} >
            <Messages errors={errors} />
            <h1>This respondent already exists.</h1>
            <p>
                This respondent is already in the database. Please compare it with your upload and determine which 
                one you would like the keep.
            </p>
            <div className={styles.table}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr>
                        <td></td>
                        {Object.keys(active.in_database).map((h) => (<td>{cleanLabels(h)}</td>))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Existing in Database</td>
                        {dbVals.length > 0 && dbVals.map((e) => (<td>{e}</td>))}
                    </tr>
                    <tr>
                        <td>Your Upload</td>
                        {uploadVals.length > 0 && uploadVals.map((u) => (<td>{u}</td>))}
                    </tr>
                </tbody>
            </table>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row'}}>
                <button disabled={pos===0} onClick={() => {setPos(prev => prev-=1); setActive(entries[pos])}}>Previous</button>
                <p>Viewing Conflcit {pos+1} of {entries.length}</p>
                <button disabled={pos===entries?.length-1} onClick={() => {setPos(prev => prev+=1); setActive(entries[pos])}}>Next</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row'}}>
                <button onClick={() => handleSkip()}>Keep Existing in Database</button>
                <button onClick={()=>handleOverride()}>Keep Upload and Override Database</button>
            </div>

            <button onClick={() => onClose()}>Skip all remaining conflicts</button>
        </div>
    )
}