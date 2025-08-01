import Field from "./Field";
import styles from '../../../styles/form.module.css';

export default function FormSection({ fields, control, header=null }) {
    return (
        <div className={styles.formSection}>
            {header && <h3>{header}</h3>}
            {fields.map((field) => (
                <Field key={field.name} field={field} 
                    control={control} 
                    labelField={field?.labelField ?? 'label'} valueField={field?.valueField ?? 'value'}
                    includeParams={field?.includeParams ?? []} excludeParams={field?.excludeParams ?? []}
                />
            ))}
        </div>
    );
}