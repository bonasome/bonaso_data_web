import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm,  useWatch } from "react-hook-form";

import fetchWithAuth from '../../../../services/fetchWithAuth';

import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import Messages from '../../reuseables/Messages';
import FormSection from '../../reuseables/forms/FormSection';

import styles from '../../../styles/modals.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";

export default function CreateClient({ onCreate, onCancel, existing=null }){
    //page meta
    const[pageErrors, setPageErrors] = useState([])
    const [saving, setSaving] = useState(false);

    //ref to scroll to errors
        const alertRef = useRef(null);
        useEffect(() => {
            if (pageErrors.length > 0 && alertRef.current) {
            alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            alertRef.current.focus({ preventScroll: true });
            }
        }, [pageErrors]);

    //handle form submission, vary method based on if its create or update
    const onSubmit = async (data) => {
        setPageErrors([]);
        try{
            setSaving(true);
            const url = existing ? `/api/manage/clients/${existing.id}/` : `/api/manage/clients/`
            const response = await fetchWithAuth(url, {
                method: existing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                onCreate(returnData);
                onCancel();
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
                setPageErrors(serverResponse)
            }
        }
        catch(err){
            setPageErrors(['Something went wrong. Please try again later.']);
            console.error('Could not record indicator: ', err);
        }
        finally{
            setSaving(false)
        }
    }

    const defaultValues = useMemo(() => {
            return {
                name: existing?.name ?? '',
                full_name: existing?.full_name ?? '',
            }
        }, [existing]);
    
    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });

    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);


    const basics = [
        { name: 'name', label: 'Name (Required)', type: "text", rules: { required: "Required", 
                maxLength: { value: 255, message: 'Maximum length is 255 characters.'}, 
            }, 
            tooltip: `This will appear in project pages, so make sure it's short and readable.`,
            placeholder: 'NAHPA...',
        },
        { name: 'full_name', label: "Full Name", type: "textarea", tooltip: 'Their full name, if desired.',
            placeholder: 'National AIDS and Health Promotion Agency...', rules: {maxLength: { value: 255, message: 'Maximum length is 255 characters.'}}
        },
        { name: 'description', label: "Client Description", type: "textarea", 
            placeholder: 'Any additional information you may want to note...'
        },
    ]

    return(
        <div className={styles.modal} >
            <h2>Creating New Client</h2>
             <Messages errors={pageErrors} ref={alertRef} />

            <form onSubmit={handleSubmit(onSubmit)}>
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