import { useState, useEffect } from 'react';

import { useAuth } from '../../../contexts/UserAuth';

import fetchWithAuth from '../../../../services/fetchWithAuth';
import prettyDates from '../../../../services/prettyDates';


import ButtonHover from '../../reuseables/inputs/ButtonHover'
import Checkbox from '../../reuseables/inputs/Checkbox';
import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import UpdateRecord from '../../reuseables/meta/UpdateRecord';
import Messages from '../../reuseables/Messages';

import styles from './row.module.css';

import { ImPencil } from "react-icons/im";
import { IoIosSave } from "react-icons/io";
import { FcCancel } from "react-icons/fc";
export default function HIVStatus({ respondent, onUpdate }){
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [pos, setPos] = useState(respondent?.hiv_status?.hiv_positive || false);
    const [date, setDate] = useState(respondent?.hiv_status?.date_positive || '')
    const [errors, setErrors] = useState([]);
    
    const handleSubmit = async() => {
        setErrors([])
        if((!date || date === '') && pos){
            setErrors(['Please enter a date (select today if you are unsure).'])
            return;
        }
        const useDate = pos ? date : null;
        try{
            setSaving(true);
            const data = {'hiv_positive': pos, 'date_positive': useDate}
            const url = `/api/record/respondents/${respondent.id}/`; 
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({'hiv_status_data': data})
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate(data)
                setEditing(false);
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
            console.log(returnData)
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record respondent: ', err)
        }
        finally {
            setSaving(false);
        }
    }

    return(
        <div className={styles.row}>
            {!editing && <div style={{ display: 'flex', flexDirection: 'row' }}>
                <h3>HIV {pos ? `Positive since ${prettyDates(date)}`: 'Negative'}</h3>
                <div style={{marginLeft: 'auto'}}>
                {!['client'].includes(user.role) && <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit HIV Status'} />}
                </div>
            </div>}
            {editing && <div>
                <Messages errors={errors} />
                <Checkbox label='Is this person HIV Positive?' name='hiv_positive' onChange={(c) => setPos(c)} value={pos}/>
                {pos && <div>
                    <label htmlFor='date_positive'>When did this person become HIV Positve? (enter today if unsure).</label>
                    <input type='date' id='date_positive' name='date_positive' value={date} onChange={(e)=> setDate(e.target.value)}/>
                </div>}
                <div style ={{ display: 'flex', flexDirection: 'row'}}>
                    {!saving && <ButtonHover callback={() => handleSubmit()} noHover={<IoIosSave />} hover={'Save'} />}
                    {!saving && <ButtonHover callback={() => setEditing(false)} noHover={<FcCancel />} hover={'Cancel'} />}
                    {saving && <ButtonLoading />}
                </div>
            </div>}
            <UpdateRecord created_by={respondent.hiv_status?.created_by} updated_by={respondent.hiv_status?.updated_by}
                created_at={respondent.hiv_status?.created_at} updated_at={respondent.hiv_status?.updated_at} />
        </div>
    )
}