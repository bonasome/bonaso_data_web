import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import Select from "../../reuseables/inputs/Select";
import Input from "../../reuseables/inputs/Input";
import Field from "../../reuseables/forms/Field";

export default function LogicBuilder({ order, meta, assessment }) {
    const { control } = useFormContext();

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
        <div>
            <Field control={control} field={{ name: `logic_data.group_operator`, label: 'Group Operator', type: "select", 
                rules: { required: "Required"}, options: meta?.group_operators,
            }} />

            {fields.map((field, index) => {
                const condition = logicConditions[index];
                const selectedIndicator = assessment.indicators.find(
                    (ind) => ind.id == condition?.source_indicator
                );
                return (
                    <div key={field.id}>
                        {/* Source Type */}
                        <Field control={control} field={{ name: `logic_data.conditions.${index}.source_type`, 
                            label: 'Show when...', type: "select", rules: { required: "Required"},
                            options: meta.source_types
                        }} />
                        {condition?.source_type && condition?.source_type != '' && <div>
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
                                options: (selectedIndicator?.type === 'single' || 
                                    selectedIndicator?.type === 'multiple' ||
                                    selectedIndicator?.type === 'boolean') ? 
                                    meta.operators.filter(o => (o.value == '=' || o.value == '!=')) :
                                    meta.operators
                            }} />
                            
                            {/* Value Logic */}
                            {condition?.source_type === "assessment" && (selectedIndicator?.type === 'single' || selectedIndicator?.type === 'multiple') &&
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.value_option`, 
                                    label: 'Value...', type: "select", rules: { required: "Required"},
                                    options: selectedIndicator?.options?.map((o) => ({
                                        value: o.id,
                                        label: o.name
                                    })) || [],
                                }} />
                            }
                            {condition?.source_type === "assessment" && selectedIndicator?.type === 'boolean' &&
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.value_boolean`, 
                                    label: 'Value...', type: "radio",
                                    options: [{label: 'Yes', value: true}, {label: 'No', value: false}],
                                }} />
                            } 
                            {condition?.source_type === "assessment" && (selectedIndicator?.type === 'text' || selectedIndicator?.type === 'number') &&
                                <Field control={control} field={{ name: `logic_data.conditions.${index}.value_text`, 
                                    label: 'Value...', type: "text", rules: { required: "Required"},
                                }} />
                            }
                            

                            {condition?.source_type === "respondent" && (
                                meta.respondent_choices?.[condition?.respondent_field] ? (
                                    <Field control={control} field={{ name: `logic_data.conditions.${index}.value_text`, 
                                        label: 'Value...', type: "select", rules: { required: "Required"},
                                        options: meta.respondent_choices[condition?.respondent_field],
                                    }} />

                                ) : (
                                    <Field control={control} field={{ name: `logic_data.conditions.${index}.value_text`, 
                                        label: 'Value...', type: "text", rules: { required: "Required"},
                                    }} />
                                )
                            )}
                        </div>}

                        <button type="button" onClick={() => remove(index)}>
                            Remove
                        </button>
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