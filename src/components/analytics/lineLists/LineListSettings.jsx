import { useEffect, useState, useMemo } from "react";
import { useForm,  useWatch } from "react-hook-form";

import fetchWithAuth from "../../../../services/fetchWithAuth";

import ButtonLoading from "../../reuseables/loading/ButtonLoading";
import FormSection from '../../reuseables/forms/FormSection';
import Messages from '../../reuseables/Messages';
import IndicatorsIndex from "../../indicators/IndicatorsIndex";
import ProjectsIndex from '../../projects/ProjectsIndex';
import OrganizationsIndex from '../../organizations/OrganizationsIndex';

import styles from '../../../styles/modals.module.css'

import { IoIosSave } from "react-icons/io";
import { FcCancel } from "react-icons/fc";

export default function LineListSettings({ onClose, onUpdate, existing=null }){
    /*
    Modal for creating or editing the settings of a line list.
    - onClose (function): what to do on modal close
    - onUpdate(function): handle data edited during submission
    - existing (object, optional): an existing lists settings to edit
    */
    const [submissionErrors, setSubmissionErrors] = useState([]); //server or custom submission logic errors
    const [saving, setSaving] = useState(false);

    const onSubmit = async(data) => {
        setSubmissionErrors([]);
        //model selects return a full object, so convert the object to just the id
        data.indicator_id = data.indicator_id?.id ?? null;
        data.organization_id = data.organization_id?.id ?? null;
        data.project_id = data.project_id?.id ?? null;
        //the backend will have a panic attack if it gets an empty string for a date, so set these to null if empty
        if(data.start == '') data.start = null;
        if(data.end == '') data.end = null;

        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = existing ? `/api/analysis/lists/${existing.id}/` : `/api/analysis/lists/`;
            const response = await fetchWithAuth(url, {
                method: existing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate(returnData); //run the update function so the parent has the updated settings
                onClose(); //close the modal
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
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setSubmissionErrors(serverResponse);
            }
        }
        catch(err){
            setSubmissionErrors(['Something went wrong. Please try again later.']);
            console.error('Could not record line list: ', err)
        }
        finally{
            setSaving(false);
        }
    }

    //set the default values
    const defaultValues = useMemo(() => {
        return {
            name: existing?.name ?? '',
            start: existing?.start ?? '',
            end: existing?.end ?? '',
            indicator_id: existing?.indicator ?? '',
            project_id: existing?.project ?? null,
            organization_id: existing?.organization ?? null,
            cascade_organization: existing?.cascade_organization ?? false
        }
    }, [existing]);

    //construct the RHF form
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

    //if existing is passed, set default values based on existing once it loads
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    //watches for form logic
    const projectSel =  watch('project_id'); //watched so that organization select will only include orgs from that project
    const orgSel =  watch('organization_id');

    const basics = [
        { name: 'name', label: 'Line List Name (Required)', type: "text", rules: { required: 'Required', maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
            placeholder: 'ex. My Cool Line List...'
        },
    ]
    const scope = [
        { name: 'start', label: "Start", type: "date"},
        { name: 'end', label: "End", type: "date"},
        { name: 'indicator_id', label: "Indicator", type: "model", IndexComponent: IndicatorsIndex, labelField: 'display_name',
            includeParams: [{field:'indicator_type', value: 'respondent'}]
        },
        { name: 'project_id', label: 'Scope Data to Project', type: 'model', IndexComponent: ProjectsIndex, labelField: 'name' },
        { name: 'organization_id', label: 'Scope Data to Organization', type: 'model', IndexComponent: OrganizationsIndex, 
            labelField: 'name', includeParams: projectSel ? [{field: 'project', value: projectSel?.id ?? []}] : [] 
        }
    ]
    //show option to cascade to orgs subgrantees if an organization is selected
    const org = [
        { name: 'cascade_organization', label: 'Include Subgrantees?', type: 'checkbox', }
    ]

    return(
        <div className={styles.modal}>
            <h2>Editing Line List Settings</h2>
            <form onSubmit={handleSubmit(onSubmit, onError)}>
                <Messages errors={submissionErrors} />
                <FormSection fields={basics} control={control} header='Line List Settings'/>
                <FormSection fields={scope} control={control} header='Line List Scope'/>
                {orgSel && <FormSection fields={org} control={control} header='Cascade to Subgrantees?'/>}

                {!saving && <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    <button type="button" onClick={onClose}><FcCancel /> Cancel</button>
                </div>}
                {saving && <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                    <ButtonLoading />
                </div>}
            </form>
        </div>
    )
}