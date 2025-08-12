import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm,  useWatch } from "react-hook-form";

import fetchWithAuth from '../../../../services/fetchWithAuth';

import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import Messages from '../../reuseables/Messages';
import FormSection from '../../reuseables/forms/FormSection';
import IndicatorsIndex from '../../indicators/IndicatorsIndex';

import styles from '../../../styles/modals.module.css';

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
        if(data.stack && data.legend && (data.stack == data.legend)){
            setSubmissionErrors(['Stack and legend must be different values.']);
            return;
        }
        if(data.start === '') data.start = null;
        if(data.end === '') data.end = null;
        if(data.repeat_n === '') data.repeat_n = null;
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
            indicator_type: chart?.indicators[0].indciator_type ?? null,
            chart_type: chart?.chart_type ?? null,
            name: chart?.name ?? '',
            axis: chart?.axis ?? null,
            repeat_only: chart?.repeat_only ?? false,
            repeat_n: chart?.repeat_n ?? '',
            legend: chart?.legend ?? null,
            stack: chart?.stack ?? null,
            indicators: chart?.indicators ?? [],
            use_target: chart?.use_target ?? false,
            filters: chart?.filters ?? null,
            tabular: chart?.tabular ?? false,

            start: chart?.start ?? '',
            end: chart?.end ?? '',

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
    const needRepeat = watch('repeat_only');

    //helper function to calculate the type of splits (legend/breakdown) that are available
    const fields = useMemo(() => {
        if (!inds || inds.length === 0 || inds.length > 1) return []; //return nothing if there is no indicator or if there are multiple indicators (if multiple, the indciator is treated as the legend)
        if(['event_no', 'org_event_no'].includes(inds[0]?.indicator_type)) return []; //only allow org for these
        if(inds[0]?.indicator_type === 'social') return meta.fields.filter(f => (['platform', 'metric'].includes(f.value))); //only allow these for social
        const hasSubcats = inds.some(ind => {
            return (
                (Array.isArray(ind.subcategories) && ind.subcategories.length > 0) ||
                (!Array.isArray(ind.subcategories) && ind.subcategories > 0)
            );
        });

        if (hasSubcats) return meta.fields.filter(f => (!['platform', 'metric'].includes(f.value)));
        return meta.fields.filter(f => (!['subcategory', 'platform', 'metric'].includes(f.value)));
    }, [inds, meta]);

    console.log(inds)
    
    const basics = [
        { name: 'indicators', label: 'View Indicator(s) (Required)', type: "multimodel", rules: { required: "Required" },
            IndexComponent: IndicatorsIndex,
            tooltip: `You can select as many indicators as you would like, but if you select more than one,
            you will not be allowed to breakdown by legend. Selecting indicators of differnet data types may
            not work very well either.`
        }, 
        { name: 'chart_type', label: 'Chart Type (Required)', type: "image", rules: { required: "Required" },
            options: meta.chart_types, images: [FaChartPie, FaChartLine,FaChartBar],
            tooltip: `What type of chart do you need? Line charts work well when viewing over time,
            pie charts are good for viewing overall percentage breakdowns. If in doubt, start with a bar.`
        },
        { name: 'name', label: 'Chart Name', type: 'text', rules: { maxLength: { value: 255, message: 'Maximum length is 255 characters.' }},
            tooltip: `Give your chart a name so you know what it is supposed to track.`
        }
    ]
    const axis = [
        { name: 'axis', label: "Axis", type: "radio", options: meta.axes,
            tooltip: `This selection will breakdown the data on the X axis.`
        },
    ]
    const target = [
        { name: 'use_target', label: "Show Targets", type: "checkbox",
            tooltip: `Check this box to show targets on the axis. This will server as the legend.`
        },
    ]
    const repeat = [
        { name: 'repeat_only', label: 'Show only repeat interactions', type: 'checkbox',
            tooltip: `Check this box if you only want to measure the number of people who underwent this interaction
            multiple times.`
        },
    ]
    const repeatN = [
        { name: 'repeat_n', label: 'Minimum Number to Show', type: 'number', rules: { required: 'Required'},
            tooltip: `Select the minimum number of times a person needs to have undergone this interaction to
            be counted (ex. twice, three times, four times).`
        }
    ]
    const legend = [
        { name: 'legend', label: "Legend", type: "radio", options: fields},
    ]
    const stack = [
        { name: 'stack', label: "Stack", type: "radio", options: fields,
            tooltip: `If you need an additional breakdown, you can also measure by stacked bars.`
        },
    ]
    const table = [
        { name: 'tabular', label: "Include Data Table?", type: "checkbox",
            tooltip: `Checking this box will show a data table below the chart.`
        },
    ]

    const span = [
        { name: 'start', label: 'Start of Tracking Period', type: 'date'},
        { name: 'end', label: 'End of Tracking Period', type: 'date'}
    ]
    return(
        <div className={styles.modal} >
            <h2>Creating New Client</h2>
                <Messages errors={submissionErrors} ref={alertRef} />

            <form onSubmit={handleSubmit(onSubmit)}>
                <h2>Chart Settings</h2>
                <FormSection fields={basics} control={control} header={'Basics'}/>
                {chartType && chartType != 'pie' && <FormSection fields={axis} control={control} header={'Axis'}/>}
                {inds.length === 1 && inds[0].type == 'respondent' && chartType == 'bar' && 
                    <FormSection fields={repeat} control={control} header={'Track Repeat Only?'} />}
                {needRepeat && <FormSection fields={repeatN} control={control} header={'How Many Times?'} />}
                {inds.length == 1 && chartType != 'pie' && <FormSection fields={target} control={control} header='Show Targets' />}
                {inds.length == 1 && chartType && !usingTargets && fields?.length > 0 &&
                     <FormSection fields={legend} control={control} header='Legend' />}
                {inds.length == 1 && fields?.length > 0 && chartType == 'bar' && !usingTargets && <FormSection fields={stack} control={control} header='Stack' />}

                {inds.length > 0 && <FormSection fields={table} control={control} header='Data Table' />}
                
                {inds.length > 0 && <FormSection fields={span} control={control} header='Time Period' />}
                {!saving && <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                    <button type="submit" value='normal'><IoIosSave /> Save</button>
                    <button type="button" onClick={() => onClose()}><FcCancel /> Cancel</button>
                </div>}
                {saving && <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                     <ButtonLoading />
                </div>}
            </form>
        </div>
    )
}