import { useState, useEffect } from 'react';
import IndicatorsIndex from './IndicatorsIndex';
import styles from '../../styles/indexSelect.module.css';
export default function IndicatorSelect({ title, onChange, existing=null }){
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(existing);

    useEffect(() => {
        onChange(selected);
    }, [selected]);

    return(
        <div>
            <p>{title}</p>
            <div className={styles.card}>
                {selected ? <p>Selected: <i>{selected?.code}: {selected?.name}</i></p> : <p>Nothing selected</p>}
                <button type="button" onClick={() => setSelecting(!selecting)}>{selecting ? 'Done' : 'Choose New Indicator'}</button>
                <button type="button" onClick={() => setSelected(null)}>Clear Selection</button>
                {selecting && <IndicatorsIndex callback={(ind) => {setSelected(ind); setSelecting(false)}} callbackText={'Select as Prerequisite'}/>}
            </div>
        </div>
    )
}