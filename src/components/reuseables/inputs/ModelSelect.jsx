import { useState, useEffect } from 'react';
import styles from '../../../styles/indexSelect.module.css';
import Messages from '../Messages';

export default function ModelSelect({ IndexComponent, value, onChange, label,  errors, callbackText, displayField='name' }){
    const [selecting, setSelecting] = useState(false);
    return(
        <div>
            <label>
            {label}
            <Messages errors={errors} />
            <div className={styles.card}>
                {value ? <p>Selected: <i>{value[displayField]}</i></p> : <p>Nothing selected</p>}
                <button type="button" onClick={() => setSelecting(!selecting)}>{selecting ? 'Done' : 'Select'}</button>
                <button type="button" onClick={() => onChange(null)}>Clear Selection</button>
                {selecting && <IndexComponent callback={(obj) => {onChange(obj); setSelecting(false)}} callbackText={callbackText}/>}
            </div>
            </label>
        </div>
    )
}