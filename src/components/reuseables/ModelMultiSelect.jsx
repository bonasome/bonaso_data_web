import { useState, useEffect } from 'react';
import styles from '../../styles/indexSelect.module.css';

export default function ModelMultiSelect({ IndexComponent, title, callbackText, callback, existing=null }){
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(existing || []);

    useEffect(() => {
        if (existing && existing !== selected) {
            setSelected(existing);
        }
    }, [existing]);
    
    const handleAdd = (obj) => {
        const inSelected = selected.filter((ex) => ex.id === obj.id).length > 0
        if(inSelected) return;
        setSelected(prev => [...prev, obj])
        callback([...selected, obj])
    }
    const remove = (obj) => {
        const updated = selected.filter((ex) => (ex.id != obj.id))
        setSelected(updated);
        callback(updated)
    }
    useEffect(() => {
        callback(selected);
    }, [selected]);

    return(
        <div>
            <p>{title}</p>
            <div className={styles.card}>
                {selected.length > 0 ? 
                    <div>
                        {selected.map((s) => (<div style={{ display: 'flex', flexDirection: 'row'}}>
                            <p>{s.display_name}</p>
                            <button type="button" onClick = {() => remove(s)} style={{ marginLeft: 'auto'}}>Remove</button>
                        </div>))}
                    </div>
                
                : <p>Nothing selected</p>}
                <button type="button" onClick={() => setSelecting(!selecting)}>{selecting ? 'Done' : 'Select'}</button>
                <button type="button" onClick={() => setSelected([])}>Clear Selection</button>
                {selecting && <IndexComponent callback={(obj) => handleAdd(obj)} callbackText={callbackText}/>}
            </div>
        </div>
    )
}