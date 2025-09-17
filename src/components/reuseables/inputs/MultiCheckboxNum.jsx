import Messages from '../Messages';
import Tooltip from '../Tooltip';

import styles from './checkbox.module.css';

import { GrCheckbox } from "react-icons/gr";
import { IoCheckboxSharp } from "react-icons/io5";

export default function MultiCheckboxNum({ options, name, value, label, onChange, error=[], tooltip=null }) {
    /*
    Component that allows a user to selected multiple options. On checking an option, a numeric input will appear.
    This component is designed pretty much exclusively to work with building interactions that have subcategories
    and require a numberic component. It will return an array of objects like 
        {id: null, subcategory: {id: 1, name: 'cat'}, numeric_component: 2}
    - name (string): name the input should use (for html name/id)
    - label (string): what the user should see
    - options (array, optional): will take a set of indicator subcategories (id/name)
    - error (array, RHF): field errors
    - tooltip (string, optional): text to display when hovering over a tooltip (no tooltip will show if left null)
    */

    //toggle what to do when a checkbox is checked or unchecked
    const toggleValue = (val) => {
        //the value array stores more data than the options array (which is equivalent to just the subcategory part of value)
        const updated = value?.find(v => val?.id == v?.subcategory?.id)
            ? value?.filter(v => v?.subcategory?.id != val?.id)
            : [...value, {id: null, subcategory: {id: val.id, name: val.name}, numeric_component: ''}];
        onChange(updated);
    };

    //sepreate function to handle a number being inputted
    const changeNumber = (val, num) => {
        const toUpdate = value?.find(v => val?.id == v.subcategory?.id);
        const others = value?.filter(v => val?.id != v.subcategory?.id);
        const updated = { ...toUpdate, numeric_component: num };
        onChange([...others, updated]);
    };

    return (
        <div>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <p>{label} (Select all that apply.)</p>
                {tooltip && <Tooltip msg={tooltip} />}
            </div>
            {options.map(item => {
                const number = String(
                    value?.find(v => item?.id == v?.subcategory?.id)?.numeric_component ?? ''
                );
                const checked = value?.find(v => item?.id == v?.subcategory?.id);

                return (
                    <div className={styles.checkbox}>
                        <input
                            type="checkbox"
                            name={`subcats-${item.id}`}
                            checked={checked}
                            onChange={() => toggleValue(item)}
                            id={`subcats-${item.id}`}
                            style={{ display: "none" }}
                        />
                        <label htmlFor={`subcats-${item.id}`}>
                            {checked ? <IoCheckboxSharp style={{ marginRight: 12}} /> : 
                                <GrCheckbox style={{ marginRight: 12}}/>}
                            {item.name}
                        </label>
                        {checked && <input name={`number-${item.id}`} id={`number-${item.id}`} aria-label={`number-${item.id}`} type="number" value={number} onChange={(e) => changeNumber(item, e.target.value)} />}
                    </div>
                )

            })}
            {error && <Messages errors={error} />}
        </div>
    );
}