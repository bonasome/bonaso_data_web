import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useNavigate, Link, useParams } from 'react-router-dom';
import fetchWithAuth from '../../../services/fetchWithAuth';
import cleanLabels from '../../../services/cleanLabels';

import FormSection from '../reuseables/forms/FormSection';
import OrganizationsIndex from '../organizations/OrganizationsIndex';
import ProjectsIndex from '../projects/ProjectsIndex';
import IndicatorsIndex from '../indicators/IndicatorsIndex';
import Loading from '../reuseables/loading/Loading';
import Messages from '../reuseables/Messages';
import ButtonLoading from '../reuseables/loading/ButtonLoading';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { BsDatabaseFillAdd } from "react-icons/bs";

// Helper: cartesian product for breakdown values
function cartesianProduct(keys, valuesMap) {
  if (!keys.length) return [{}];
  const [first, ...rest] = keys;
  const firstList = valuesMap[first] || [];
  const restProd = cartesianProduct(rest, valuesMap);
  const out = [];
  for (const v of firstList) {
    for (const r of restProd) {
      out.push({ [first]: v.value, ...r });
    }
  }
  return out;
}

// Build rows using indicatorOptions (array) and selected breakdowns (array of keys)
// dimValuesMap: { sex: [{value,label}, ...], ... }
export function buildRowsForOptions(indicatorOptions = [{}], breakdowns = [], dimValuesMap = {}) {
    // If no indicator options, create a single empty base
    const bases = indicatorOptions.length ? indicatorOptions : [{}];
    const rows = [];

    // produce combos of breakdown values
    const combos = breakdowns.length ? cartesianProduct(breakdowns, dimValuesMap) : [{}];

    for (const base of bases) {
        const optionId = base.id ?? null;
        const optionLabel = base.name ?? base.label ?? (optionId ? String(optionId) : '');
        for (const c of combos) {
        const row = { option_id: optionId, option_label: optionLabel, value: '' };
        // attach each breakdown field (string values)
        for (const b of breakdowns) {
            row[b] = c[b] ?? '';
        }
        rows.push(row);
        }
  }
  return rows;
}

