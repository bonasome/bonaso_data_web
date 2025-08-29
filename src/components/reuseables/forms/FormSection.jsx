import Field from "./Field";

import styles from '../../../styles/form.module.css';

//a section of a form. helps with logic/segmenting/styling.
export default function FormSection({ fields, control, header=null }) {
    /*
    Displays a set of related fields (or inputs) in a form. Can be collectively shown/hidden
    based on form logic. 
    - fields (array): inputs to display in section, look at [./Field.jsx] and [../../indicators/IndicatorForm.jsx]
        for examples/details of constructing a form
    - control (RHF control): RHF control
    - header (string, optional): show a header value at the top of the section
    */
    return (
        <div className={styles.formSection}>
            {header && <h3>{header}</h3>}
            {fields.map((field) => (
                <Field key={field.name} field={field} 
                    control={control} 
                    labelField={field?.labelField ?? 'label'} valueField={field?.valueField ?? 'value'} //in case using models
                    includeParams={field?.includeParams ?? []} excludeParams={field?.excludeParams ?? []} //filter model select index components
                    tooltip={field?.tooltip ?? null} placeholder={field?.placeholder ?? null}
                    search={field?.search ?? false} //used for select only
                    blacklist={field?.blacklist ?? []} //used for model selects to filter out certain values
                />
            ))}
        </div>
    );
}