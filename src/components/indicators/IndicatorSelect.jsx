import { useState, useEffect } from 'react';
import IndicatorsIndex from './IndicatorsIndex';
import styles from '../../styles/indexSelect.module.css';
export default function IndicatorSelect({ title, callbackText, onChange, existing=null }){
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(existing);

    useEffect(() => {
        if (existing && existing !== selected) {
            setSelected(existing);
        }
    }, [existing]);

    useEffect(() => {
        const path = selected?.subcategories > 0 || false
        console.log(selected)
        onChange(selected, path);
    }, [selected]);

    return(
        <div>
            <p>{title}</p>
            <div className={styles.card}>
                {selected ? <p>Selected: <i>{selected?.code}: {selected?.name}</i></p> : <p>Nothing selected</p>}
                <button type="button" onClick={() => setSelecting(!selecting)}>{selecting ? 'Done' : 'Choose New Indicator'}</button>
                <button type="button" onClick={() => setSelected(null)}>Clear Selection</button>
                {selecting && <IndicatorsIndex callback={(ind) => {setSelected(ind); setSelecting(false)}} callbackText={callbackText}/>}
            </div>
        </div>
    )
}