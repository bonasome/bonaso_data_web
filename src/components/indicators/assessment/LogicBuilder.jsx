import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import useWindowWidth from "../../../../services/useWindowWidth";

import Field from "../../reuseables/forms/Field";

import styles from '../../../styles/form.module.css';
import errorStyles from '../../../styles/errors.module.css';

import theme from "../../../../theme/theme";
import { FaPlusSquare, FaMinusSquare } from "react-icons/fa";
export default function LogicBuilder({ order, meta, assessment }) {
    /*
    Helper component within the AssessmentIndicator form that builds a dynamic array of logic conditions.
    - order (int): order of the parent indicator for helping with determinning what other indicators should be eligible as a source
    - meta (object): model information
    - assessment (object): information about the rest of the assessment
    */
    const { control, setValue } = useFormContext(); //form context from FormProvider
    const width = useWindowWidth();
    const { fields, append, remove } = useFieldArray({
        control,
        name: `logic_data.conditions`,
    }); //list of dynamic logic conditin fields
    const logicConditions = useWatch({
        control,
        name: "logic_data.conditions",
        defaultValue: []
    }); //watch conditions to help determine what should be visible
    
    return (
        <div className={styles.formSection}>
            <h3>Show Question If</h3>
            {/* This only needs to be answered if there is more than one. Otherwise we can just default to AND */}
            {fields.length > 1 && <Field control={control} field={{ name: `logic_data.group_operator`, label: 'Group Operator', type: "select", 
                rules: { required: "Required"}, options: meta?.group_operators,
            }} />}

            {fields.map((field, index) => {
                {/* "watch" this condition specifically */}
                const condition = logicConditions[index];
                {/* Find what source indicaotr was selected */}
                const selectedIndicator = assessment.indicators.find(
                    (ind) => ind.id == condition?.source_indicator
                );
                let indOptions = []
                {/* Determine if it has options and if so, set the correct values/operators */}
                if(selectedIndicator?.options?.length > 0){
                    indOptions = selectedIndicator?.options?.map((o) => ({
                        value: o.id,
                        label: o.name
                    }));
                    if(condition?.operator == '='){
                        indOptions.push({ value: 'any', label: 'Any'})
                        if(selectedIndicator.allow_none) indOptions.push({ value: 'none', label: 'None'});
                        if(selectedIndicator.type == 'multi') indOptions.push({ value: 'all', label: 'All'});
                    }
                }
                {/* Filter out options that don't make sense */}
                let operatorOptions = meta?.operators ?? [];
                if(['single', 'multi', 'boolean'].includes(selectedIndicator?.type)) operatorOptions = meta?.operators.filter((o) => ['=', '!='].includes(o.value));
                if(['text'].includes(selectedIndicator?.type)) operatorOptions = meta?.operators.filter((o) => !['>', '<'].includes(o.value));
                if(['integer'].includes(selectedIndicator?.type)) operatorOptions = meta?.operators.filter((o) => !['!contains', 'contains'].includes(o.value));
                if(meta.respondent_choices?.[condition?.respondent_field]) operatorOptions = meta?.operators.filter((o) => ['=', '!='].includes(o.value));
                
                return (
                    <div key={field.id} style={{ backgroundColor: theme.colors.bonasoMain, padding: '2vh', margin: '2vh'}}>
                        {/* Source Type */}
                        <Field control={control} field={{ name: `logic_data.conditions.${index}.source_type`, 
                            label: 'Type of Rule', type: "select", rules: { required: "Required"},
                            options: meta.source_types
                        }} />
                        
                        {condition?.source_type && condition?.source_type != '' && <div style={ width > 760 ? { display: 'flex', flexDirection: 'row'} : {}}>
                            {/* Source Indicator Selection if source type is assessment */}
                            {condition?.source_type === "assessment" && (
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.source_indicator`, 
                                    label: 'Show when...', type: "select", rules: { required: "Required"},
                                    options: assessment.indicators.filter((si) => (si.order < order && si.type != 'multint'))
                                        .map((si) => ({value: si.id, label: si.name})), 
                                    label: 'This indicator...'}}
                                />
                            )}

                            {/* Respondent Field Selection if source type is respondent */}
                            {condition?.source_type === "respondent" && (
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.respondent_field`, 
                                    label: 'This respondent...', type: "select", rules: { required: "Required"},
                                    options: meta.respondent_fields
                                }} />
                            )}

                            {/* Operator (with filtered options) */}
                            <Field control={control} field={{ name: `logic_data.conditions.${index}.operator`, 
                                label: 'Operator...', type: "select", rules: { required: "Required"},
                                options: operatorOptions
                            }} />
                            
                            {/* If source has options, create a select with available options (plus condition types if applicable) */}
                            {condition?.source_type === "assessment" && ['single', 'multi'].includes(selectedIndicator?.type) && <div>
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.value_option`, 
                                    label: 'Value...', type: "select", rules: { required: "Required"},
                                    options: indOptions,
                                }} />
                            </div>}
                            
                            {/* Boolean create yes/no radio */}
                            {condition?.source_type === "assessment" && selectedIndicator?.type === 'boolean' &&
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.value_boolean`, 
                                    label: 'Value...', type: "radio",
                                    options: [{label: 'Yes', value: true}, {label: 'No', value: false}],
                                }} />
                            }       
                            {/* Text create input */}
                            {condition?.source_type === "assessment" && selectedIndicator?.type === 'text' &&
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.value_text`, 
                                    label: 'Value...', type: "text", rules: { required: "Required"},
                                }} style={{ maxWidth: '25vh' }}/>
                            }
                            {/* Int create input with numeric only */}
                            {condition?.source_type === "assessment" && selectedIndicator?.type === 'integer' &&
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.value_text`, 
                                    label: 'Value...', type: "number", rules: { required: "Required"},
                                }} style={{ maxWidth: '25vh' }} />
                            }
                            
                            {/* For respondent, use valid fields from backend if provided, else allow for text inputs */}
                            {condition?.source_type === "respondent" && condition?.respondent_field && (
                                meta.respondent_choices?.[condition?.respondent_field] ? (
                                    <Field control={control} field={{ name: `logic_data.conditions.${index}.value_text`, 
                                        label: 'Value...', type: "select", rules: { required: "Required"},
                                        options: meta.respondent_choices[condition?.respondent_field],
                                    }} />

                                ) : (
                                    <Field control={control} field={{ name: `logic_data.conditions.${index}.value_text`, 
                                        label: 'Value...', type: "text", rules: { required: "Required"}, 
                                    }} style={{ maxWidth: '25vh' }} />
                                )
                            )}
                        </div>}
                        {/* Removes a condition */}
                        <button type="button" onClick={() => remove(index)} className={errorStyles.deleteButton}><FaMinusSquare /> Remove</button>
                    </div>
                );
            })}

            {/* Add a condition */}
            <button
                type="button"
                onClick={() =>
                    append({
                        source_type: "assessment",
                        source_indicator: null,
                        operator: "=",
                        value_text: "",
                        value_option: null
                    })
                }
            >
                <FaPlusSquare /> Add Condition
            </button>
        </div>
    );
}