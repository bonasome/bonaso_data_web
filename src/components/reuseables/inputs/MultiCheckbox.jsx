import { GrCheckbox } from "react-icons/gr";
import { IoCheckboxSharp } from "react-icons/io5";
import styles from './checkbox.module.css';
import Messages from '../Messages';

function MultiCheckboxItem({ name, label, checked, onChange, value }) {
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
export default function MultiCheckbox({ name, label, options, value, onChange, onBlur, errors, valueField='value', labelField='label' }) {
    const toggleValue = (val) => {
        if (value.includes(val)) {
            onChange(value.filter(v => v !== val));
        } 
        else {
            onChange([...value, val]);
        }
    };

    return (
        <div>
            <Messages errors={errors} />
            <p>{label}</p>
            {options.map((o) => {
                const optionValue = o[valueField];
                const optionLabel = o[labelField];
                const valueStr = value.map((v) => v.toString())

                return <MultiCheckboxItem
                    key={optionValue}
                    name={name}
                    label={optionLabel}
                    value={optionValue}
                    checked={valueStr.includes(optionValue.toString())}
                    onChange={toggleValue}
                    onBlur={onBlur}
                />
            })}
        </div>

    );
}