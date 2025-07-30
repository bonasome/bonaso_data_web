import { useState, useEffect } from 'react';
import prettyDates from '../../../services/prettyDates';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import { useAuth } from '../../contexts/UserAuth';
import errorStyles from '../../styles/errors.module.css';
import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import fetchWithAuth from '../../../services/fetchWithAuth';

import styles from './flags.module.css';
import { MdThumbUp } from 'react-icons/md';

export default function FlagCard({ flag, onUpdate=null }){
    const [flagDetail, setFlagDetail] = useState(flag);
    const [resolving, setResolving] = useState(false);
    const [resolveReason, setResolveReason] = useState('');
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();

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
                    } else {
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
        <div className={flagDetail.resolved ? styles.cardResolved : styles.cardActive}>
            <h3>{flagDetail.reason} {flagDetail.resolved ? '(RESOLVED)' : '(ACTIVE)'}</h3>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <p><i>{flagDetail.auto_flagged ? 'Automatically Flagged' : `Flagged by ${flagDetail.created_by.display_name}`} at {prettyDates(flagDetail.created_at)}</i></p>
            
            {resolving && <div>
                <label htmlFor='reason'>Reason for Resolving</label>
                <textarea id='reason' type='text' onChange={(e) => setResolveReason(e.target.value)} value={resolveReason} />
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                {!saving && <button onClick={() => resolveFlag()}><IoIosSave /> Save</button>}
                {!saving && <button onClick={() => setResolving(false)}><FcCancel /> Cancel</button>}
                {saving && <ButtonLoading />}
                </div>
            </div>}

            {flagDetail.resolved && <div>
                <p><i>Resolved by {flagDetail.auto_resolved ? 'System' : `${flagDetail.resolved_by.display_name}`} at {prettyDates(flagDetail.resolved_at)} </i></p>
                {flagDetail.resolved_reason && <p>{flagDetail.resolved_reason}</p>}
            </div>}
            {!resolving && !flagDetail.resolved && ['meofficer', 'manager', 'admin'].includes(user.role) &&
                <ButtonHover callback={() => setResolving(true)} noHover={<MdThumbUp /> } hover={'Resolve'} /> }
        </div>
    )
}   