import { useState, useEffect, useMemo, useRef } from "react";
import fetchWithAuth from "../../../services/fetchWithAuth";
import errorStyles from '../../styles/errors.module.css';
import Checkbox from "../reuseables/Checkbox";
import styles from './eventDetail.module.css';
import modalStyles from '../../styles/modals.module.css'
import SimpleSelect from "../reuseables/SimpleSelect";
import ConfirmDelete from "../reuseables/ConfirmDelete";
import ButtonLoading from "../reuseables/ButtonLoading";

function Warn( {onConfirm, onCancel }) {
    return(
        <div className={modalStyles.modal}>
            <h1>Warning!</h1>
            <p><strong>
                Changing the breakdowns will erase any existing data. If you confirm this,
                all the numbers you have entered for this task will be erased.
            </strong></p>
            <button onClick={() => onConfirm()}>Confirm, my data will be erased.</button>
            <button onClick={() => onCancel()}>Cancel</button>
        </div>
    )
}

export default function Counts({ event, breakdownOptions, task, onSave, onCancel, onDelete, existing=null}) {
    const [breakdowns, setBreakdowns] = useState({
        sex: false,
        citizenship: false,
        status: false,
        age_range: false,
        kp_type: false,
        disability_type: false,
        hiv_status: false,
        pregnancy: false,
        subcategory_id: false,
    });
    
    const [breakdownSplits, setBreakdownSplits] = useState({
        sex: {values: breakdownOptions?.sex, labels: breakdownOptions?.sex_labels, col: 5},
        age_range: {values: breakdownOptions?.age_range, labels: breakdownOptions?.age_range_labels, col: 0},
        citizenship: {values: breakdownOptions?.citizenship, labels: breakdownOptions?.citizenship_labels, col: 6},
        status: {values: breakdownOptions?.status, labels: breakdownOptions?.status_labels, col: 4},
        kp_type: {values: breakdownOptions?.kp_type, labels: breakdownOptions?.kp_type_labels, col: 1},
        disability_type: {values: breakdownOptions?.disability_type, labels: breakdownOptions?.disability_type_labels, col: 2},
        hiv_status: {values: [true, false], labels: ['HIV Positive', 'HIV Negative'], col: 7},
        pregnancy: {values: [true, false], labels: ['Pregnant', 'Not Pregnant'], col: 8},
        subcategory_id: {values: [], labels: [], col: 3}
    })
    const [editing, setEditing] = useState(existing ? false: true);
    const [active, setActive] = useState([]);
    const [rows, setRows] = useState([]);
    const [counts, setCounts] = useState({});
    const [errors, setErrors] = useState([])
    const [existingCounts, setExistingCounts] = useState([]);
    const [existingMap, setExistingMap] = useState([]);
    const [del, setDel] = useState(false);
    const [warning, setWarning] = useState(null);
    const [flagged, setFlagged] = useState(false);
    const [ogCounts, setOGCounts] = useState([])
    const [saving, setSaving] = useState(false);

    const mapExisting = () => {
        let ids = []
        let combos = []
        let countsArray = []
        let splits = []
        Object.keys(existing).forEach((group) => {
            let groupMap = {}
            Object.keys(existing[group]).forEach((ind) => {
                if(ind === 'id') ids.push(existing[group][ind])
                if(ind === 'count') countsArray.push(existing[group][ind]);
                if(ind === 'flagged' && existing[group][ind] == true) setFlagged(true);
                if(existing[group][ind] != null && !['created_by', 'created_at', 'updated_by', 'updated_at', 'id', 'event', 'count', 'task', 'task_id', 'flagged'].includes(ind)){
                    const key = ind === 'subcategory' ? 'subcategory_id' : ind
                    groupMap[key] = existing[group][ind]
                }
            })
            combos.push(groupMap)
        })
        setOGCounts(splits);
        setExistingCounts(countsArray)
        setExistingMap(combos)
        
    }
    const checkActive = () => {
        if(existingMap.length > 0){
            const fields = Object.keys(existingMap[0]).map((e) => (e))
            fields.forEach(field => {
                setBreakdowns(prev => ({...prev, [field]: true}))
            })
        }
    }

    useEffect(() => {
        if (task?.indicator.subcategories.length > 0) {
            setBreakdowns(prev => ({ ...prev, subcategory_id: true }));
            setBreakdownSplits(prev => ({
                ...prev,
                subcategory_id: {
                    values: task.indicator.subcategories.map(c => c.id),
                    labels: task.indicator.subcategories.map(c => c.name),
                }
            }));
        }
        else{
            setBreakdowns(prev => ({ ...prev, subcategory_id:false }));
        }

        if (existing) {
            mapExisting(); // only populate raw data
        } else {
            setExistingCounts([]);
            setExistingMap([]);
            setFlagged(false);
        }
    }, [existing, task]);

    useEffect(() => {
        if (existingMap.length > 0) {
            checkActive();
        }
    }, [existingMap]);

    useEffect(() => {
        const activeSplits = Object.entries(breakdownSplits)
            .filter(([key]) => breakdowns[key])
            .sort(([, a], [, b]) => a.col - b.col);
        setActive(activeSplits)
        mapCurrent(activeSplits)
        let labelsMap = activeSplits.map((a) => (a[1].labels))
        labelsMap = labelsMap.filter((m, index) => index != 0)
        setRows(cartesianProduct(labelsMap))
    }, [breakdowns, existingCounts, existingMap])

    function shallowEqual(obj1, obj2) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;
        return keys1.every(key => obj1[key] === obj2[key]);
    }

    const mapCurrent =(splits) => {
        if(!task) return
        if(splits.length == 0) {
            let count = '';
            if(existing){
                count = existing[Object.keys(existing)[0]].count
            }
            setCounts({0: {count: count, task_id: task.id}}); 
            return;
        }
        if(splits.length === 1){
            const map = {}
            const split = splits[0][0]
            const valuesArray = splits.map((s) => (s[1].values))
            valuesArray[0].forEach((v, index) => {
                map[index] = {[split]: v, count: '', task_id: task.id}
            })
            setCounts(map)
        }
        console.log(splits)
        const splitMap = splits.map((s) => s[0])
        const valuesArrays = splits.map((s) => (s[1].values))
        const valuesMap = cartesianProduct(valuesArrays)
        const map = {}
        for(let i=0; i < valuesMap.length; i++){
            map[i] = {}
            for(let j = 0; j < splitMap.length; j++){
                map[i][splitMap[j]] = valuesMap[i][j]
            }
            if(existing){
                let found = null
                existingMap.forEach((m, index) => {
                    if(shallowEqual(map[i], m)) found = index
                })
                if(found !== null) map[i].count = existingCounts[found]
                else  map[i].count = ''
            }
            else{
                map[i].count = ''
            }
            map[i].task_id = task.id
        }
        setCounts(map)
    }


    function cartesianProduct(arrays) {
        if (!arrays || arrays.length === 0) return [];
        return arrays.reduce(
            (acc, curr) => {
                if (!Array.isArray(curr)) return acc;
                return acc.flatMap(d => curr.map(e => [...d, e]));
            },
            [[]]
        );
    }

    const changeBreakdowns = (key, value) => {
        const warn = Object.keys(counts).some((c) => counts[c].count !== '');
        if(warn){
            setWarning({key: key, value: value})
        }
        else{
            confirmChange(key, value)
        }
        
    }
    const confirmChange = (key, value) => {
        if(!key) key = warning.key
        if(value == null || value == 'undefined') value = warning.value
        setBreakdowns(prev => ({...prev, [key]: value}))
        setWarning(null)
    }   

    const saveCount = async() => {
        setErrors([])
        const currentBD = active.map((a) => a[0])
        const warn = Object.keys(counts).every((c) => counts[c].count === '');
        if(warn) {
            setErrors(['You must enter at least one value to save a count.']);
            return;
        }
        if(existing && currentBD != ogCounts){ 
            console.warn('This triggered');
        }
        const data = [];
        Object.keys(counts).forEach((c) => {if(counts[c].count != '') data.push(counts[c])})
        console.log('submitting data...')
            try{
                setSaving(true);
                const response = await fetchWithAuth(`/api/activities/events/${event.id}/update-counts/`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': "application/json",
                    },
                    body: JSON.stringify({'counts': data})
                });
                const returnData = await response.json();
                if(response.ok){
                    setEditing(false)

                    const structured = {};
                    returnData.created.forEach((c) => {
                        structured[c.id] = c;
                    });

                    onSave({ [task.id]: structured });
                }
                else{
                    const serverResponse = []
                    for (const field in returnData) {
                        if (Array.isArray(returnData[field])) {
                            returnData[field].forEach(msg => {
                            serverResponse.push(`${field}: ${msg}`);
                            });
                        } 
                        else {
                            serverResponse.push(`${field}: ${returnData[field]}`);
                        }
                    }
                    setErrors(serverResponse)
                }
            }
            catch(err){
                setErrors(['Something went wrong. Please try again later.'])
                console.error('Could not record indicator: ', err)
            }
            finally{
                setSaving(false);
            }
    }
     const deleteCount = async() => {
        try {
            console.log('removing task...');
            const response = await fetchWithAuth(`/api/activities/events/${event.id}/delete-count/${task.id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onDelete(task.id);
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } 
                catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }
                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                    });
                    } else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete task:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setDel(false)
        }
        
    }
    const calcCellIndex = (iter, index) => {
        const n = rows.length
        return n*index + iter
    }
    const handleCancel = () => {
        onCancel();
        if(existing) mapCurrent(active);
        setEditing(false);
    }
    if(!task) return <div className={errorStyles.erors}>This count is not associated with any task.</div>
    return(
        <div className={styles.segment}>
            {warning && <Warn onConfirm={() => confirmChange()} onCancel={() => setWarning(null)} />}
            {del && <ConfirmDelete name={`Counts for Task: ${task.indicator.name} for for ${task?.organization.name} Event: ${event.name}`} onConfirm={() => deleteCount()} onCancel={() => setDel(false)} />}
            <h2>Counts for {task?.indicator.name} ({task?.organization.name})</h2>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {existing && flagged && 
                <div className={errorStyles.warnings}>
                    <h3>Flagged</h3>
                        <p>This interaction has been flagged. This is most likely because:</p>
                        <ul>
                            {task.indicator.prerequisite && <li>This task has a prerequisite that has no counts associated with it.</li>}
                            {task.indicator.prerequisite && <li>This task has a prerequisite that has counts associated wtih it but the counts use a different demographic breakdown and we couldn't verify them.</li>}
                            {task.indicator.prerequisite && <li>This task has a prerequisite with counts 
                                but the counts for this task are not aligned with its prerequisite. Double check 
                                that no number in this task is larger than its corresponding number in the prerequisite task.</li>}
                        </ul>
                </div>
            }
            
            {editing && <h3>Select your breakdowns here</h3>}
            {editing && <div className={styles.choices}>
                {Object.keys(breakdowns).map((b) => {
                    if(b == 'subcategory_id') return
                    return <Checkbox key={b}
                        label={(b.charAt(0).toUpperCase() + b.slice(1)).replace('_', ' ')} 
                        name={b} checked={breakdowns[b]} 
                        callback={(c) => changeBreakdowns(b, c)} 
                    />
                })}
            </div>}
            <div>
                {active.length === 0 && 
                    <div>
                        <label htmlFor="count">Count</label>
                        {editing ? <input id="count" type="number" min={0}  value={counts[0]?.count} onChange={(e) => setCounts(prev => ({
                                    ...prev,
                                    0: {
                                    ...prev[0],
                                    count: e.target.value,
                                    },
                                }))} /> : <p>{counts[0]?.count}</p>}
                    </div>
                }
                {active.length === 1 &&
                    active[0][1].labels.map((b, index) => (
                        <div>
                            <label htmlFor={b}>{b}</label>
                            {editing ? <input id={b} type="number" min={0} value={counts[index]?.count} onChange={(e) => setCounts(prev => ({
                                    ...prev,
                                    [index]: {
                                    ...prev[index],
                                    count: e.target.value,
                                    },
                                }))} /> : <p>{counts[index]?.count}</p>}
                        </div>
                    ))
                }
                {
                    active.length > 1 &&
                    <table className={styles.countsTable}>
                        <thead>
                            <tr>
                                {active.map((a, index) => {if(index != 0) return <th>{(a[0].charAt(0).toUpperCase() + a[0].slice(1)).replace('_id', '').replace('_', ' ')}</th>})}
                                {active[0][1].labels.map((c) => (<th>{c}</th>))}
                            </tr>
                        </thead>
                        
                        <tbody> 
                            {rows.map((row, iter) => 
                                <tr key={iter}>
                                    {row.map((r) => (<td>{r}</td>))}
                                    {active[0][1].labels.map((c, index) => {
                                        const pos = calcCellIndex(iter, index); 
                                        return <td key={pos}> {editing ? <input id={pos} min={0} type="number" value={counts[pos]?.count} onChange={(e) => 
                                            setCounts(prev => ({
                                                ...prev,
                                                [pos]: {
                                                ...prev[pos],
                                                count: e.target.value,
                                                },
                                            }))} /> : <p><strong>{counts[pos]?.count == '' ? '-' : counts[pos]?.count}</strong></p>}
                                        </td>}
                                    )}
                                </tr>
                            )}
                        </tbody>
                    </table>
                }
                <div>
                    <button onClick={() => editing ? handleCancel() : setEditing(true)}>{editing ? 'Cancel' : 'Edit'}</button>
                    {editing && saving ? <ButtonLoading /> : <button onClick={() => saveCount()}>Save</button>}
                    {editing && existing && !del && <button className={errorStyles.deleteButton} onClick={() => setDel(true)}>Delete</button>}
                    {del && <ButtonLoading forDelete={true} />}
                </div>
            </div>
        </div>
    )
}