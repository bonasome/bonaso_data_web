import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useNavigate, Link, useParams } from 'react-router-dom';
import fetchWithAuth from '../../../services/fetchWithAuth';
import cleanLabels from '../../../services/cleanLabels';
import { getDynamicKeys } from './helpers';

import FormSection from '../reuseables/forms/FormSection';
import OrganizationsIndex from '../organizations/OrganizationsIndex';
import ProjectsIndex from '../projects/ProjectsIndex';
import IndicatorsIndex from '../indicators/IndicatorsIndex';
import Loading from '../reuseables/loading/Loading';
import Messages from '../reuseables/Messages';
import ButtonLoading from '../reuseables/loading/ButtonLoading';

import styles from '../../styles/form.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { BsDatabaseFillAdd } from "react-icons/bs";

export default function AggregateBuilder() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [existing, setExisting] = useState(null);
    const [saving, setSaving] = useState(false);
    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [success, setSuccess] = useState([]);

    //scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (submissionErrors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors]);

    // fetch meta on mount (meta contains dimension lists keyed by name: { sex: [{value,label}, ...], age_range: [...] })
    useEffect(() => {
        const getMeta = async() => {
            try {
                const res = await fetchWithAuth('/api/aggregates/meta/');
                const data = await res.json();
                setMeta(data);
            } 
            catch (err) {
                console.error('Failed to fetch meta', err);
                setSubmissionErrors(['Failed to load metadata']);
            } 
            finally {
                setLoading(false);
            }
        }
        getMeta();
    }, []);

    // fetch meta on mount (meta contains dimension lists keyed by name: { sex: [{value,label}, ...], age_range: [...] })
    useEffect(() => {
        const getGroup = async() => {
            if(!id) return;
            try {
                const res = await fetchWithAuth(`/api/aggregates/${id}/`);
                const data = await res.json();
                setExisting(data);
            } 
            catch (err) {
                console.error('Failed to fetch meta', err);
                setSubmissionErrors(['Failed to fetch details']);
            } 
            finally {
                setLoading(false);
            }
        }
        getGroup();
    }, [id]);

    // form
    const defaultValues = useMemo(() => ({
        indicator_id: existing?.indicator ?? null,
        organization_id: existing?.organization ?? null,
        project_id: existing?.project ?? null,
        start: existing?.start ?? '',
        end: existing?.end ?? '',
        breakdowns: existing?.counts?.length > 0 ? getDynamicKeys(existing?.counts[0]) : [],
        counts_data: []
    }), [existing]);

    const { control, handleSubmit, reset, watch, setValue, setFocus } = useForm({ defaultValues });
    const { fields, replace } = useFieldArray({ control, name: 'counts_data' });


    //if provided, set default values to existing values once loaded
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    // watch relevant fields
    const selectedIndicator = watch('indicator_id');
    const breakdowns = watch('breakdowns') || [];
    const countsData = watch('counts_data');

    function cartesianProduct(obj) {
        const keys = Object.keys(obj);
        if (!keys.length) return [{}];

        return keys.reduce((acc, key) => {
            const values = obj[key];
            const temp = [];
            acc.forEach(existing => {
            values.forEach(v => {
                temp.push({ ...existing, [key]: v });
            });
            });
            return temp;
        }, [{}]);
    }

    const buildRows = useMemo(() => {
        if(!meta || !selectedIndicator) return;
        let existingVals = [];

        if(existing?.counts?.length > 0){
            existingVals = existing.counts.reduce((acc, c) => {
                const key = `${getDynamicKeys(existing?.counts[0]).map(d => d == 'option' ? (c.unique_only ? `${d}__Total` : `${d}__${c[d]?.id}`) : 
                    `${d}__${c[d]}`).join('___')}`;
                console.log(key)
                acc[key] = c.value;
                return acc;
            }, {})
        }
        let all = breakdowns || [];
        if(selectedIndicator?.options.length > 0 && !all.includes('option')) all.push('option');

        if(all.length == 0){
            const val = existing?.counts?.[0]?.value ?? '';
            const rows = [{key: `index`, value: val}]
            setValue(`counts_data.index`, val);
            replace(rows);
            return rows;
        }

        let cleanedMeta = {}
        all.forEach((bd) => {
            if(bd == 'option'){
                cleanedMeta[bd] = selectedIndicator.options.map((o => o.id));
                if(selectedIndicator.type == 'multi'){
                    cleanedMeta[bd].push('Total')
                }
            } 
            else cleanedMeta[bd] = meta[bd]?.map(v => v.value);
        })
        const keys = cartesianProduct(cleanedMeta).map(r => (
            Object.keys(r).map(k => `${k}__${r[k]}`).join('___')
        ))
        const rows = []
        keys.forEach(r => {
            const val = existingVals?.[r] ?? '';
            rows[r] = val;
            setValue(`counts_data.${r}`, val)
            rows.push({ key: r, value: val})
        })
        replace(rows)
        return rows
    }, [breakdowns, existing, selectedIndicator]);

    // transform and submit
    const onSubmit = async (data, e) => {
        const payload = {
            organization_id: data.organization_id.id,
            project_id: data.project_id.id,
            indicator_id: data.indicator_id.id,
            start: data.start,
            end: data.end,
            counts_data: (data.counts_data || []).map(c => {
                let count = {};
                if(c.key == 'index') return {value: c.value};
                c.key.split('___').map((k) => {
                    if(k.split('__')[0] == 'option' && k.split('__')[1] == 'Total' && selectedIndicator.type == 'multi'){
                        count['unique_only'] = true
                    }
                    else{
                        const key = k.split('__')[0] == 'option' ? 'option_id' : k.split('__')[0];
                        count[key]  = k.split('__')[1]
                    }
                })
                count['value'] = ['', null].includes(c.value) ? 0 : c.value;
                return count;
            })
        };
        console.log(payload)
        const action = e.nativeEvent.submitter.value;
        try {
            setSaving(true);
            const url = id ? `/api/aggregates/${id}/` : '/api/aggregates/'
            const response = await fetchWithAuth(url, {
                method: id ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
        });
        const returnData = await response.json();
        console.log(returnData)
       if(response.ok){
                setSuccess(['Event created successfuly!']);
                //depending on the button clicked, redirect the user to the appropriate page
                if(action === 'create_another'){
                    setExisting(null);
                    reset();
                    navigate('/aggregates/new');
                }
                else{
                    navigate(`/aggregates/${returnData.id}`);
                }
            }
            else{
                console.log(returnData)
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
                setSubmissionErrors(serverResponse); //on server error, alert the user
            }
        }
        catch(err){
            setSubmissionErrors(['Something went wrong. Please try again later.']);
            console.error('Could not record event: ', err)
        }
        finally{
            setSaving(false);
        }
    };

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

    const proj = watch('project_id');
    const org = watch('organization_id')
    const basics = [
        { name: 'start', label: 'Start', type: 'date', rules: { required: 'Required' } },
        { name: 'end', label: 'End', type: 'date', rules: { required: 'Required' } },
        { name: 'project_id', label: 'Project', type: 'model', IndexComponent: ProjectsIndex, rules: { required: 'Required' } },
    ];
    const orgSelect = [
        { name: 'organization_id', label: 'Organization', type: 'model', IndexComponent: OrganizationsIndex, rules: { required: 'Required' }, includeParams: [{ field: 'project', value: proj?.id }] },
    ]
    const indSelect = [
        { name: 'indicator_id', label: 'Indicator', type: 'model', IndexComponent: IndicatorsIndex, rules: { required: 'Required' }, includeParams: [{ field: 'allow_aggregate', value: 'true' }, { field: 'project', value: proj?.id }, { field: 'organization', value: org?.id}] },
    ]

    const breakdownFields = [
        {
            name: 'breakdowns',
            label: 'Select Fields to Disaggregate By',
            type: 'multiselect',
            options: meta ? Object.keys(meta).map(k => ({ value: k, label: cleanLabels(k) })) : [],
            warnings: countsData.filter(c => (!['', '0', 0].includes(c.value))).length > 0 ? ['Selecting a new breakdown while you already have data will erase any data you have recorded!'] : [],
        }
    ];

    if (loading) return <Loading />
    return (
        <div className={styles.form}>
        <h2 >Aggregate Builder</h2>
        <Messages errors={submissionErrors} ref={alertRef}/>
        <form onSubmit={handleSubmit(onSubmit, onError)}>
            <div>
            <FormSection fields={basics} control={control} header="Information" />
            {proj && <FormSection fields={orgSelect} control={control} header="Information" />}
            {org && <FormSection fields={indSelect} control={control} header="Information" />}
            {selectedIndicator && <FormSection fields={breakdownFields} control={control} header="Breakdowns" />}
            </div>

            {selectedIndicator && (
            <div className={styles.formSection}>
                <h3 className="font-medium mb-2">Data entry</h3>

                {fields.length === 0 && <div>No rows. Select dimensions and ensure indicator is selected.</div>}
                {fields.length === 1 &&<div>
                    <table>
                        <thead>
                            <tr>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <Controller
                                    name={`counts_data.${0}.value`}
                                    control={control}
                                    render={({ field }) => <input type="number" min="0" {...field} style={{ maxWidth: '10vh'}} />}
                                />
                            </tr>
                        </tbody>
                    </table>
                </div>}
                {fields.length > 1 && <div>
                <table>
                    <thead>
                    <tr>
                        {breakdowns.map(d => (
                        <th key={d}>{cleanLabels(d)}</th>
                        ))}
                        <th>Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    {fields.map((row, idx) => (
                        <tr key={row.id}>
                        {row.key.split('___').map(d => (
                            <td key={d}>
                                {d.split('__')[0] == 'option' ? (d.split('__')[1] == 'Total' ? 'Total' : selectedIndicator.options.find(o => o.id == d.split('__')[1])?.name) :
                                 <p>{meta[d.split('__')[0]]?.find(v => v.value === d.split('__')[1])?.label || ''}</p>}
                            </td>
                        ))}
                        <td className="p-2">
                            <Controller
                                name={`counts_data.${idx}.value`}
                                control={control}
                                render={({ field }) => <input type="number" min="0" {...field} style={{ maxWidth: '5vh'}} />}
                            />
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>}
            </div>
            )}

            {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                <button type="submit" value='normal'><IoIosSave /> Save</button>
                {!id && <button type="submit" value='create_another'><BsDatabaseFillAdd /> Save and Create Another</button>}
                <Link to={id ? `/aggregates/${id}` : '/aggregates'}><button type="button">
                    <FcCancel /> Cancel
                </button></Link>
            </div>}
            {saving && <ButtonLoading />}

        </form>
        </div>
    );
}
