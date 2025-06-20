import styles from '../../styles/modals.module.css';
import errorStyles from '../../styles/errors.module.css';
import { useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';

export default function CreateClient({ onCreate, onCancel }){
    const[name, setName] = useState('');
    const[errors, setErrors] = useState([])

    const handleSubmit = async () => {
        if(name == ''){
            setErrors(['Client name is required.'])
            return;
        }
        try{
            const response = await fetchWithAuth(`/api/manage/clients/`, {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    'name': name,
                })
            });
            const returnData = await response.json();
            if(response.ok){
                onCreate(returnData.id, name);
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record indicator: ', err)
        }
    }
    return(
        <div className={styles.modal} >
            {errors.length > 0 && (
                <div className={errorStyles.errors}>
                    <ul>{errors.map((msg) => <li key={msg}>{msg}</li>)}</ul>
                </div>
            )}
            <label htmlFor='name'>Enter a name for this client.</label>
            <input type='text' name='name' id='name' value={name} onChange={(e) => setName(e.target.value)}/>
            <button onClick={() => handleSubmit()}>Save</button>
            <button onClick={() => onCancel()}>Cancel</button>
            <></>
        </div>
    )
}