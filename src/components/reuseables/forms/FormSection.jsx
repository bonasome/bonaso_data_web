import Field from "./Field";

export default function FormSection({ fields, control }) {
    return (
        <div className="form-section">
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