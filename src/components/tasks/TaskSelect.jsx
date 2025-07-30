import { useState, useEffect } from 'react';

import Tasks from './Tasks';
import styles from '../../styles/indexSelect.module.css';

//even though all of these are migrating, this one might be worth keeping for targets
export default function TaskSelect({ title, callbackText, onChange, organizationID=null, projectID=null, existing=null }){
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(existing);
    
    useEffect(() => {
        if (existing && existing !== selected) {
            setSelected(existing);
        }
    }, [existing]);
    
    useEffect(() => {
        console.log(selected)
        onChange(selected);
    }, [selected]);

    return(
        <div>
            <p>{title}</p>
            <div className={styles.card}>
                {selected ? <p>Selected: <i>{selected?.indicator.code}: {selected?.indicator.name}</i></p> : <p>Nothing selected</p>}
                <button type="button" onClick={() => setSelecting(!selecting)}>{selecting ? 'Done' : 'Choose New Task'}</button>
                <button type="button" onClick={() => setSelected(null)}>Clear Selection</button>
                {selecting && <Tasks addCallback={(t) => {setSelected(t); setSelecting(false)}} addCallbackText={callbackText} projectID={projectID} organizationID={organizationID} />}
            </div>
        </div>
    )
}