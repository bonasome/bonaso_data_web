import { useState, useEffect } from 'react';

import { useAuth } from '../../../contexts/UserAuth';

import fetchWithAuth from '../../../../services/fetchWithAuth';
import prettyDates from '../../../../services/prettyDates';

import ButtonHover from '../../reuseables/inputs/ButtonHover'
import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import UpdateRecord from '../../reuseables/meta/UpdateRecord';
import Messages from '../../reuseables/Messages';


import styles from './row.module.css';

import { MdLibraryAdd } from "react-icons/md";
import { FaTrashAlt } from "react-icons/fa";
import { ImPencil } from "react-icons/im";
import { IoIosSave } from "react-icons/io";
import { FcCancel } from "react-icons/fc";

function PregnancyRow({ respondent, onError, existing=null, onUpdate, onCancel }){
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    const [termBegan, setTermBegan] = useState(existing?.term_began || '');
    const [termEnded, setTermEnded] = useState(existing?.term_ended || '');
    const [editing, setEditing] = useState(existing ? false : true);
    
    useEffect(() => {
        onError(errors);
    }, [errors]);

    const handleDelete = async() => {
        setErrors([]);
        if(!existing) return;
        let data = {'term_began': null, term_ended: null, 'id': existing.id}
        send(data)
    }

    const handleSubmit = () => {
        setErrors([]);
        if(!termBegan || termBegan == ''){ 
            setErrors(['Pregnancy must include Term Began.']);
            return
        }
        let data = {'term_began': termBegan, 'term_ended': termEnded === '' ? null : termEnded, 'id': existing ? existing.id : null}
        send(data)
    }

    const send = async(data) => {
        try{
            setSaving(true);
            const url = `/api/record/respondents/${respondent.id}/`; 
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({'pregnancy_data': [data]})
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate()
                setEditing(false);
                setErrors([])
            }
            else{
                console.log(returnData)
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record respondent: ', err)
        }
        finally{
            setSaving(false)
        }
    }

    return(
        <div className={styles.row}>
            <div style={{display: 'flex', flexDirection: 'row' }}>
                {!editing && <p>Pregnancy started on {prettyDates(termBegan)} {termEnded && `ended on ${prettyDates(termEnded)}`}</p>}
                {editing && <div>
                    <label htmlFor={'term_began'}>Term Began</label>
                    <input type='date' id='term_began' name='term_began' value={termBegan} onChange={(e)=> setTermBegan(e.target.value)}/>
                    <label htmlFor={'term_ended'}>Term Ended</label>
                    <input type='date' id='term_ended' name='term_ended' value={termEnded} onChange={(e)=> setTermEnded(e.target.value)}/>
                    <div style ={{ display: 'flex', flexDirection: 'row'}}>
                    {!saving && <ButtonHover callback={() => handleSubmit()} noHover={<IoIosSave />} hover={'Save'} />}
                    {!saving && <ButtonHover callback={() => onCancel()} noHover={<FcCancel />} hover={'Cancel'} />}
                    {saving && <ButtonLoading /> }
                    </div>
                </div>}
                <div style ={{ marginLeft: 'auto', display: 'flex', flexDirection: 'row' }}>
                    {existing && !['client'].includes(user.role) && !editing && <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Details'} /> }
                    {existing && !['client'].includes(user.role) && !editing && <ButtonHover callback={() => handleDelete()} noHover={<FaTrashAlt />} hover={'Delete Pregnancy'} forDelete={true}/>}
                </div>
            </div>
            {existing &&  <UpdateRecord created_by={existing.created_by} updated_by={existing.updated_by}
                created_at={existing.created_at} updated_at={existing.updated_at} />}
        </div>
    )
}
export default function Pregnancies({ respondent, onUpdate }){
    const { user } = useAuth();
    const [errors, setErrors] = useState([]);
    const [pregnancies, setPregnancies] = useState(respondent?.pregnancies || [])
    const [adding, setAdding] = useState(false);

    const update = async () => {
        try {
            console.log('fetching respondent details...');
            const response = await fetchWithAuth(`/api/record/respondents/${respondent.id}/`);
            const data = await response.json();
            if(response.ok){
                setPregnancies(data?.pregnancies || [])
                onUpdate(data?.pregnancies || [])
            }
            else{
                navigate(`/not-found`);
            }
            
        } catch (err) {
            console.error('Failed to fetch respondent: ', err);
        } 
        setAdding(false);
    }
    return(
        <div>
            <Messages errors={errors} />
            {adding && <PregnancyRow respondent={respondent} onError={(e) => setErrors(e)} onUpdate={()=>update()} onCancel={() => {setAdding(false); setErrors([])}}/>}
            {pregnancies.length > 0 && pregnancies.map((p) => (<PregnancyRow respondent={respondent} onError={(e) => setErrors(e)} existing={p} onUpdate={()=>update()} />))}
            {pregnancies.length === 0 && <p>No recorded pregnancies.</p>}
            {!adding && !['client'].includes(user.role) && <ButtonHover callback={() => setAdding(true)} noHover={<MdLibraryAdd />} hover={'Record New Pregnancy'} />}
        </div>
    )
}