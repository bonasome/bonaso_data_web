import Messages from "../Messages";
import Tooltip from '../Tooltip';

import styles from '../../../styles/form.module.css';

import { IoMdRadioButtonOff, IoMdRadioButtonOn } from "react-icons/io";

//single select radio buttons from a list of options
export default function RadioButtons({ name, label, value, onChange, options, errors = [], valueField = "value", labelField = "label", tooltip=null}) {
    /*
    Component that allows a user to select a single item from a list of options.
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

    return (
        <div className={styles.radio}>
            <div style={{ display: 'flex', flexDirection: 'row'}}>
                <label>{label}</label>
                {tooltip && <Tooltip msg={tooltip} style={{ marginBottom: 20}}/>}
                <p></p>
            </div>
            {options.map((option, index) => {
                const optionValue = option[valueField];
                const optionLabel = option[labelField];
                const isSelected = value === optionValue;

                return (
                    <div key={index} style={{ display: "flex", flexDirection: "row" }}>
                        <label htmlFor={`${name}__${optionValue}`} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {/* a special onClick is used so that the user can clear their selection by clicking again */}
                        <input
                            id={`${name}__${optionValue}`}
                            type="radio"
                            name={name}
                            value={optionValue}
                            checked={isSelected}
                            onClick={() => {
                                onChange(isSelected ? null : optionValue);
                            }}
                            style={{ display: "none" }}
                        />
                        <div style={{ margin: 4}}>
                            {isSelected ? <IoMdRadioButtonOn fontSize={20} /> : <IoMdRadioButtonOff fontSize={20}/>}
                        </div>
                        {optionLabel}
                        </label>
                    </div>
                );
            })}

            <Messages errors={errors} />
        </div>
    );
}