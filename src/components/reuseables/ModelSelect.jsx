import { useState, useEffect } from 'react';
import styles from '../../styles/indexSelect.module.css';

export default function ModelSelect({ IndexComponent, title, callbackText, callback, existing=null }){
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(existing);

    useEffect(() => {
        if (existing && existing !== selected) {
            setSelected(existing);
        }
    }, [existing]);
    
    useEffect(() => {
        callback(selected);
    }, [selected]);

    return(
        <div>
            <p>{title}</p>
            <div className={styles.card}>
                {selected ? <p>Selected: <i>{selected?.name}</i></p> : <p>Nothing selected</p>}
                <button type="button" onClick={() => setSelecting(!selecting)}>{selecting ? 'Done' : 'Select'}</button>
                <button type="button" onClick={() => setSelected(null)}>Clear Selection</button>
                {selecting && <IndexComponent callback={(obj) => {setSelected(obj); setSelecting(false)}} callbackText={callbackText}/>}
            </div>
        </div>
    )
}