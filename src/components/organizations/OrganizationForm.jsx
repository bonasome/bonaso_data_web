import React from 'react';
import errorStyles from '../../styles/errors.module.css';
import DynamicForm from '../reuseables/DynamicForm';

export default function OrganizationForm({ config, onSubmit, errors=[] }){
    return(
        <div>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <DynamicForm config={config} onSubmit={onSubmit} />
        </div>
    )
}   