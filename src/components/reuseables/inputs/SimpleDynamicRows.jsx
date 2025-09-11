import { useState, useEffect, useImperativeHandle, useRef, forwardRef } from "react";

import Messages from '../Messages';
import Tooltip from '../Tooltip';

import styles from './simpleDynamicRows.module.css'


// Row component
function Row({ row, onCollect, onRemove, index, count }) {
    /*
    Row with one value and a set of buttons that can remove/deprecate the row.
    - row (object): information about the row, works like a value
    - onCollect (function): what to do when its time to collect the information and send it to the parent
    - onRemove (function): how to remove the row
    - index (integer): row position (for numbering)
    - count (integer): number of rows, disable remove if only one row is left
    */
    const [value, setValue] = useState(row.value); //text entered by the user
    const [id, setID] = useState(row?.id || null); //id of the row for tracking
    const [deprecated, setDeprecated] = useState(false); //is the row marked as deprecated

  // Register a collector function with the parent
    useEffect(() => {
        onCollect(() => {
        if (value === '') return { error: true };
        return { id, value, deprecated };
        });
    }, [value, deprecated, id, onCollect]);

    return (
        <div className={styles.row}>
            <label htmlFor={row.key}>{index+1}.</label>
            {deprecated ? <p>{value} (Deprecated)</p> :
            <input
                id={row.key}
                type="text"
                name={row.key}
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />}
            {/* this is used for creating indicator subcategories, and 
                if there is an existing value, we don't want people deleting subcategories
                since they may be linked to old data, so we deprecate them instead */}
            {id ? <button type="button" onClick={() => setDeprecated(!deprecated)}>{deprecated ? 'Mark as Active' : 'Deprecate'}</button>:
             <button type="button" onClick={() => onRemove(row.key)} disabled={count === 1}>Remove</button>}
        </div>
  );
}


const SimpleDynamicRows = forwardRef(({ label, existing=[], header=null, tooltip=null }, ref) => {
    /*
    ForwardRef componentthat allows a user to add/remove a dynamic number of inputs that are returned as an 
    array of objects.
    - label (string): label to display at top of component
    - existing (array, optional): existing values
    - header (string, optional): additional header text for more clarity
    - tooltip (string, optional): display more information in a tooltip
     */
    const [rows, setRows] = useState([{ key: Date.now().toString(), value: "" }]); //values the user has typed, stored as an array of objects with a random ID and a value
    const [errors, setErrors] = useState([]);

    const getRow = useRef({}); //fetches a value from the above Row component

    //populate existing values if provided
    useEffect(() => {
        if(existing.length > 0){
            const existingRows = existing.map((ex) => ({key: Date.now().toString() + Math.random().toString(), value: ex.name, id: ex.id }));
            setRows(existingRows);
        }
    }, [existing])

    // Expose collect method to parent
    useImperativeHandle(ref, () => ({
        collect: () => {
        const rowErrors = [];
        const results = [];

        for (const row of rows) {
            const fn = getRow.current[row.key];
            const result = fn ? fn() : null;
            if (!result || result.error) {
                rowErrors.push(`Row "${row.value}" is invalid`);
            } 
            else {
                console.log(result)
                results.push({name: result.value, id: result?.id || null, deprecated: result?.deprecated || null});
            }
        }
        if (rowErrors.length > 0) {
            setErrors(rowErrors);
            return null;
        }
        setErrors([]);
        return results;
        },
    }));

    //add a new row by appending a new object to rows
    const addRow = () => {
        setRows(prev => [...prev, { key: Date.now().toString(), value: '' }]);
    };

    //remove a row
    const removeRows = (key) => {
        setRows(prev => prev.filter(row => row.key !== key));
        delete getRow.current[key];
    };

    return (
        <div className={styles.container}>
            <Messages errors={errors} />
            {header && <h3>{header}</h3>}
            <div style={{ display: 'flex', flexDirection: 'row'}}>
                <p>{label}</p>
                {tooltip && <Tooltip msg={tooltip} />}
            </div>
            {rows.map((row, index) => (
                <Row
                key={row.key}
                row={row}
                count={rows.length}
                label={label}
                index={index}
                onRemove={removeRows}
                onCollect={(fn) => { getRow.current[row.key] = fn; }}
                />
            ))}
            <button type="button" onClick={addRow}>Add Row</button>
        </div>
    );
});

export default SimpleDynamicRows;









//simple my ass