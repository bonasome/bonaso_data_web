import styles from '../../../styles/modals.module.css';
import errorStyles from '../../../styles/errors.module.css';
import { useState } from 'react';
import fetchWithAuth from '../../../../services/fetchWithAuth';

export default function CreateClient({ onCreate, onCancel }){
    const[name, setName] = useState('');
    const [fullName, setFullName] = useState('');
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
                    'full_name': fullName
                })
            });
            const returnData = await response.json();
            if(response.ok){
                const client = {'id': returnData.id, 'name': name, 'full_name': fullName}
                onCreate(client);
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
            <h2>Creating New Client</h2>
            <label htmlFor='name'>Client Name (Short)</label>
            <input type='text' name='name' id='name' value={name} onChange={(e) => setName(e.target.value)}/>
            <label htmlFor='full_name'>Client Name (Full)</label>
            <input type='text' name='full_name' id='name' value={fullName} onChange={(e) => setFullName(e.target.value)}/>
            <button onClick={() => handleSubmit()}>Save</button>
            <button onClick={() => onCancel()}>Cancel</button>
            <></>
        </div>
    )
}