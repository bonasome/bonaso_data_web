import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth';

import fetchWithAuth from '../../../services/fetchWithAuth';
import cleanLabels from '../../../services/cleanLabels';
import { getContentTypeLabel, generateURL } from '../../../services/modelMap';

import prettyDates from '../../../services/prettyDates';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import Messages from '../reuseables/Messages';

import styles from './flags.module.css';

import { MdThumbUp } from 'react-icons/md';
import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";

export default function FlagCard({ flag, onUpdate=null, index=false }){
    //context
    const { user } = useAuth();
    //convert the param to a state so that it can be updated 
    const [flagDetail, setFlagDetail] = useState(flag);
    //control resolving information
    const [resolving, setResolving] = useState(false);
    const [resolveReason, setResolveReason] = useState('');
    //meta
    const [expanded, setExpanded] = useState(false);
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    
    useEffect(() => {
        setFlagDetail(flag)
    }, [flag]);
    //function to resolve flag
    const resolveFlag = async() => {
        setErrors([]);
        if(resolveReason === ''){
            setErrors(['You must enter a reason for flagging this respondent.']);
            return
        }
        try {
            console.log('flagging respondent...');
            setSaving(true);
            const response = await fetchWithAuth(`/api/flags/${flag.id}/resolve-flag/`, {
                method: 'PATCH',
                headers: {
                        'Content-Type': "application/json",
                    },
                body: JSON.stringify({'resolved_reason': resolveReason})
            });
            const data = await response.json();
            if (response.ok) {
                setFlagDetail(data.flag);
                setResolving(false);
                if(onUpdate){
                    onUpdate(data.flag);
                }
            } 
            else {
                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                    });
                    } 
                    else {
                        serverResponse.push(`${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete organization:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setSaving(false);
        }
    }

    if(!flagDetail) return <></>
    return(
        <div className={flagDetail.resolved ? styles.cardResolved : styles.cardActive} onClick={() => setExpanded(!expanded)}>
            {index ? <Link to={generateURL(flagDetail.model_string, flagDetail.target)} style={{ display:'flex', width:"fit-content" }}><h3>Flag on {getContentTypeLabel(flagDetail.model_string)} {flagDetail.target.display} {flagDetail.resolved ? '(RESOLVED)' : '(ACTIVE)'}</h3></Link> :
                <h3>Flag on {getContentTypeLabel(flagDetail.model_string)} {flagDetail.target.display} {flagDetail.resolved ? '(RESOLVED)' : '(ACTIVE)'}</h3>}
            {expanded && <div onClick={(e) => {resolving ? e.stopPropagation() : null}}>
                <Messages errors={errors} />
                <h4>Data Type: {getContentTypeLabel(flag.model_string)}</h4>
                <p><i>{flagDetail.auto_flagged ? 'Automatically Flagged' : `Flagged by ${flagDetail.created_by.display_name}`} at {prettyDates(flagDetail.created_at, true)}</i></p>
               
                <h4>Reason:</h4>
                 <strong><p>{cleanLabels(flag.reason_type)}</p></strong>
                <p>{flagDetail.reason} </p>
                {resolving && <div style={{display: 'flex', flexDirection: 'column'}}>
                    <label htmlFor='reason'>Reason for Resolving</label>
                    <textarea id='reason' type='text' onChange={(e) => setResolveReason(e.target.value)} value={resolveReason} />
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        {!saving && <button onClick={() => resolveFlag()}><IoIosSave /> Save</button>}
                        {!saving && <button onClick={() => setResolving(false)}><FcCancel /> Cancel</button>}
                        {saving && <ButtonLoading />}
                    </div>
                </div>}

                {flagDetail.resolved && <div>
                    <p><i>Resolved by {flagDetail.auto_resolved ? 'System' : `${flagDetail.resolved_by.display_name}`} at {prettyDates(flagDetail.resolved_at, true)} </i></p>
                    {flagDetail.resolved_reason && <p>{flagDetail.resolved_reason}</p>}
                </div>}

                {!resolving && !flagDetail.resolved && ['meofficer', 'manager', 'admin'].includes(user.role) &&
                    <button onClick={(e) => {setResolving(true); e.stopPropagation()}}><MdThumbUp /> Resolve </button>}
            </div>}
        </div>
    )
}   