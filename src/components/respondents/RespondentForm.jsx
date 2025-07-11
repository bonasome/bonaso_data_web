import React from 'react';
import errorStyles from '../../styles/errors.module.css';
import DynamicForm from '../reuseables/DynamicForm';
import { useState, useRef, useEffect } from 'react'

export default function RespondentForm({ config, onSubmit, onCancel }){
    const[errors, setErrors] = useState([]);
    const alertRef = useRef(null);

    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);
    return(
        <div>
            {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <DynamicForm config={config} onSubmit={onSubmit} onCancel={onCancel} onError={(e) => setErrors(e)}/>
        </div>
    )
}   