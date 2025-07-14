import { useState, useEffect } from 'react';
import ClientsIndex from './ClientsIndex';
import styles from '../../../styles/indexSelect.module.css';
export default function ClientSelect({ title, onChange, existing=null }){
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(existing);

    useEffect(() => {
        if (existing && existing !== selected) {
            setSelected(existing);
        }
    }, [existing]);
    
    useEffect(() => {
        onChange(selected);
    }, [selected]);
    console.log(selected)
    return(
        <div>
            <p>{title}</p>
            <div className={styles.card}>
                {selected ? <p>Selected: <i>{selected?.name}</i></p> : <p>Nothing selected</p>}
                <button type="button" onClick={() => setSelecting(!selecting)}>{selecting ? 'Done' : 'Choose New Client'}</button>
                <button type="button" onClick={() => setSelected(null)}>Clear Selection</button>
                {selecting && <ClientsIndex callback={(cl) => {setSelected(cl); setSelecting(false)}} callbackText={'Select a Client'}/>}
            </div>
        </div>
    )
}