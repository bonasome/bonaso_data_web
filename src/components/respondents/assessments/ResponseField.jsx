import { useEffect, useState, useMemo } from "react";
import { useForm,  useWatch, useController, useFormContext, FormProvider } from "react-hook-form";

import { checkLogic } from "./helpers";

import Field from "../../reuseables/forms/Field";
import styles from '../../../styles/form.module.css';
import { FaArrowAltCircleDown, FaArrowAltCircleUp, FaArrowCircleDown } from "react-icons/fa";

export default function ResponseField ({ indicator, shouldShow=false, options=[] }){
    /*
    Displays a response field for a specific indicator within an assessment.
    - indicator (object): indicator being responded to
    - shouldShow(object): should this question be visible based on logic rules
    - options(array): options to use, if applicable
    */
    const [expanded, setExpanded] = useState(false); //show meta fields (date/location)

    //set context variables based on FormProvider
    const { field } = useController({ name: `response_data.${indicator.id}.value` });
    const { control, setValue, getValues, formState } = useFormContext();

    //conver the indicator types to what we use to build fields
    const convertType = (type) => {
        if(type=='boolean') return 'radio';
        else if(type=='single') return 'radio';
        else if(type=='multi') return 'multiselect';
        else if(type=='text') return 'textarea';
        else if(type=='integer') return 'number';
        else return type;
    }

    //special onChange that handles none option for multiselect
    const handleMultiSelectChange = (selectedValues) => {
        const lastElement = selectedValues[selectedValues.length - 1];
        if (lastElement == 'none') {
            return ['none']; // reset everything else
        } 
        return selectedValues.filter(v => v !== 'none');
    };

    //field config object
    let fieldConfig = {
        type: convertType(indicator.type), 
        name: `response_data.${indicator.id}.value`, 
        label: `${indicator.order + 1}. ${indicator.name}`, 
        options: options, 
        onChange: indicator.type === 'multi' ? handleMultiSelectChange : undefined,
    }
    //if required, add rules (false is OK)
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
    //if a description, pass it as a tooltip
    if(indicator.description && indicator.description != ''){
        fieldConfig.tooltip = indicator.description;
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
                {/* Optional date.location fields if different from the main interaction */}
                <p><i>You only need to record date/location information here if it differs from the Date of Interaction/Location of Interaction you entered above.</i></p>
                <Field control={control} field={{ name: `response_data.${indicator.id}.date`, label: 'Date', type: "date", }} />
                <Field control={control} field={{ name: `response_data.${indicator.id}.location`, label: 'Response Location', type: "text" }} />
            </div>}
        </div>
    )
}