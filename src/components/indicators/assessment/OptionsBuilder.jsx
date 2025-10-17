import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import Select from "../../reuseables/inputs/Select";
import Input from "../../reuseables/inputs/Input";
import Field from "../../reuseables/forms/Field";
import styles from '../../../styles/form.module.css';
export default function OptionsBuilder() {
    const { control } = useFormContext();

    const { fields, append, remove } = useFieldArray({
        control,
        name: `options_data`,
    });
    console.log(fields)
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
                        {/* Source Type */}
                        <Field control={control} field={{ name: `options_data.${index}.name`, 
                            label: `${index+1}.`, type: "text", rules: { required: "Required" },
                        }} flexOverride={true} />
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