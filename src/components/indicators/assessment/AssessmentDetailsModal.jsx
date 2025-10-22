import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm,  useWatch } from "react-hook-form";
import { useNavigate } from 'react-router-dom';

import fetchWithAuth from '../../../../services/fetchWithAuth';

import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import Messages from '../../reuseables/Messages';
import FormSection from '../../reuseables/forms/FormSection';

import styles from '../../../styles/modals.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";

export default function AssessmentDetailsModal({ onCancel, onUpdate=null, existing=null }){
    /*
    Allows a user to create/edit an assessment name/description
    - onUpdate (function): what to do after succesful updating/creating an assessment object
    - onCancel (function): how to close the modal
    - existing (object, optional): the existing object to edit
    */
   
    const navigate = useNavigate();
    //page meta
    const[modalErrors, setModalErrors] = useState([])
    const [saving, setSaving] = useState(false);

    //ref to scroll to errors
        const alertRef = useRef(null);
        useEffect(() => {
            if (modalErrors.length > 0 && alertRef.current) {
            alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            alertRef.current.focus({ preventScroll: true });
            }
        }, [modalErrors]);

    //handle form submission, vary method based on if its create or update
    const onSubmit = async (data) => {
        setModalErrors([]);
        try{
            setSaving(true);
            const url = existing ? `/api/indicators/assessments/${existing.id}/` : `/api/indicators/assessments/`
            const response = await fetchWithAuth(url, {
                method: existing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                if(onUpdate){
                    onUpdate(returnData); //tell tha parent component the update was made
                }
                else{
                    navigate(`/indicators/assessments/${returnData.id}`)
                }
                onCancel(); //close the modal
            }
            else{
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
                setModalErrors(serverResponse)
            }
        }
        catch(err){
            setModalErrors(['Something went wrong. Please try again later.']);
            console.error('Could not record indicator: ', err);
        }
        finally{
            setSaving(false)
        }
    }

    //set the default values
    const defaultValues = useMemo(() => {
        return {
            name: existing?.name ?? '',
            description: existing?.description ?? '',
        }
    }, [existing]);
    
    //construct the RHF variables
    const { register, control, handleSubmit, reset, watch, setFocus, formState: { errors } } = useForm({ defaultValues });

    //scroll to field errors on submission
    const onError = (errors) => {
        const firstError = Object.keys(errors)[0];
        if (firstError) {
            setFocus(firstError); // sets cursor into the field
            // scroll the element into view smoothly
            const field = document.querySelector(`[name="${firstError}"]`);
            if (field && field.scrollIntoView) {
            field.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    };

    //if given, wait for existing to load then set default values based on it
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);


    const basics = [
        { name: 'name', label: 'Name (Required)', type: "text", rules: { required: "Required", 
                maxLength: { value: 255, message: 'Maximum length is 255 characters.'}, 
            }, 
            tooltip: `You don't need to include "assessment", we'll handle that.`,
            placeholder: 'HIV Testing, Condom Distribution...',
        },
        { name: 'description', label: "Assessment Description", type: "textarea", 
            placeholder: 'Any additional information you may want to note...'
        },
    ]

    return(
        <div className={styles.modal} >
            <h2>{existing ? `Editing ${existing?.name}` : 'Creating New Assessment'}</h2>
             <Messages errors={modalErrors} ref={alertRef} />

            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <FormSection fields={basics} control={control} />
                
                {!saving && <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    <button type="button" onClick={() => onCancel()}><FcCancel /> Cancel</button>
                </div>}
                
                {saving && <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                    <ButtonLoading />
                </div> }
            </form>

        </div>
    )
}