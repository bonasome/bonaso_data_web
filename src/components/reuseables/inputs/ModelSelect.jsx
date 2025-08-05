import { useState, useEffect } from 'react';

import Messages from '../Messages';
import Tooltip from '../Tooltip';

import styles from '../../../styles/indexSelect.module.css';
import modalStyles from '../../../styles/modals.module.css';



import { FaCheckSquare } from "react-icons/fa";

export default function ModelSelect({ IndexComponent, value, onChange, label,  errors, tooltip=null, callbackText, labelField='name', includeParams=[], excludeParams=[] }){
    
    const [selecting, setSelecting] = useState(false);

    return(
        <div>
            <label>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <p>{label}</p>
                    {tooltip && <Tooltip msg={tooltip} />}
                </div>
                <Messages errors={errors} />
                <div className={styles.card}>
                    {value ? <p>Selected: <i>{value[labelField]}</i></p> : <p>Nothing selected</p>}
                    <button type="button" onClick={() => setSelecting(true)}>Choose an new item</button>
                    <button type="button" onClick={() => onChange(null)} disabled={!value}>Clear Selection</button>
                    <div className={modalStyles.modal} style={{ display: selecting ? 'block' : 'none' }}>
                        <div style={{ height: '90%', overflowY: 'scroll', overflowX: 'hidden' }}>
                            <IndexComponent callback={(obj) => {onChange(obj); setSelecting(false)}} callbackText={callbackText} includeParams={includeParams} excludeParams={excludeParams}/>
                        </div>
                        <button onClick={() => setSelecting(false)} type='button'><FaCheckSquare /> Done</button>
                    </div>
                </div>
            </label>
        </div>
    )
}