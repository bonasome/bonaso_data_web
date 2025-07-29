import { useState, useEffect, useMemo, useRef } from "react";
import fetchWithAuth from "../../../services/fetchWithAuth";
import errorStyles from '../../styles/errors.module.css';
import Checkbox from "../reuseables/inputs/Checkbox";
import styles from './eventDetail.module.css';
import modalStyles from '../../styles/modals.module.css'
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import ConfirmDelete from "../reuseables/ConfirmDelete";
import ButtonLoading from "../reuseables/loading/ButtonLoading";
import cleanLabels from '../../../services/cleanLabels';
import { useAuth } from "../../contexts/UserAuth";
import theme from '../../../theme/theme'
import prettyDates from "../../../services/prettyDates";
function Warn( {onConfirm, onClose }) {
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

function Flag({ event, flag, onUpdate }){
    const [errors, setErrors] = useState([]);
    const [reason, setReason] = useState('')
    const [resolving, setResolving] = useState(false);
    const [saving, setSaving] = useState(false);
    const handleResolve = async() => {
        setErrors([]);
        if(reason === ''){
            setErrors(['You must give a reason for resolving this flag.']);
            return;
        }
        try{
            setSaving(true);
            console.log('submitting flag...')
            const url = `/api/activities/events/${event.id}/resolve-flag/${flag.id}/`
            console.log(url)
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({'resolved_reason': reason})
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate(returnData.flag)
                setErrors([]);
                setResolving(false);
            }
            else{
                const serverResponse = [];
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                    returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                    });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        }
        catch(err){
            console.error('Failed to apply changes to flag:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setSaving(false);
        }
    }

    return(
        <div className={flag.resolved ? styles.resolved : styles.flag}>
            <p>{flag.reason} ({flag.auto_flagged ? `Auto Flagged` : `Flagged by ${flag.created_by.first_name} ${flag.created_by.last_name}`} at {prettyDates(flag.created_at)})</p>
            {flag.resolved && <p>Resolved by {flag.resolved_by.first_name} {flag.resolved_by.last_name}: {flag.resolved_reason}</p>}
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {resolving && <div>
                <label htmlFor="resolved">Enter a Reason</label>
                <input type='text' id='resolved' value={reason} onChange={(e)=> setReason(e.target.value)} />
                {!saving && <button onClick={() => handleResolve()}>Submit</button>}
                {saving && <ButtonLoading />}
            </div>}
            {!flag.resolved && <button onClick={() => setResolving(!resolving)}>{resolving ? 'Cancel' : 'Resolve'}</button>}
        </div>
    )
}

