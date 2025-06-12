import styles from '../../styles/reuseableComponents.module.css'
import { useState } from 'react'
import validate from '../../../services/validate'

export default function Input({ name, label=null, type='text', callback=null, required=false, placeholder='', maxLength=null }){
    const validTypes = ['number', 'text', 'email', 'phone', 'date']
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

    const checkInput = (event) => {
        let inputErrors = validate(event.target, phone)
        setErrors(inputErrors);
    }

    return(
        <div className={styles.input}>
            <label htmlFor={name}>{title}</label>
            <input type={inputType} id={name} name={name} onChange={(event) => callback(event)} onKeyUp={(event) => checkInput(event)} placeholder={autoPlaceholder} required={required} max={maxLength ? maxLength : null}/>
            <div className={styles.errors}>
                {errors && <ul>{errors.map((e)=><li key={e}>{e}</li>)}</ul>}
            </div>
        </div>
    )
}