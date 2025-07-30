import { useState, useEffect } from 'react';
import styles from '../../../styles/indexSelect.module.css';

export default function ModelMultiSelect({ IndexComponent, value, onChange, label, errors, callbackText, labelField='display_name' }){
    const [selecting, setSelecting] = useState(false);

    
    const handleAdd = (obj) => {
        const inSelected = value.filter((v) => v.id === obj.id).length > 0;
        if(inSelected) return;
        onChange([...value, obj])
    }
    const remove = (obj) => {
        const updated = value.filter((ex) => (ex.id != obj.id))
        onChange(updated)
    }

    return(
        <div>
            <p>{label}</p>
            <div className={styles.card}>
                {value.length > 0 ? 
                    <div>
                        {value.map((v) => (<div style={{ display: 'flex', flexDirection: 'row'}}>
                            <p>{v[labelField]}</p>
                            <button type="button" onClick = {() => remove(v)} style={{ marginLeft: 'auto'}}>Remove</button>
                        </div>))}
                    </div>
                
                : <p>Nothing selected</p>}
                <button type="button" onClick={() => setSelecting(!selecting)}>{selecting ? 'Done' : 'Select'}</button>
                <button type="button" onClick={() => onChange([])}>Clear Selection</button>
                {selecting && <IndexComponent callback={(obj) => handleAdd(obj)} callbackText={callbackText}/>}
            </div>
        </div>
    )
}