function CountDetail({ event, count, onClose }){
    const [errors, setErrors] = useState([])
    const [saving, setSaving] = useState(false);
    const [flags, setFlags] = useState(count.count_flags)
    const [flagging, setFlagging] = useState(false);
    const [reason, setReason] = useState('');

    const handleFlag = async() => {
        setErrors([]);
        if(reason === ''){
            setErrors(['You must give a reason for flagging this count.']);
            return;
        }
        try{
            setSaving(true);
            console.log('submitting flag...')
            const url = `/api/activities/events/${event.id}/flag-count/${count.id}/`
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({'reason': reason})
            });
            const returnData = await response.json();
            if(response.ok){
                setErrors([]);
                console.log(returnData)
                setFlags(prev => [...prev, returnData.flag])
                setFlagging(false);
            }
            else{
                const serverResponse = [];
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                    returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                    });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        }
        catch(err){
            console.error('Failed to apply changes to flag:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setSaving(false);
        }
    }

    const onUpdate = (flag) => {
        let updated = flags.filter(f => f.id!=flag.id)
        updated.push(flag)
        setFlags(updated)
    }

    if(!event || !count) return(
        <div className={modalStyles.modal}>
            <ComponentLoading />
        </div>
    )
    return(
        <div className={modalStyles.modal}>
            <p>Details</p>
            {flags.map((f) => (
                <Flag key={f.id} event={event} flag={f} onUpdate={(flag) => onUpdate(flag)}/>
            ))}
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {flagging && <div style={{ display: 'flex', flexDirection: 'row'}}>
                <label htmlFor="resolved">Enter a Reason</label>
                <input type='text' id='resolved' value={reason} onChange={(e)=> setReason(e.target.value)} />
                {!saving && <button onClick={() => handleFlag()}>Submit</button>}
                {saving && <ButtonLoading />}
            </div>}
            <button onClick={() => setFlagging(!flagging)} className={errorStyles.warningButton}>{flagging ? 'Cancel' : 'Add New Flag'}</button>
            <button onClick={() => onClose()}>Close</button>
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
        pregnancy: {values: breakdownOptions?.pregnancy, labels: breakdownOptions?.pregnancy_labels, col: 7},
        hiv_status: {values: breakdownOptions?.hiv_status, labels: breakdownOptions?.hiv_status_labels, col: 8},
        subcategory_id: {values: [], labels: [], col: 3}
    })
    const [editing, setEditing] = useState(existing ? false: true);
    const [active, setActive] = useState([]);
    const [rows, setRows] = useState([]);
    const [counts, setCounts] = useState({});
    const [errors, setErrors] = useState([]);
    const [existingCounts, setExistingCounts] = useState([]);
    const [existingIDs, setExistingIDs] = useState([]);
    const [existingFlags, setExistingFlags] = useState([]);
    const [existingMap, setExistingMap] = useState([]);
    const [del, setDel] = useState(false);
    const [warning, setWarning] = useState(null);
    const [pastFlags, setPastFlags] = useState(false);
    const [activeFlags, setActiveFlags] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(existing ? false : true);
    const [details, setDetails] = useState(null);

    const [resolving, setResolving] = useState(false);
    const [flagging, setFlagging] = useState(false);
    const [reason, setReason] = useState('');
    const { user } = useAuth(); 
    const mapExisting = () => {
        let ids = []
        let combos = []
        let countsArray = []
        let flagsArray = []
        Object.keys(existing).forEach((group) => {
            let groupMap = {}
            Object.keys(existing[group]).forEach((ind) => {
                if(ind === 'id') ids.push(existing[group][ind])
                if(ind === 'count') countsArray.push(existing[group][ind]);
                if(ind === 'count_flags'){
                    const hasFlags = existing[group][ind].length > 0
                    if(hasFlags) setPastFlags(true);
                    if(determineFlagged(existing[group][ind])) setActiveFlags(true);
                    flagsArray.push(existing[group][ind] || [])
                }
                if(existing[group][ind] != null && !['created_by', 'created_at', 'updated_by', 'updated_at', 'id', 'event', 'count', 'task', 'task_id', 'count_flags'].includes(ind)){
                    const key = ind === 'subcategory' ? 'subcategory_id' : ind
                    groupMap[key] = existing[group][ind]
                }
            })
            combos.push(groupMap)
        })
        setExistingIDs(ids)
        setExistingCounts(countsArray)
        setExistingFlags(flagsArray)
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
            let count_flags = []
            let id = null;
            if(existing){
                count = existing[Object.keys(existing)[0]].count
                count_flags = existing[Object.keys(existing)[0]].count_flags
                id = existing[Object.keys(existing)[0]].id
            }
            setCounts({0: {count: count, task_id: task.id, count_flags: count_flags, id: id}}); 
            return;
        }
        if(splits.length === 1){
            const map = {}
            const split = splits[0][0]
            const valuesArray = splits.map((s) => (s[1].values))
            console.log(valuesArray)
            valuesArray[0].forEach((v, index) => {
                let count = ''
                let flags = []
                let id = null
                let found = null
                if(existing){
                    existingMap.forEach((m, index) => {
                        if(m[split] === v){
                            count = m.count,
                            id = m.id
                            flags = m.count_flags
                        }
                    })
                }
                else{
                    map[index] = {[split]: v, count: count, task_id: task.id, count_flags: flags, id: id}
                }
                
            })
            setCounts(map)
        }

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
                if(found !== null){ 
                    map[i].count = existingCounts[found];
                    map[i].count_flags = existingFlags[found] 
                    map[i].id = existingIDs[found] 
                }
                else{  
                    map[i].count = ''
                    map[i].count_flags = []
                }
            }
            else{
                map[i].count = ''
                map[i].count_flags = []
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
        setErrors([])
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
    const changeFlags = async() => {
        setErrors([]);
        if(reason === ''){
            setErrors(['Reason is required'])
            return
        }
        try{
            setSaving(true);
            console.log('submitting flag...')
            const data = resolving ? {'resolved_reason': reason} : {'reason': reason}
            const url = resolving ? `/api/activities/events/${event.id}/resolve-count-flags/${task.id}/` : `/api/activities/events/${event.id}/flag-counts/${task.id}/`
            console.log(url, data)
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setFlagging(false);
                setResolving(false);
                onSave();
                setErrors([]);
            }
            else{
                const serverResponse = [];
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                    returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                    });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        }
        catch(err){
            console.error('Failed to apply changes to flag:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setSaving(false);
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

    const determineFlagged = (flags) => {
        if(!flags || flags.length === 0) return false
        const active = flags.filter(f => f.resolved === false)
        if(active.length > 0) return true
        return false
    }
    if(!task) return <div className={errorStyles.erors}>This count is not associated with any task.</div>
    return(
        <div className={existing ? styles.countSegment : styles.segment}>
            {warning && <Warn onConfirm={() => confirmChange()} onCancel={() => setWarning(null)} />}
            {del && <ConfirmDelete name={`Counts for Task: ${task.indicator.name} for for ${task?.organization.name} Event: ${event.name}`} onConfirm={() => deleteCount()} onCancel={() => setDel(false)} />}
            {details && <CountDetail event={event} count={details} onClose={() => {setDetails(null); onSave()}}/>}
            <div onClick={() => setExpanded(!expanded)} className={styles.expander}>
                <h2>Counts for {task?.indicator.name} ({task?.organization.name})</h2>
                {!editing && 
                    <p>By {active.map((a) => (`${cleanLabels(a[0])}`)).join(', ')}</p>
                }
            </div>
            {expanded && <div>
                {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                {activeFlags && 
                    <div className={errorStyles.warnings}>
                        <h3>FLAGGED</h3>
                        <p>This count has unresolved flags. Please review the individual counts below for more information.</p>
                    </div>
                }
                {!activeFlags && pastFlags && 
                    <div className={errorStyles.success}>
                        <p>This interaction has had flags in the past. You can view flag history by clicking on a number below.</p>
                    </div>
                }
                {editing && <h3>Select your breakdowns here</h3>}
                {editing && <p><i>Please note that selecting too many breakdown categories may result in poor performance.</i></p>}
                {editing && <div className={styles.choices}>
                    {Object.keys(breakdowns).map((b) => {
                        if(b == 'subcategory_id') return
                        return <Checkbox key={b}
                            label={cleanLabels(b)} 
                            name={b} checked={breakdowns[b]} 
                            callback={(c) => changeBreakdowns(b, c)} 
                        />
                    })}
                </div>}
                <div>
                    {active.length === 0 && 
                        <div className={`${determineFlagged(counts[0]?.count_flags) ? styles.flaggedCount : styles.OK} ${styles.tooltipWrapper}`} onClick={() => !editing && counts[0]?.id && setDetails(counts[0])}>
                            <label htmlFor="count">Count</label>
                            {editing ? <input id="count" type="number" min={0}  value={counts[0]?.count} onChange={(e) => setCounts(prev => ({
                                ...prev,
                                0: {
                                ...prev[0],
                                count: e.target.value,
                                },
                            }))} /> : <p>{counts[0]?.count}</p>}
                            {determineFlagged(counts[0]?.count_flags) > 0 && (
                                <div className={styles.tooltip}>
                                {counts[0].count_flags.map((flag, i) => (
                                    <p key={i}>{flag.reason}</p>
                                ))}
                                </div>
                            )}
                        </div>
                    }
                    {active.length === 1 &&
                        active[0][1].labels.map((b, index) => {
                            const flagged = determineFlagged(counts[index]?.count_flags)
                            return (<div className={`${flagged ? styles.flaggedCount : styles.OK} ${styles.tooltipWrapper}`} onClick={() => !editing && counts[index]?.id && setDetails(counts[index])}>
                                <label htmlFor={b}>{b}</label>
                                {editing ? <input id={b} type="number" min={0} value={counts[index]?.count} onChange={(e) => setCounts(prev => ({
                                        ...prev,
                                        [index]: {
                                        ...prev[index],
                                        count: e.target.value,
                                        },
                                    }))} /> : <p>{counts[index]?.count}</p>}
                                    {flagged > 0 && (
                                        <div className={styles.tooltip}>
                                        {counts[index].count_flags.map((flag, i) => (
                                            <p key={i}>{flag.reason}</p>
                                        ))}
                                        </div>
                                    )}
                            </div>)
                        })
                    }
                    {
                        active.length > 1 &&
                        <table className={styles.countsTable}>
                            <thead>
                                <tr>
                                    {active.map((a, index) => {if(index != 0) return <th>{cleanLabels(a[0])}</th>})}
                                    {active[0][1].labels.map((c) => (<th>{c}</th>))}
                                </tr>   
                            </thead>
                            
                            <tbody> 
                                {rows.map((row, iter) => 
                                    <tr key={iter}>
                                        {row.map((r) => (<td>{r}</td>))}
                                        {active[0][1].labels.map((c, index) => {
                                            const pos = calcCellIndex(iter, index); 
                                            const flagged = determineFlagged(counts[pos]?.count_flags)
                                            return <td key={pos} className={`${flagged ? styles.flaggedCount : styles.OK} ${styles.tooltipWrapper}`} onClick={() => !editing && counts[pos]?.id && setDetails(counts[pos])}> 
                                                {flagged > 0 && (
                                                    <div className={styles.tooltip}>
                                                    {counts[pos].count_flags.map((flag, i) => (
                                                        <p key={i}>{flag.reason}</p>
                                                    ))}
                                                    </div>
                                                )}
                                                {editing ? <input id={pos} min={0} type="number" value={counts[pos]?.count} onChange={(e) => 
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
                        {editing && (saving ? <ButtonLoading /> : <button onClick={() => saveCount()}>Save</button>)}
                        <button onClick={() => editing ? handleCancel() : setEditing(true)}>{editing ? 'Cancel' : 'Edit'}</button>
                        {(flagging || resolving) && <input type='text' onChange={(e) => setReason(e.target.value)} value={reason} />}
                        {existing && !editing && !flagging && !resolving && <button className={errorStyles.warningButton} onClick={() => setFlagging(true)}>Add Flag for All Counts</button>}
                        {(flagging || resolving) && <button className={errorStyles.warningButton} onClick={() => changeFlags()}>Submit Flag</button>}
                        {existing && !editing && !resolving && !flagging && user.role ==='admin' && <button className={errorStyles.warningButton} onClick={() => setResolving(true)}>Resolve all flags for all counts</button>}
                        
                        {editing && existing && user.role ==='admin' && !del && <button className={errorStyles.deleteButton} onClick={() => setDel(true)}>Delete</button>}
                        {del && <ButtonLoading forDelete={true} />}
                    </div>
                </div>
            </div>}
        </div>
    )
}