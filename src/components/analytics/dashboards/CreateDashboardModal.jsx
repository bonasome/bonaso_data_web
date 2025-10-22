import { useState, useMemo, useEffect } from 'react';
import { useForm,  useWatch } from "react-hook-form";

import fetchWithAuth from '../../../../services/fetchWithAuth';

import FormSection from '../../reuseables/forms/FormSection';
import Messages from '../../reuseables/Messages';
import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import ProjectsIndex from '../../projects/ProjectsIndex';
import OrganizationsIndex from '../../organizations/OrganizationsIndex';

import modalStyles from '../../../styles/modals.module.css';

import { IoIosSave } from 'react-icons/io';
import { FcCancel } from 'react-icons/fc';


export default function CreateDashboardModal({ onUpdate, onClose, existing=null }){
    /*
    Modal that is used for creating/editing dashboards.
    - onUpdate (function): Function to run on saving
    - onClose (function): function to close the modal
    - existing (object, optional): An existing dashboard for editing
    */
    const [saving, setSaving] = useState(false); //used to track when the system is trying to save
    const [submissionErrors, setSubmissionErrors] = useState([]); //used for server errors/custom submission errors

    //handle form submission
    const onSubmit = async (data) => {
        //model select will return full objects, so convert them to just the ID if sent
        if(data.project_id) data.project_id = data?.project_id?.id
        if(data.organization_id) data.organization_id = data?.organization_id?.id
        try{
            setSaving(true);

            const url = existing ? `/api/analysis/dashboards/${existing.id}/` : '/api/analysis/dashboards/';
            const response = await fetchWithAuth(url, {
                method: existing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });

            const returnData = await response.json();
            if(response.ok){
                //on success, run update function then close the modal
                onUpdate(returnData);
                onClose();
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
                setSubmissionErrors(serverResponse); //on fail show errors
            }
        }
        catch(err){
            setSubmissionErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record dashboard: ', err)
        }
        finally{
            setSaving(false);
        }
    }

    //set the default values
    const defaultValues = useMemo(() => {
        return {
            name: existing?.name ?? '',
            description: existing?.description ?? '',
            project_id: existing?.project ?? null,
            organization_id: existing?.organization ?? null,
            cascade_organization: existing?.cascade_organization ?? false,
        }
    }, [existing]);
        
    //construct RHF variables
    const { register, control, handleSubmit, reset, watch, setFocus, formState: { errors } } = useForm({ defaultValues });
    
    //scroll to field errors
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

    //if given, use existing to set default values once loaded
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    //watches to help with logic
    const projectSel =  watch('project_id'); //used to filter organization scope to only orgs in that project
    const orgSel =  watch('organization_id');

    const basics = [
        { name: 'name', label: 'Dashboard Name (Required)', type: "text", rules: { required: "Required", maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
            tooltip: 'Subject will appear on the unexpanded card. Let people know what this is about!'
        },
        { name: 'description', label: "Dashboard Description", type: "textarea"},
        { name: 'project_id', label: 'Scope Data to Project', type: 'model', IndexComponent: ProjectsIndex, labelField: 'name' },
        { name: 'organization_id', label: 'Scope Data to Organization', type: 'model', IndexComponent: OrganizationsIndex, 
            labelField: 'name', includeParams: projectSel ? [{field: 'project', value: projectSel?.id ?? []}] : [] 
        }
    ]
    //if an org is selected, give the option to include child orgs/subgrantees as well
    const org = [
        { name: 'cascade_organization', label: 'Include Subgrantees?', type: 'checkbox', }
    ]

    return(
        <div className={modalStyles.modal}>
            <h1>{existing ? `Editing Dasbhoard ${existing.name}` : 'New Dashboard' }</h1>
            <Messages errors={submissionErrors} />
            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <FormSection fields={basics} control={control} />
                {orgSel && <FormSection fields={org} control={control} />}
                {!saving && <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    <button type="button" onClick={() => onClose()}>
                        <FcCancel /> Cancel
                    </button>
                </div>}
                {saving &&<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                    <ButtonLoading />
                </div>}
            </form>
        </div>
    )
}
