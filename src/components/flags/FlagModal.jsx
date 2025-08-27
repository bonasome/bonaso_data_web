import { useState, useEffect, useRef } from "react";

import fetchWithAuth from "../../../services/fetchWithAuth";

import RadioButtons from '../reuseables/inputs/RadioButtons';
import Messages from "../reuseables/Messages";
import ButtonLoading from "../reuseables/loading/ButtonLoading";

import modalStyles from '../../styles/modals.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";

export default function FlagModal({ model, id, onConfirm, onCancel }){
    /*
    Modal used to create new flags for an object, given the object's model and its id.
    - model (string): the name of the model of the flagged object
    - id (integer): the id of the flagged object
    - onConfirm (function): what to do when the flag is created
    - onCancel (function): what to do when the creation process is cancelled
    */

    const [flagReason, setFlagReason] = useState(''); //user inputted reason
    const [flagType, setFlagType] = useState(''); //user selected type

    //page meta
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    const [meta, setMeta] = useState(null);

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if ((errors.length > 0) && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //get the meta for the reason types
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

    //function to submit the flag request
    const raiseFlag = async() => {
        setErrors([]);
        //reason/reason type is required
        const sErrors = []
        if(flagType === ''){
            sErrors.push('You must select a flag type.');
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
                onConfirm(data.flag); //run function when saved
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

    if(!meta) return <></>
    return(
        <div className={modalStyles.modal}>
            <h2>New Flag</h2>
            <Messages errors={errors} ref={alertRef} />
            <div>
            <RadioButtons name='flag_type' label='Flag Category' options={meta?.flag_reasons} value={flagType} onChange={(val) => setFlagType(val)}/>
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <label htmlFor='reason'>Flag Reason</label>
                <textarea id='reason' style={{ width: '30vw', height: '20vh' }} onChange={(e) => setFlagReason(e.target.value)} value={flagReason} />
            </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                {!saving && <button onClick={() => raiseFlag()}><IoIosSave /> Save</button>}
                {!saving && <button onClick={() => onCancel()}><FcCancel /> Cancel</button>}
                {saving && <ButtonLoading />}
            </div>
        </div>
    )
}