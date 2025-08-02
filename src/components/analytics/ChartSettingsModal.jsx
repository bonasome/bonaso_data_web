import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm,  useWatch } from "react-hook-form";

import fetchWithAuth from '../../../services/fetchWithAuth';

import ButtonLoading from '../reuseables/loading/ButtonLoading';
import Messages from '../reuseables/Messages';
import FormSection from '../reuseables/forms/FormSection';
import IndicatorsIndex from '../indicators/IndicatorsIndex';

import styles from '../../styles/modals.module.css';

import { FcCancel } from "react-icons/fc";
import { IoIosSave } from "react-icons/io";
import { FaChartBar, FaChartLine, FaChartPie } from "react-icons/fa";

//module to edit chart settings
export default function ChartSettingsModal({ chart=null, dashboard, onUpdate, onClose, meta }){
    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [saving, setSaving] = useState(false);

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if (submissionErrors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors]);

    //submit and manage custom logic
    const onSubmit = async(data, e) => {
        setSubmissionErrors([]);
        if(data.indicators.length > 0) {
            data.indicators = data.indicators.map(ind => (ind.id))
        }
        data.chart_id = chart?.id ?? null
        //multiple indicators is treated as the legend, disallow further splits
        if(data.indicators.length > 1){
            data.legend = null;
            data.stack = null;
            data.use_target = false;
        }
        //target is also treated as its own thing, its confusing to mix demogrpahic and non-demogrpahic stuff
        if(data.use_target){
            data.legend = null;
            data.stack = null;
        }
        //pie chart has no access and we're not getting into all that weird slice size stuff of whatever
        if(data.chart_type == 'pie'){
            data.axis = null;
            data.use_target = false;
            data.stack = null;
        }
        //otherwise this is just a circle
        if(data.chart_type == 'pie' && !data.legend){
            setSubmissionErrors(['Pie charts must have a legend!']);
            return;
        }
        //otherwise this is just a dot
        if(data.chart_type == 'line' && !data.axis){
            setSubmissionErrors(['Line charts really need an axis to work.']);
            return;
        }
        console.log(data.stack, data.legend)
        if(data.stack && data.legend && (data.stack == data.legend)){
            setSubmissionErrors(['Stack and legend must be different values.']);
            return;
        }
        try{
            console.log('submiting data...', data)
            setSaving(true);
            const response = await fetchWithAuth(`/api/analysis/dashboards/${dashboard.id}/charts/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const returnData = await response.json();
            if(response.ok){
                onUpdate(returnData.chart_data);
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
            console.error('Could not record project: ', err)
        }
        finally{
            setSaving(false);
        }
    }

    const defaultValues = useMemo(() => {
        return {
            chart_type: chart?.chart_type ?? null,
            axis: chart?.axis ?? null,
            legend: chart?.legend ?? null,
            stack: chart?.stack ?? null,
            indicators: chart?.indicators ?? [],
            use_target: chart?.use_target ?? false,
            filters: chart?.filters ?? null,
            tabular: chart?.tabular ?? false,

        }
    }, [chart]);
    
    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues });

    useEffect(() => {
        if (chart) {
            reset(defaultValues);
        }
    }, [chart, reset, defaultValues]);

    const inds = watch("indicators");
    const chartType = watch("chart_type");
    const usingTargets = watch("use_target");

    const fields = useMemo(() => {
        if (!inds || inds.length === 0) return meta.fields;

        const hasSubcats = inds.some(ind => {
            return (
                (Array.isArray(ind.subcategories) && ind.subcategories.length > 0) ||
                (!Array.isArray(ind.subcategories) && ind.subcategories > 0)
            );
        });

        if (hasSubcats) return meta.fields;
        return meta.fields.filter(field => field.value !== 'subcategory');
    }, [inds, meta]);

    const basics = [
        { name: 'indicators', label: 'View Indicator(s)', type: "multimodel", rules: { required: "Required" },
            IndexComponent: IndicatorsIndex},
        { name: 'chart_type', label: 'Name (Shorter Version)', type: "image", rules: { required: "Required" },
            options: meta.chart_types, images: [FaChartPie, FaChartLine,FaChartBar]},
    ]
    const axis = [
        { name: 'axis', label: "Axis", type: "radio", options: meta.axes},
    ]
    const target = [
        { name: 'use_target', label: "Show Targets", type: "checkbox"},
    ]
    const legend = [
        { name: 'legend', label: "Legend", type: "radio", options: fields},
    ]
    const stack = [
        { name: 'stack', label: "Stack", type: "radio", options: fields},
    ]
    const table = [
        { name: 'tabular', label: "Include Data Table?", type: "checkbox"},
    ]

    return(
        <div className={styles.modal} >
            <h2>Creating New Client</h2>
                <Messages errors={submissionErrors} ref={alertRef} />

            <form onSubmit={handleSubmit(onSubmit)}>
                <FormSection fields={basics} control={control} />
                {chartType != 'pie' && <FormSection fields={axis} control={control} />}
                
                {inds.length == 1 && chartType && !usingTargets && <FormSection fields={legend} control={control} />}

                {inds.length == 1 && chartType != 'pie' && <FormSection fields={target} control={control} />}
                {inds.length == 1 && chartType == 'bar' && !usingTargets && <FormSection fields={stack} control={control} />}
                {inds.length > 0 && <FormSection fields={table} control={control} />}
                {!saving && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    <button type="button" onClick={() => onClose()}><FcCancel /> Cancel</button>
                </div>}
                {saving && <ButtonLoading />}
            </form>
        </div>
    )
}