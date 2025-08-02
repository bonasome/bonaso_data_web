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
import prettyDates from "../../../services/prettyDates";
import Messages from '../reuseables/Messages';
import FlagDetailModal from '../flags/FlagDetailModal';
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

export default function Counts({ event, breakdownOptions, task, onSave, onCancel, onDelete, existing=null}) {
    const { user } = useAuth(); 

    //determine which params are "actively" being used to create demographic splits
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
    //create map of values/labels for each category (as well as preference for which should appear at the column)
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
    });

    //table meta
    const [editing, setEditing] = useState(existing ? false: true);
    const [del, setDel] = useState(false);
    const [warning, setWarning] = useState(null); //controls warning modal that appears if a breakdown change will wipe counts
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(existing ? false : true);

    const [active, setActive] = useState([]);
    const [rows, setRows] = useState([]);
    const [counts, setCounts] = useState({});
    
    //existing for edits
    const [existingMap, setExistingMap] = useState([]); //breakdown "keys"
    const [existingCounts, setExistingCounts] = useState([]); //array of counts corresponding to a key
    const [existingIDs, setExistingIDs] = useState([]); //id corresponding to a key
    const [existingFlags, setExistingFlags] = useState([]); //flag array corresponding to a key
    
    const [pastFlags, setPastFlags] = useState(false); //tracker to tell if a count has flags
    const [activeFlags, setActiveFlags] = useState(false); //tracker to tell if a count has active flags
    
    const [details, setDetails] = useState(null); // when an individual count is clicked, it sets this state to that info, which is used to build the flag modal
    const [flagging, setFlagging] = useState(false); //controls flag create modal

    //helper function that creates keys/ids/flags map from existing counts
    const mapExisting = () => {
        let ids = []
        let combos = []
        let countsArray = []
        let flagsArray = []
        Object.keys(existing).forEach((group) => {
            let groupMap = {}
            Object.keys(existing[group]).forEach((ind) => {
                if(ind === 'id') ids.push(existing[group][ind]); //grab and append the id
                if(ind === 'count') countsArray.push(existing[group][ind]); //grab and append the count (value for the input)
                if(ind === 'flags'){ //see if there are any flags
                    const hasFlags = existing[group][ind].length > 0
                    if(hasFlags) setPastFlags(true); //is has flags mark it as such
                    if(determineFlagged(existing[group][ind])) setActiveFlags(true); //mark active seperate (for color coding)
                    flagsArray.push(existing[group][ind] || []) //push to array to link to table 
                }
                if(existing[group][ind] != null && !['created_by', 'created_at', 'updated_by', 'updated_at', 'id', 'event', 'count', 'task', 'task_id', 'flags'].includes(ind)){ //exclude fields that are not breakdowns
                    const key = ind === 'subcategory' ? 'subcategory_id' : ind 
                    groupMap[key] = existing[group][ind] //create a unique key
                }
            })
            combos.push(groupMap)
        })
        setExistingIDs(ids)
        setExistingCounts(countsArray)
        setExistingFlags(flagsArray)
        setExistingMap(combos)
        
    }
    //helper function to determine which breakdowns are checked
    const checkActive = () => {
        if(existingMap.length > 0){
            const fields = Object.keys(existingMap[0]).map((e) => (e))
            fields.forEach(field => {
                setBreakdowns(prev => ({...prev, [field]: true}))
            })
        }
    }
    //create a cartesian product
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

    //on change, if there are any values with counts, set a warning, temprarily store the presumptive change
    const changeBreakdowns = (key, value) => {
        const warn = Object.keys(counts).some((c) => counts[c].count !== '');
        if(warn){
            setWarning({key: key, value: value})
        }
        else{
            confirmChange(key, value)
        }
        
    }
    //on confirm, apply the change
    const confirmChange = (key, value) => {
        if(!key) key = warning.key
        if(value == null || value == 'undefined') value = warning.value
        setBreakdowns(prev => ({...prev, [key]: value}))
        setWarning(null)
    }  

    //function that sets the breakdowns and runs map existing
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

    //recheck active with changes to the existing map
    useEffect(() => {
        if (existingMap.length > 0) {
            checkActive();
        }
    }, [existingMap]);

    //create a cartesian product of all active breakdowns to build our data map
    useEffect(() => {
        const activeSplits = Object.entries(breakdownSplits)
            .filter(([key]) => breakdowns[key])
            .sort(([, a], [, b]) => a.col - b.col);
        setActive(activeSplits)
        mapCurrent(activeSplits)
        let labelsMap = activeSplits.map((a) => (a[1].labels))
        labelsMap = labelsMap.filter((m, index) => index != 0)
        setRows(cartesianProduct(labelsMap)) //create list of all possible row combinations (save the first row which will appear in the columns)
    }, [breakdowns, existingCounts, existingMap])

    //check if two keys are equal (compare existing keys to the map above)
    function shallowEqual(obj1, obj2) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;
        return keys1.every(key => obj1[key] === obj2[key]);
    }

    //create a "map" of each possible key, mapping to to a position, also check if it matches any existing data
    //based on the key of breakdown fields
    const mapCurrent =(splits) => {
        if(!task) return
        //if there are no breakdowns (just a number), any exisitng must be the value
        if(splits.length == 0) {
            let count = '';
            let flags = []
            let id = null;

            if(existing){
                count = existing[Object.keys(existing)[0]].count
                flags = existing[Object.keys(existing)[0]].flags
                id = existing[Object.keys(existing)[0]].id
            }
            setCounts({0: {count: count, task_id: task.id, flags: flags, id: id}}); 
            return;
        }
        //one dimension split, fund the matching value if it exists
        if(splits.length === 1){
            const map = {}
            const split = splits[0][0]
            const valuesArray = splits.map((s) => (s[1].values))
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
                            flags = m.flags
                        }
                    })
                }
                else{
                    map[index] = {[split]: v, count: count, task_id: task.id, flags: flags, id: id}
                }
            })
            setCounts(map)
        }
        //two dimensions on gets tricky...
        const splitMap = splits.map((s) => s[0]) //build a map of the split categories
        const valuesArrays = splits.map((s) => (s[1].values)) //their vals too
        const valuesMap = cartesianProduct(valuesArrays) //create the cartesian product
        const map = {}
        for(let i=0; i < valuesMap.length; i++){
            map[i] = {} //create a obj for each key, using the index
            for(let j = 0; j < splitMap.length; j++){
                map[i][splitMap[j]] = valuesMap[i][j] //create the map
            }
            if(existing){
                let found = null
                existingMap.forEach((m, index) => {
                    if(shallowEqual(map[i], m)) found = index //try to match key to existing 
                })
                if(found !== null){ //if it finds something, populate flags/id/count
                    map[i].count = existingCounts[found];
                    map[i].flags = existingFlags[found] 
                    map[i].id = existingIDs[found] 
                }
                else{  //else set defaults
                    map[i].count = ''
                    map[i].flags = []
                }
            }
            else{ //also set defaults if no existing
                map[i].count = ''
                map[i].flags = []
            }
            map[i].task_id = task.id //finally set the task
        }
        setCounts(map)
    }

     
    //upload the count
    const saveCount = async() => {
        setErrors([])
        const warn = Object.keys(counts).every((c) => counts[c].count === ''); //filter out empty counts
        if(warn) {
            setErrors(['You must enter at least one value to save a count.']);
            return;
        }
        const data = [];
        Object.keys(counts).forEach((c) => {if(counts[c].count != '') data.push(counts[c])}); //convert to array and 
        try{
            console.log('submitting data...')
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
                setEditing(false);
                onSave(); //run update function
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
    //delete a count
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

    //calculate a cells position from the iteration (since cols)
    const calcCellIndex = (iter, index) => {
        const n = rows.length
        return n*index + iter
    }
    //on cancel, stop editing
    const handleCancel = () => {
        onCancel();
        if(existing) mapCurrent(active);
        setEditing(false);
    }

    //helper to determine what flags are what
    const determineFlagged = (flags) => {
        if(!flags || flags.length === 0) return false
        const active = flags.filter(f => f.resolved === false)
        if(active.length > 0) return true
        return false
    }

    if(!task) return <></> //should never happen unless something has gone very wrong
    
    return(
        <div className={existing ? styles.countSegment : styles.segment}>
            {warning && <Warn onConfirm={() => confirmChange()} onCancel={() => setWarning(null)} />}

            {del && <ConfirmDelete name={`Counts for Task: ${task.indicator.name} for for ${task?.organization.name} Event: ${event.name}`} onConfirm={() => deleteCount()} onCancel={() => setDel(false)} />}
            
            {details && <FlagDetailModal flags={details.flags} model={'events.demographiccount'} id={details.id} onClose={() => {setDetails(null); onSave()}}/>}
            
            <div onClick={() => setExpanded(!expanded)} className={styles.expander}>
                <h2>Counts for {task?.indicator.name} ({task?.organization.name})</h2>
                {!editing && 
                    <p>By {active.map((a) => (`${cleanLabels(a[0])}`)).join(', ')}</p>
                }
            </div>

            {expanded && <div>
                <Messages errors={errors} />
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
                            name={b} value={breakdowns[b]} 
                            onChange={(c) => changeBreakdowns(b, c)} 
                        />
                    })}
                </div>}

                <div>
                    {/*If only one value, return a single input */}
                    {active.length === 0 && 
                        <div className={`${determineFlagged(counts[0]?.flags) ? styles.flaggedCount : styles.OK} ${styles.tooltipWrapper}`} onClick={() => !editing && counts[0]?.id && setDetails(counts[0])}>
                            <label htmlFor="count">Count</label>
                            {editing ? <input id="count" type="number" min={0}  value={counts[0]?.count} onChange={(e) => setCounts(prev => ({
                                ...prev,
                                0: {
                                ...prev[0],
                                count: e.target.value,
                                },
                            }))} /> : <p>{counts[0]?.count}</p>}
                            {determineFlagged(counts[0]?.flags) > 0 && (
                                <div className={styles.tooltip}>
                                {counts[0].flags.map((flag, i) => (
                                    <p key={i}>{flag.reason}</p>
                                ))}
                                </div>
                            )}
                        </div>
                    }

                    {/*If one breakdown, just list as a row of inputs */}
                    {active.length === 1 &&
                        active[0][1].labels.map((b, index) => {
                            const flagged = determineFlagged(counts[index]?.flags)
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
                                        {counts[index].flags.map((flag, i) => (
                                            <p key={i}>{flag.reason}</p>
                                        ))}
                                        </div>
                                    )}
                            </div>)
                        })
                    }
                     {/*Now we need a whole thing */}
                    {active.length > 1 &&
                        <table className={styles.countsTable}>
                            <thead>
                                <tr>
                                    {active.map((a, index) => {if(index != 0) return <th key={a[0]}>{cleanLabels(a[0])}</th>})}
                                    {active[0][1].labels.map((c) => (<th>{c}</th>))}
                                </tr>   
                            </thead>
                            
                            <tbody> 
                                {rows.map((row, iter) => 
                                    <tr key={iter}>
                                        {row.map((r) => (<td>{r}</td>))}
                                        {active[0][1].labels.map((c, index) => {
                                            const pos = calcCellIndex(iter, index); 
                                            const flagged = determineFlagged(counts[pos]?.flags)
                                            return <td key={pos} className={`${flagged ? styles.flaggedCount : styles.OK} ${styles.tooltipWrapper}`} onClick={() => !editing && counts[pos]?.id && setDetails(counts[pos])}> 
                                                {flagged > 0 && (
                                                    <div className={styles.tooltip}>
                                                    {counts[pos].flags.map((flag, i) => (
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
                        {editing && existing && user.role ==='admin' && !del && <button className={errorStyles.deleteButton} onClick={() => setDel(true)}>Delete</button>}
                    </div>
                </div>
            </div>}
        </div>
    )
}