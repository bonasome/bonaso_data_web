import React from 'react';
import { useState, useEffect } from 'react';
import styles from './checkbox.module.css';
import { GrCheckbox } from "react-icons/gr";
import { IoCheckboxSharp } from "react-icons/io5";

export default function Checkbox({ label, name, checked=false, callback = null, disabled=false }){
    const [isChecked, setIsChecked] = useState(false)

    useEffect(() => {
        if(checked == true) setIsChecked(true);
        else if(checked == false) setIsChecked(false);
        else setIsChecked(false);
    }, [checked]);

    return(
        <div className={styles.checkbox}>
            {isChecked ? <IoCheckboxSharp onClick={() => {setIsChecked(false); callback(false)}}/> : 
            <GrCheckbox onClick={() => {setIsChecked(true); callback(true)}}/>}
            <label htmlFor={name}>{label}</label>
        </div>
    )
}