import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import modalStyles from '../../styles/modals.module.css';
import { useState, useEffect } from "react";
import ButtonLoading from "../reuseables/loading/ButtonLoading";
import errorStyles from '../../styles/errors.module.css';
import fetchWithAuth from "../../../services/fetchWithAuth";
import SimpleSelect from '../reuseables/inputs/SimpleSelect';

export default function FlagModal({ model, id, onConfirm, onCancel }){
    const [saving, setSaving] = useState(false);
    const [flagReason, setFlagReason] = useState('');
    const [flagType, setFlagType] = useState('');
    const [errors, setErrors] = useState([]);
    const [meta, setMeta] = useState(null);

    useEffect(() => {
        const getMeta = async () => {
            try{
                console.log('fetching respondents meta...');
                const response = await fetchWithAuth(`/api/flags/meta/`);
                const data = await response.json();
                setMeta(data);
            }
            catch(err){
                setErrors(['Something went wrong. Please try again later.'])
                console.error('Failed to fetch respondent model information: ', err)
            }

        }
        getMeta()
    }, [])

    const raiseFlag = async() => {
        setErrors([]);
        const sErrors = []
        if(flagType === ''){
            sErrors.push('You must select a flag typr.');
        }
        if(flagReason === ''){
            sErrors.push('You must enter a reason for this flag.');
        }
        if(sErrors.length > 0){
            setErrors(sErrors);
            return;
        }
        try {
            setSaving(true);
            console.log('creating flag...');
            const response = await fetchWithAuth(`/api/flags/raise-flag/`, {
                method: 'POST',
                headers: {
                        'Content-Type': "application/json",
                    },
                body: JSON.stringify({
                    reason_type: flagType,
                    reason: flagReason,
                    id: id,
                    model: model,
                })
            });
            const data = await response.json();
            if (response.ok) {
                onConfirm(data.flag);
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
    console.log(meta)
    if(!meta) return <></>
    return(
        <div className={modalStyles.modal}>
            <h2>New Flag</h2>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <SimpleSelect optionValues={meta.flag_reasons.map((r) => (r.value))} optionLabels={meta.flag_reasons.map((r) => (r.label))}
                name={'flag_reason'} label={'Select a Flag Type'} callback={(val) => setFlagType(val)} value={flagType} />
            <label htmlFor='reason'>Flag Reason</label>
            <textarea id='reason' type='text' onChange={(e) => setFlagReason(e.target.value)} value={flagReason} />
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                {!saving && <button onClick={() => raiseFlag()}><IoIosSave /> Save</button>}
                {!saving && <button onClick={() => onCancel()}><FcCancel /> Cancel</button>}
                {saving && <ButtonLoading />}
            </div>
        </div>
    )
}