import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import Select from "../../reuseables/inputs/Select";
import Input from "../../reuseables/inputs/Input";
import Field from "../../reuseables/forms/Field";
import styles from '../../../styles/form.module.css';
export default function OptionsBuilder() {
    /*
    Helper component within the AssessmentIndicator form that builds a dynamic array of options.
    */
    const { control } = useFormContext(); //context from FormProvider

    const { fields, append, remove } = useFieldArray({
        control,
        name: `options_data`,
    }); //dynamic array of options

    const options = useWatch({
        control,
        name: "options_data",
        defaultValue: [{name: ''}]
    });
    
    return (
        <div className={styles.formSection}>
            <h3>Options</h3>
            {fields.map((field, index) => {
                return (
                    <div key={field.id} style={{ display: 'flex', flexDirection: 'row'}}>
                        {/* User enters a value into each row */}
                        <Field control={control} field={{ name: `options_data.${index}.name`, 
                            label: `${index+1}.`, type: "text", rules: { required: "Required" },
                        }} style={{ display: 'flex', flexDirection: 'row'}} />
                        <button type="button" onClick={() => remove(index)}>Remove</button>
                    </div>
                );
            })}

            <button type="button" onClick={() =>append({
                        name: '',
                    })}
            >
                Add Option
            </button>
        </div>
    );
}