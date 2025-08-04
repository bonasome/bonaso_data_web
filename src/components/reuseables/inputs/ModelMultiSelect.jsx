import { useState, useEffect } from 'react';

import Messages from '../Messages';

import styles from '../../../styles/indexSelect.module.css';
import modalStyles from '../../../styles/modals.module.css';

//select multiple models from an index component
export default function ModelMultiSelect({ IndexComponent, value, onChange, label, errors, callbackText, labelField='display_name', includeParams=[], excludeParams=[], projAdd=false, addRedirect=null }){
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

    const blacklist = value?.map((val) => (val.id)) ?? [];

    return(
        <div>
            <p>{label}</p>
            <Messages errors={errors} />
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
                {selecting && <div className={modalStyles.modal}>
                    <h2>{label}</h2>
                    <div style={{ height: '90%', overflowY: 'scroll', overflowX: 'hidden' }}>
                        <IndexComponent callback={(obj) => handleAdd(obj)} callbackText={callbackText} blacklist={blacklist} includeParams={includeParams} excludeParams={excludeParams} projAdd={projAdd} addRedirect={addRedirect} />
                    </div>
                    <button onClick={() => setSelecting(false)}>Done</button>
                </div>}
            </div>
        </div>
    )
}