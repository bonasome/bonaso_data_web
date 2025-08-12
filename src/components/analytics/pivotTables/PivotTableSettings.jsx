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

export default function PivotTableSettings({ existing, onClose, onUpdate, meta }){
    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [saving, setSaving] = useState(false);

    const onSubmit = async(data) => {
        setSubmissionErrors([]);
        data.indicator_id = data.indicator_id?.id ?? null;
        data.organization_id = data.organization_id?.id ?? null;
        data.project_id = data.project_id?.id ?? null;
        if(data.start == '') data.start = null;
        if(data.end == '') data.end = null;
        if(data.param_names){
            const vals = fields.map(f => (f.value))
            data.param_names = data.param_names.filter(n => (vals.includes(n)));
        }
        try{
            setSaving(true);
            console.log('submitting data...', data);
            const url = existing ? `/api/analysis/tables/${existing.id}/` : `/api/analysis/tables/`;
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
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setSubmissionErrors(serverResponse)
            }
        }
        catch(err){
            setSubmissionErrors(['Something went wrong. Please try again later.']);
            console.error('Could not record event: ', err)
        }
        finally{
            setSaving(false);
        }
    }
    const defaultValues = useMemo(() => {
        return {
            name: existing?.name ?? '',
            indicator_id: existing?.indicator ?? '',
            start: existing?.start ?? '',
            end: existing?.end ?? '',
            param_names: existing?.params ?? [],

            project_id: existing?.project ?? null,
            organization_id: existing?.organization ?? null,
            cascade_organization: existing?.cascade_organization ?? false
        }
    }, [existing]);

    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });

    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    const ind = watch('indicator_id');
    const projectSel =  watch('project_id');
    const orgSel =  watch('organization_id');

    //helper function to calculate the type of splits (legend/breakdown) that are available
    const fields = useMemo(() => {
        if(!ind) return []
        if(['event_no', 'org_event_no'].includes(ind?.indicator_type)) return []; //only allow org for these
        if(ind?.indicator_type === 'social') return meta.fields.filter(f => (['platform', 'metric'].includes(f.value))); //only allow these for social
        const hasSubcats = (
            (Array.isArray(ind.subcategories) && ind.subcategories.length > 0) ||
            (!Array.isArray(ind.subcategories) && ind.subcategories > 0)
        );

        if (hasSubcats) return meta.fields.filter(f => (!['platform', 'metric'].includes(f.value)));
        return meta.fields.filter(f => (!['subcategory', 'platform', 'metric'].includes(f.value)));
    }, [ind, meta]);

    const basics = [
        { name: 'name', label: 'Pivot Table Name', type: "text", rules: { maxLength: { value: 255, message: 'Maximum length is 255 characters.'} },
            placeholder: 'ex. My Awesome Pivot Table, Tested Postive by Sex...'
        },
        { name: 'indicator_id', label: "Indicator", type: "model", IndexComponent: IndicatorsIndex, labelField: 'display_name',
        },
    ]
    const params = [
        { name: 'param_names', label: 'Split Data By', type: 'multiselect', options: fields}
    ]
    const scope = [
        { name: 'start', label: "Start", type: "date"},
        { name: 'end', label: "End", type: "date"},
        { name: 'project_id', label: 'Scope Data to Project', type: 'model', IndexComponent: ProjectsIndex, labelField: 'name' },
        { name: 'organization_id', label: 'Scope Data to Organization', type: 'model', IndexComponent: OrganizationsIndex, 
            labelField: 'name', includeParams: projectSel ? [{field: 'project', value: projectSel?.id ?? []}] : [] 
        }
    ]
    const org = [
        { name: 'cascade_organization', label: 'Include Subgrantees?', type: 'checkbox', }
    ]
    console.log(fields)
    if(!meta?.fields) return <></>
    return(
        <div className={styles.modal}>
            <h2>Editing Pivot Table Settings</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Messages errors={submissionErrors} />
                <FormSection fields={basics} control={control} header='Pivot Table Settings'/>
                {fields.length > 0 && <FormSection fields={params} control={control} header='Select Breakdowns'/>}
                <FormSection fields={scope} control={control} header='Pivot Table Scope'/>
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