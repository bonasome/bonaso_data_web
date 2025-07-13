import { useState, useEffect } from 'react';
import OrganizationsIndex from './OrganizationsIndex';
import styles from '../../styles/indexSelect.module.css';
export default function OrganizationSelect({ title, onChange, existing=null }){
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(existing);

    useEffect(() => {
        onChange(selected);
    }, [selected]);

    return(
        <div>
            <p>{title}</p>
            <div className={styles.card}>
                {selected ? <p>Selected: <i>{selected?.name}</i></p> : <p>Nothing selected</p>}
                <button type="button" onClick={() => setSelecting(!selecting)}>{selecting ? 'Done' : 'Choose New Organization'}</button>
                <button type="button" onClick={() => setSelected(null)}>Clear Selection</button>
                {selecting && <OrganizationsIndex callback={(org) => {setSelected(org); setSelecting(false)}} callbackText={'Select a Parent Organization'}/>}
            </div>
        </div>
    )
}