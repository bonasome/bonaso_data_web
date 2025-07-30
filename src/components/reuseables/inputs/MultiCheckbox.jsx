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
                {checked ? <IoCheckboxSharp /> : <GrCheckbox />}
                {label}
            </label>
        </div>
    );
}

export default function MultiCheckbox({ name, label, options, value, onChange, onBlur, errors, valueField='value', labelField='label' }) {
    console.log(value)
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

                return <MultiCheckboxItem
                    key={optionValue}
                    name={name}
                    label={optionLabel}
                    value={optionValue}
                    checked={value.includes(optionValue)}
                    onChange={toggleValue}
                    onBlur={onBlur}
                />
            })}
        </div>

    );
}