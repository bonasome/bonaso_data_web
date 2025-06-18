import React from 'react';

export default function Checkbox({ label, name, checked= false, callback = null, disabled=false }){
    return(
        <div>
            <input type="checkbox" id={name} name={name} onChange={(e) => callback?.(e.target.checked)} checked={checked} disabled={disabled}/>
            <label htmlFor={name}>{label}</label>
        </div>
    )
}