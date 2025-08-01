import styles from './checkbox.module.css';

import { GrCheckbox } from "react-icons/gr";
import { IoCheckboxSharp } from "react-icons/io5";

import Messages from '../Messages';

export default function Checkbox({ name, label, value, onChange, onBlur, errors = [] }) {
  return (
    <div>
        <label htmlFor={name} className={styles.checkbox}>
            <input
                name={name} id={name} type="checkbox" style={{ display: "none" }}
                checked={value} onChange={e => onChange(e.target.checked)} onBlur={onBlur}
            />
            {value ? <IoCheckboxSharp style={{ marginRight: 12}}/> : <GrCheckbox style={{ marginRight: 12}}/>}
            {label}
        </label>
        <Messages errors={errors} />
    </div>
  );
}