export default function AggregateBuilder() {
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
        let mounted = true;
        async function getMeta() {
        try {
            const res = await fetchWithAuth('/api/aggregates/meta/');
            const data = await res.json();
            if (!mounted) return;
            setMeta(data);
        } catch (err) {
            console.error('Failed to fetch meta', err);
            setSubmissionErrors(['Failed to load metadata']);
        } finally {
            if (mounted) setLoading(false);
        }
        }
        getMeta();
        return () => { mounted = false; };
    }, []);

    // fetch meta on mount (meta contains dimension lists keyed by name: { sex: [{value,label}, ...], age_range: [...] })
    useEffect(() => {
        const getGroup = async() => {
            if(!id) return;
            try {
                const res = await fetchWithAuth('/api/aggregates/meta/');
                const data = await res.json();
                setExisting(data);
            } 
            catch (err) {
                console.error('Failed to fetch meta', err);
                setSubmissionErrors(['Failed to load metadata']);
            } 
            finally {
                if (mounted) setLoading(false);
            }
        }
        getGroup();
    }, []);

    // form
    const defaultValues = useMemo(() => ({
        indicator_id: existing?.indicator ?? null,
        organization_id: existing?.organization ?? null,
        project_id: existing?.project ?? null,
        start: existing?.start ?? '',
        end: existing?.end ?? '',
        breakdowns: existing?.counts?.length? Object.keys(existing.counts[0]) : [],
        counts_data: existing?.counts ?? [],
    }), []);


    const { control, handleSubmit, reset, watch, setValue, setFocus } = useForm({ defaultValues });
    const { fields, replace } = useFieldArray({ control, name: 'counts_data' });

    //if provided, set default values to existing values once loaded
    useEffect(() => {
        if (existing) {
            reset(defaultValues);
        }
    }, [existing, reset, defaultValues]);

    // map of dimension values: { sex: [{value,label}, ...] }
    const dimValuesMap = useMemo(() => {
        if (!meta) return {};
        const map = {};
        for (const k of Object.keys(meta)) {
            map[k] = meta[k]?.map(v => ({ value: v.value, label: v.label })) || [];
        }
        return map;
    }, [meta]);

    // watch relevant fields
    const selectedIndicator = watch('indicator_id');
    const breakdowns = watch('breakdowns') || [];

    // indicator options: do not mutate meta; derive separately
    const indicatorOptions = useMemo(() => {
        if (!selectedIndicator) return [];
        if (typeof selectedIndicator === 'object' && selectedIndicator?.options) {
            return selectedIndicator.options.map(o => ({ id: o.id, name: o.name }));
        }
        // fallback: try to find options on meta.indicators if present
        if (meta && meta.indicators) {
            const found = meta.indicators.find(i => String(i.id) === String(selectedIndicator));
            return found?.options?.map(o => ({ id: o.id, name: o.name })) || [];
        }

        return [];
    }, [selectedIndicator, meta]);

    // build derived rows (full grid) whenever indicatorOptions or breakdowns change
    const rows = useMemo(() => {
        return buildRowsForOptions(indicatorOptions.length ? indicatorOptions : [{}], breakdowns, dimValuesMap);
    }, [indicatorOptions, breakdowns, dimValuesMap]);

    // track previous breakdowns for warning / revert
    const previousBreakdownsRef = useRef(breakdowns);

    useEffect(() => {
        // if user removed breakdowns and there is data entered, warn and possibly revert
        const hadValues = fields.some(f => f.value !== '' && f.value !== null && f.value !== undefined);
        const prev = previousBreakdownsRef.current || [];
        if (hadValues && breakdowns.length < prev.length) {
            const ok = window.confirm('Removing breakdowns will clear entered values. Continue?');
            if (!ok) {
                // revert
                setValue('breakdowns', prev, { shouldDirty: true });
                return;
            }
        }
        // otherwise accept and replace rows in the form
        replace(rows);
        previousBreakdownsRef.current = breakdowns;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows]);

    // transform and submit
    const onSubmit = async (data, e) => {
        const payload = {
            organization_id: data.organization_id.id,
            project_id: data.project_id.id,
            indicator_id: data.indicator_id.id,
            start: data.start,
            end: data.end,
            counts_data: (data.counts_data || []).map(c => {
                const out = { option_id: c.option_id ?? null, value: Number(c.value) || 0 };
                for (const dim of (data.breakdowns || [])) {
                    // send raw value (string) for each breakdown
                    if (c[dim] !== undefined && c[dim] !== null && c[dim] !== '') out[dim] = c[dim];
                }
                return out;
            })
        };
        console.log(payload);
        const action = e.nativeEvent.submitter.value;
        try {
            setSaving(true);
            const response = await fetchWithAuth('/api/aggregates/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
        });
        const returnData = await response.json();
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
        }
    ];

    if (loading) return <Loading />
    return (
        <div className="p-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Aggregate Builder</h2>
        <Messages errors={submissionErrors} ref={alertRef}/>
        <form onSubmit={handleSubmit(onSubmit, onError)}>
            <div className="grid grid-cols-2 gap-4 mb-4">
            <FormSection fields={basics} control={control} header="Information" />
            {proj && <FormSection fields={orgSelect} control={control} header="Information" />}
            {org && <FormSection fields={indSelect} control={control} header="Information" />}
            {selectedIndicator && <FormSection fields={breakdownFields} control={control} header="Breakdowns" />}
            </div>

            {selectedIndicator && (
            <div className="mb-4">
                <h3 className="font-medium mb-2">Data entry</h3>

                {fields.length === 0 && <div className="text-sm text-gray-500">No rows. Select dimensions and ensure indicator is selected.</div>}

                <div className="overflow-auto border rounded">
                <table className="min-w-full table-fixed">
                    <thead>
                    <tr className="bg-gray-100">
                        {selectedIndicator.options.length > 0 &&  <th className="p-2">Option</th>}
                        {breakdowns.map(d => (
                        <th key={d} className="p-2 capitalize">{cleanLabels(d)}</th>
                        ))}
                        <th className="p-2">Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    {fields.map((row, idx) => (
                        <tr key={row.id} className="border-t">
                        {selectedIndicator.options.length > 0 && <td className="p-2 text-sm">{row.option_label}</td>}
                        {breakdowns.map(d => (
                            <td key={d} className="p-2">
                                {/* Show text only */}
                                <span className="text-sm">
                                    {dimValuesMap[d]?.find(v => v.value === row[d])?.label || ''}
                                </span>

                                {/* Hidden field so RHF still submits it */}
                                <Controller
                                    name={`counts_data.${idx}.${d}`}
                                    control={control}
                                    defaultValue={row[d]}  // Pre-fill the value
                                    render={({ field }) => (
                                    <input type="hidden" {...field} value={row[d]} />
                                    )}
                                />
                            </td>
                        ))}

                        <td className="p-2">
                            <Controller
                            name={`counts_data.${idx}.value`}
                            control={control}
                            render={({ field }) => <input type="number" min="0" {...field} className="border p-1 w-28" />}
                            />
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
            )}

            {!saving && selectedIndicator && <div style={{ display: 'flex', flexDirection: 'row' }}>
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
