import { useEffect, useState, useMemo } from "react";
import { useForm,  useWatch, useController, useFormContext, FormProvider } from "react-hook-form";

import { checkLogic } from "./helpers";

import Field from "../../reuseables/forms/Field";
import styles from '../../../styles/form.module.css';
import { FaArrowAltCircleDown, FaArrowAltCircleUp, FaArrowCircleDown } from "react-icons/fa";

export default function ResponseField ({ indicator, assessment, respondent, responseInfo }){
    const [expanded, setExpanded] = useState(false);


    const { field } = useController({ name: `response_data.${indicator.id}.value` });
    const { control, setValue, getValues, unregister } = useFormContext();

    
    const shouldShow = useMemo(() => {
        if(!indicator || !assessment ||!respondent) return false;
        const logic = indicator.logic;
        //no logic, always return true
        if(!logic?.conditions || logic?.conditions?.length == 0) return true;
        if(indicator.logic.group_operator == 'AND'){
            return logic.conditions.every(c => (checkLogic(c, responseInfo, assessment, respondent)))
        }
        //must be an OR
        else{
            return logic.conditions.some(c => (checkLogic(c, responseInfo, assessment, respondent)))
        }
        return false;
    }, [JSON.stringify(responseInfo)]);


    useEffect(() => {
        if (!shouldShow) {
            if (indicator.type == 'multi') setValue(`response_data.${indicator.id}.value`, []);
            else if (indicator.type == 'single') setValue(`response_data.${indicator.id}.value`, null);
            else if (indicator.type == 'boolean') setValue(`response_data.${indicator.id}.value`, null);
            else setValue(`response_data.${indicator.id}.value`, '');
            unregister(`response_data.${indicator.id}.value`);
        }
    }, [shouldShow, setValue]);


    console.log(responseInfo)
    const convertType = (type) => {
        if(type=='boolean') return 'radio';
        else if(type=='single') return 'radio';
        else if(type=='multi') return 'multiselect';
        else if(type=='text') return 'textarea';
        else if(type=='integer') return 'number';
        else return type;
    }

    const options = useMemo(() => {
        let opts = indicator?.options?.map((o) => ({value: o.id, label: o.name})) ?? [];
        if(indicator.type == 'boolean') return [{value: true, label: 'Yes'}, {value: false, label: 'No'}]
        if(indicator.allow_none) opts.push({value: 'none', label: 'None of the above'})
        if(!indicator.match_options) return opts;
        else if(indicator.match_options){
            const valid = responseInfo?.[indicator.match_options]?.value;
            return opts.filter(o => (valid?.includes(o?.value) || o?.value == 'none'))
        }
    }, [JSON.stringify(responseInfo)])
    
    useEffect(() => {
        if (!['single', 'multi'].includes(indicator.type)) return;
        if (!options || options.length === 0) return;

        const val = getValues(`response_data.${indicator.id}.value`);
        const valid_ids = options.map(p => p.value);

        if (indicator.type === 'multi') {
            const valArray = Array.isArray(val) ? val : [];
            const filtered = valArray.filter(v => valid_ids.includes(v));
            setValue(`response_data.${indicator.id}.value`, filtered);
        }

        if (indicator.type === 'single') {
            const useVal = valid_ids.includes(val) ? val : null;
            setValue(`response_data.${indicator.id}.value`, useVal);
        }
    }, [options, indicator.id, setValue, getValues]);


    const handleMultiSelectChange = (selectedValues) => {
        const lastElement = selectedValues[selectedValues.length - 1];
        if (lastElement == 'none') {
            return ['none']; // reset everything else
        } 
        return selectedValues.filter(v => v !== 'none');
    };

    let fieldConfig = {
        type: convertType(indicator.type), 
        name: `response_data.${indicator.id}.value`, 
        label: `${indicator.order + 1}. ${indicator.name}`, 
        options: options, 
        onChange: indicator.type === 'multi' ? handleMultiSelectChange : undefined,
    }

    if(indicator.required){
        fieldConfig.rules = {
            validate: (value) => {
                // Allow false, 0, empty array, but disallow null or undefined
                console.log(value)
                if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
                    return 'Required';
                }
                return true;
            }
        };
        fieldConfig.label = `${indicator.order + 1}. ${indicator.name}*`
    }
    
    if(!shouldShow) return <></>
    return(
        <div className={styles.formSection}>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <Field control={control} field={fieldConfig} />
                <div style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto' }} onClick={() => setExpanded(!expanded)}>
                    {expanded ? <FaArrowAltCircleUp fontSize={30} /> : <FaArrowAltCircleDown fontSize={30} />}
                </div>
            </div>
            {expanded && <div>
                <Field control={control} field={{ name: `response_data.${indicator.id}.date`, label: 'Date', type: "date" }} />
                <Field control={control} field={{ name: `response_data.${indicator.id}.location`, label: 'Response Location', type: "text" }} />
            </div>}
        </div>
    )
}