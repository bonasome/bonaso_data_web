import { useState, useEffect } from 'react';
import IndicatorsIndex from './IndicatorsIndex';
import styles from '../../styles/indexSelect.module.css';
import errorStyles from '../../styles/errors.module.css';
import SimpleSelect from '../reuseables/SimpleSelect';

export default function IndicatorMultiSelect({ title, callbackText, callback, subcats, existing=null }){
    const [warnings, setWarnings] = useState([]);
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState([]);
    const [followUpVal, setFollowUpVal] = useState('');
    const [followUpOptions, setFollowUpOptions] = useState([])
    useEffect(() => {
        if (existing && existing !== selected) {
            setSelected(existing);
        }
    }, [existing]);

    useEffect(() => {
        if(!subcats) return;
        const followUpOptions = selected.filter(ind => ind.subcategories > 0)
        setFollowUpOptions(followUpOptions);
    }, [selected]);

    useEffect(() => {
        const path = followUpVal !== '';
        callback(selected, path, followUpVal);
    }, [selected, followUpVal]);

    const handleAdd = (ind) => {
        setWarnings([]);
        if(selected.filter(s => s.id === ind.id).length > 0){
            setWarnings(['Indicator already selected']);
            return;
        }
        setSelected(prev => [...prev, ind])
    }
    const handleRemove = (ind) => {
        const updated = selected.filter(s => s.id !== ind.id)
        console.log(ind, updated)
        setSelected(updated)
    }
    return(
        <div>
            <p>{title}</p>
            <div className={styles.card}>
                {warnings.length != 0 && <div role='alert' className={errorStyles.warnings}><ul>{warnings.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                {selected.length === 0 && <p>Nothing selected</p>}
                {selected.length > 0 && selected.map((s) => (
                    <div className={styles.card}>
                        <p>Selected: <i>{s.code}: {s.name}</i></p>
                        <button type="button" onClick={() => handleRemove(s)}>Remove</button>
                    </div>
                ))}
                <button type="button" onClick={() => setSelecting(!selecting)}>{selecting ? 'Done' : 'Add New Indicator'}</button>
                <button type="button" onClick={() => setSelected([])}>Clear Selection</button>
                {followUpOptions.length > 0 && <SimpleSelect search={true} optionValues={followUpOptions.map((s) => (s.id))}
                    optionLabels={followUpOptions.map((s) => (`${s.code}: ${s.name}`))} name={'match_subcategories_to'} label={'Match Subcategories With'}
                    callback={(val) => setFollowUpVal(val)} value={followUpVal}
                />}
                {selecting && <IndicatorsIndex callback={(ind) => handleAdd(ind)} callbackText={callbackText}/>}
                
            </div>
        </div>
    )
}