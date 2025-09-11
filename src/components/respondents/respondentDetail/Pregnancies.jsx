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

function PregnancyRow({ respondent, onError,  onUpdate, onCancel, existing=null, }){
    /*
    Helper component that displays a single pregnancy.
    - respondent this pregnancy belongs to
    - onError (function): pass errors up to the parent component
    - onUpdate (function): handle saving data
    - onCancel (function): handle cancelling an edit/create operation
    - existing (object, optional): the existing values to edit
    */
   //context
    const { user } = useAuth();

    const [termBegan, setTermBegan] = useState(existing?.term_began || ''); //start of pregnancy date
    const [termEnded, setTermEnded] = useState(existing?.term_ended || ''); //end of pregnancy date

    //component meta
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    const [editing, setEditing] = useState(existing ? false : true);
    
    //pass errors up whenever the array changes
    useEffect(() => {
        onError(errors);
    }, [errors]);

    //handle deleting this pregnancy
    const handleDelete = async() => {
        setErrors([]);
        if(!existing) return; //delete is not allowed for pregnancies that do not exist in the server
        let data = {'term_began': null, term_ended: null, 'id': existing.id}; //the server will treat this as a delete operation
        send(data)
    }

    //handle submitting the data
    const handleSubmit = () => {
        setErrors([]);
        if(!termBegan || termBegan == ''){ 
            setErrors(['Pregnancy must include Term Began.']);
            return
        }
        //set term ended to null if empty string, also include existing id if it already exists
        let data = {'term_began': termBegan, 'term_ended': termEnded === '' ? null : termEnded, 'id': existing ? existing.id : null}
        send(data)
    }

    //function to send either the creation or the delete operation to the server
    const send = async(data) => {
        setErrors([]);
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
                onUpdate(); //alert the parent component a change was made
                setEditing(false); //update edit state
            }
            else{
                console.log(returnData);
                const serverResponse = [];
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
                    {existing && !['client'].includes(user.role) && !editing && <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Pregnancy'} /> }
                    {existing && !['client'].includes(user.role) && !editing && <ButtonHover callback={() => handleDelete()} noHover={<FaTrashAlt />} hover={'Delete Pregnancy'} forDelete={true}/>}
                </div>
            </div>
            {existing &&  <UpdateRecord created_by={existing.created_by} updated_by={existing.updated_by}
                created_at={existing.created_at} updated_at={existing.updated_at} />}
        </div>
    )
}
export default function Pregnancies({ respondent, onUpdate }){
    /*
    Component to display a respondent's pregnancies as a set of rows
    - respondent (object): the respondent these pregnancies belong to
    - onUpdate (object): what to do when the pregnancies are edited
    */
    const { user } = useAuth();

    //state to manage respondents pregnancies as they are edited
    const [pregnancies, setPregnancies] = useState(respondent?.pregnancies || []);

    const [errors, setErrors] = useState([]);
    const [adding, setAdding] = useState(false);

    //handle an update
    const update = async () => {
        //refresh the api
        try {
            console.log('fetching respondent details...');
            const response = await fetchWithAuth(`/api/record/respondents/${respondent.id}/`);
            const data = await response.json();
            if(response.ok){
                setPregnancies(data?.pregnancies || []);
                onUpdate(data?.pregnancies || []);
            }
            else{
                navigate(`/not-found`); //navigate to 404 if a bad ID is provided
            }
            
        } catch (err) {
            console.error('Failed to fetch respondent: ', err);
        } 
        setAdding(false);
    }
    return(
        <div>
            <Messages errors={errors} />
            {/* If the user is creating a new pregnancy, create an empty row, and onCancel adjust the parent state */}
            {adding && <PregnancyRow respondent={respondent} onError={(e) => setErrors(e)} onUpdate={()=>update()} onCancel={() => {setAdding(false); setErrors([])}}/>}
            {pregnancies.length > 0 && pregnancies.map((p) => (<PregnancyRow respondent={respondent} onError={(e) => setErrors(e)} existing={p} onUpdate={()=>update()} />))}
            {pregnancies.length === 0 && <p>No recorded pregnancies.</p>}
            {!adding && !['client'].includes(user.role) && <ButtonHover callback={() => setAdding(true)} noHover={<MdLibraryAdd />} hover={'Record New Pregnancy'} />}
        </div>
    )
}