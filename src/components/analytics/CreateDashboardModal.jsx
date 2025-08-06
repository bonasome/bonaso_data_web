import { useState, useMemo, useEffect } from 'react';
import { useForm,  useWatch } from "react-hook-form";

import fetchWithAuth from '../../../services/fetchWithAuth';

import FormSection from '../reuseables/forms/FormSection';
import Messages from '../reuseables/Messages';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import ProjectsIndex from '../projects/ProjectsIndex';
import OrganizationsIndex from '../organizations/OrganizationsIndex';

import modalStyles from '../../styles/modals.module.css';

import { IoIosSave } from 'react-icons/io';
import { FcCancel } from 'react-icons/fc';


export default function CreateDashboardModal({ existing=null, onUpdate, onClose }){
    const [saving, setSaving] = useState(false);
    const [submissionErrors, setSubmissionErrors] = useState([]);

    //handle form submission
    const onSubmit = async (data) => {
        if(data.project_id) data.project_id = data?.project_id?.id
        if(data.organization_id) data.organization_id = data?.organization_id?.id
        try{
            console.log('submitting dashboard...', data)
            setSaving(true);
            const url = existing ? `api/analysis/dashboards/${existing.id}/` : '/api/analysis/dashboards/';
            const response = await fetchWithAuth(url, {
                method: existing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
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
                setSubmissionErrors(serverResponse)
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

    const defaultValues = useMemo(() => {
        return {
            name: existing?.name ?? '',
            description: existing?.description ?? '',
            project_id: existing?.project ?? null,
            organization_id: existing?.organization ?? null,
            cascade_organization: existing?.cascade_organization ?? false,
        }
    }, [existing]);
        
    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });
    
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);
    console.log(existing)
    const projectSel =  watch('project_id');
    const orgSel =  watch('organization_id');
    console.log(projectSel)
    const basics = [
        { name: 'name', label: 'Name (Required)', type: "text", rules: { required: "Required" },
            tooltip: 'Subject will appear on the unexpanded card. Let people know what this is about!'
        },
        { name: 'description', label: "Description", type: "textarea"},
        { name: 'project_id', label: 'Scope to Project', type: 'model', IndexComponent: ProjectsIndex, labelField: 'name' },
        { name: 'organization_id', label: 'Scope to Organization', type: 'model', IndexComponent: OrganizationsIndex, 
            labelField: 'name', includeParams: projectSel ? [{field: 'project', value: projectSel?.id ?? []}] : [] 
        }
    ]
    const org = [
        { name: 'cascade_organization', label: 'Include Subgrantees?', type: 'checkbox', }
    ]

    return(
        <div className={modalStyles.modal}>
            <h1>{existing ? `Editing Dasbhoard ${existing.name}` : 'New Dashboard' }</h1>
            <Messages errors={submissionErrors} />
            <form onSubmit={handleSubmit(onSubmit)}>
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
