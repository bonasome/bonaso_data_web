import React from 'react';
import { useState, useEffect } from 'react'
import validate from '../../../services/validate'

export default function Input({ name, label=null, type='text', callback=null, required=false, placeholder='', maxLength=null, value=null }){
    const validTypes = ['number', 'text', 'email', 'phone', 'date']
    const [inputValue, setInputValue] = useState('');
    let inputType = type
    let phone = false;
    let autoPlaceholder = placeholder
    let title = label
    if(!title){
        title = name.charAt(0).toUpperCase() + name.slice(1);
    }
    if(!required){
        title = label + ' (Optional)';
    }
    if(type == 'phone'){
        inputType = 'text';
        phone = true;
        placeholder ? autoPlaceholder=placeholder : autoPlaceholder = '+267 71234567' ;
    }
    if(type == 'email'){
         placeholder ? autoPlaceholder=placeholder : autoPlaceholder = 'person@webiste.com';
    }
    if(!validTypes.includes(type)){
        console.warn(`Invalid type "${type}" provided. Options are text, number, email.`);
        type='text';
    };

    const [errors, setErrors] = useState([]);
    useEffect(() => {
        setInputValue(value || '')
    }, [value])

    const checkInput = (event) => {
        let inputErrors = validate(event.target, phone)
        setErrors(inputErrors);
    }

    const handleChange = (event) => {
        const newVal = event.target.value
        setInputValue(newVal)
        if (callback) callback(event)
    }
    return(
        <div>
            <label htmlFor={name}>{title}</label>
            <input type={inputType} id={name} name={name} onChange={handleChange} onKeyUp={(event) => checkInput(event)} placeholder={autoPlaceholder} required={required} max={maxLength ? maxLength : null} value={inputValue}/>
            <div>
                {errors && <ul>{errors.map((e)=><li key={e}>{e}</li>)}</ul>}
            </div>
        </div>
    )
}