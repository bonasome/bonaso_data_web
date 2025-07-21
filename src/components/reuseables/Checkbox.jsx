import React from 'react';
import { useState } from 'react';
import styles from './checkbox.module.css';
import { GrCheckbox } from "react-icons/gr";
import { IoCheckboxSharp } from "react-icons/io5";

export default function Checkbox({ label, name, checked= false, callback = null, disabled=false }){
    const [isChecked, setIsChecked] = useState(checked)
    return(
        <div className={styles.checkbox}>
            {checked ? <IoCheckboxSharp onClick={() => {setIsChecked(false); callback(!isChecked)}}/> : 
            <GrCheckbox onClick={() => {setIsChecked(true); callback(!isChecked)}}/>}
            <label htmlFor={name}>{label}</label>
        </div>
    )
}