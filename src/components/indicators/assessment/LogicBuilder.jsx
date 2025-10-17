import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import Select from "../../reuseables/inputs/Select";
import Input from "../../reuseables/inputs/Input";
import Field from "../../reuseables/forms/Field";

import styles from '../../../styles/form.module.css';
import theme from "../../../../theme/theme";

export default function LogicBuilder({ order, meta, assessment }) {
    const { control, setValue } = useFormContext();

    const { fields, append, remove } = useFieldArray({
        control,
        name: `logic_data.conditions`,
    });
    const logicConditions = useWatch({
        control,
        name: "logic_data.conditions",
        defaultValue: []
    });
    
    return (
        <div className={styles.formSection}>
            <h3>Show Question If</h3>
            {fields.length > 1 && <Field control={control} field={{ name: `logic_data.group_operator`, label: 'Group Operator', type: "select", 
                rules: { required: "Required"}, options: meta?.group_operators,
            }} />}

            {fields.map((field, index) => {
                const condition = logicConditions[index];
                const selectedIndicator = assessment.indicators.find(
                    (ind) => ind.id == condition?.source_indicator
                );
                let indOptions = []
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
                let operatorOptions = meta?.operators ?? [];
                if(['single', 'multi', 'boolean'].includes(selectedIndicator?.type)) operatorOptions = meta?.operators.filter((o) => ['=', '!='].includes(o.value));
                if(['text'].includes(selectedIndicator?.type)) operatorOptions = meta?.operators.filter((o) => !['>', '<'].includes(o.value));
                if(['integer'].includes(selectedIndicator?.type)) operatorOptions = meta?.operators.filter((o) => !['!contains', 'contains'].includes(o.value));
                
                return (
                    <div key={field.id} style={{ backgroundColor: theme.colors.bonasoMain, padding: '2vh', margin: '2vh'}}>
                        {/* Source Type */}
                        <Field control={control} field={{ name: `logic_data.conditions.${index}.source_type`, 
                            label: 'Type of Rule', type: "select", rules: { required: "Required"},
                            options: meta.source_types
                        }} />
                        
                        {condition?.source_type && condition?.source_type != '' && <div style={{ display: 'flex', flexDirection: 'row'}}>
                            {/* Indicator Selection */}
                            {condition?.source_type === "assessment" && (
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.source_indicator`, 
                                    label: 'Show when...', type: "select", rules: { required: "Required"},
                                    options: assessment.indicators.filter((si) => si.order < order)
                                        .map((si) => ({value: si.id, label: si.name})), 
                                    label: 'This indicator...'}}
                                />
                            )}

                            {/* Respondent Field Selection */}
                            {condition?.source_type === "respondent" && (
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.respondent_field`, 
                                    label: 'This respondent...', type: "select", rules: { required: "Required"},
                                    options: meta.respondent_fields
                                }} />
                            )}

                            {/* Operator */}
                            <Field control={control} field={{ name: `logic_data.conditions.${index}.operator`, 
                                label: 'Operator...', type: "select", rules: { required: "Required"},
                                options: operatorOptions
                            }} />
                            
                            {/* Value Logic */}
                            {condition?.source_type === "assessment" && ['single', 'multi'].includes(selectedIndicator?.type) && <div>
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.value_option`, 
                                    label: 'Value...', type: "select", rules: { required: "Required"},
                                    options: indOptions,
                                }} />
                            </div>}

                            {condition?.source_type === "assessment" && selectedIndicator?.type === 'boolean' &&
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.value_boolean`, 
                                    label: 'Value...', type: "radio",
                                    options: [{label: 'Yes', value: true}, {label: 'No', value: false}],
                                }} />
                            } 

                            {condition?.source_type === "assessment" && selectedIndicator?.type === 'text' &&
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.value_text`, 
                                    label: 'Value...', type: "text", rules: { required: "Required"},
                                }} style={{ maxWidth: '25vh' }}/>
                            }
                            {condition?.source_type === "assessment" && selectedIndicator?.type === 'integer' &&
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.value_text`, 
                                    label: 'Value...', type: "number", rules: { required: "Required"},
                                }} style={{ maxWidth: '25vh' }} />
                            }
                            

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

                        <button type="button" onClick={() => remove(index)}>Remove</button>
                    </div>
                );
            })}

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
                Add Condition
            </button>
        </div>
    );
}