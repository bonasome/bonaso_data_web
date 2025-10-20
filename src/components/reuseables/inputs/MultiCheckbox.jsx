import Messages from '../Messages';
import Tooltip from '../Tooltip';

import styles from './checkbox.module.css';

import { GrCheckbox } from "react-icons/gr";
import { IoCheckboxSharp } from "react-icons/io5";


function MultiCheckboxItem({ name, label, checked, onChange, value }) {
    /*
    Helper component that manages a single checkbox
    - name (string): html/id for this specific checkbox
    - label (string): label to display alongside checkbox
    - onChange (function): what to do when this is checked or unchecked
    - value (boolean): is this thing checked
    */
     return (
        <div className={styles.checkbox}>
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={() => onChange(value)}
                id={`${name}-${value}`}
                style={{ display: "none" }}
            />
            <label htmlFor={`${name}-${value}`}>
                {checked ? <IoCheckboxSharp style={{ marginRight: 12}} /> : <GrCheckbox style={{ marginRight: 12}}/>}
                {label}
            </label>
        </div>
    );
}

//multiselect checkbox
export default function MultiCheckbox({ name, label, options, value, onChange, onBlur, errors, valueField='value', labelField='label', tooltip=null, warnings=[] }) {
    /*
    Component that allows a user to select multiple values from a set of options. Returns an array of values.
    - name (string): name the input should use (for html name/id)
    - label (string): what the user should see
    - options (array, optional): what are the options as an array of objects with a value and label field
    - labelField (string, optional): used with options/IndexComponent, tells the component what key in 
        the object to use as the label (default, label)
    - valueField (string, optional): used with options/IndexComponent, tells the coomponent what key in 
        the object to use as the value (default, value)
    - onBlur (function, RHF): onBlur
    - errors (array, RHF): field errors
    - tooltip (string, optional): text to display when hovering over a tooltip (no tooltip will show if left null)
    */

    //what to do when a MultiCheckboxItem updates (add or remove from value array)
    const toggleValue = (val) => {
        if (value?.includes(val)) {
            onChange(value.filter(v => v !== val));
        } 
        else {
            onChange([...value, val]);
        }
    };
    if(!options || options.length ==0) return <></>

    return (
        <div>
            <Messages errors={errors} warnings={warnings} />
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <p>{label} (Select all that apply.)</p>
                {tooltip && <Tooltip msg={tooltip} />}
            </div>
            {options.map((o) => {
                const optionValue = o[valueField];
                const optionLabel = o[labelField];
                const valueStr = Array.isArray(value) ?  value?.map((v) => v.toString()) : [];
                {/* map each item in options as its own checkbox, then use its checked state to add or 
                    remove it from the value array */}
                return <MultiCheckboxItem
                    key={optionValue}
                    name={name}
                    label={optionLabel}
                    value={optionValue}
                    checked={valueStr?.includes(optionValue?.toString())}
                    onChange={toggleValue}
                    onBlur={onBlur}
                />
            })}
        </div>

    );
}