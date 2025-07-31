import { Controller }from 'react-hook-form';

import Input from '../inputs/Input';
import RadioButtons from '../inputs/RadioButtons';
import MultiCheckbox from '../inputs/MultiCheckbox';
import Checkbox from '../inputs/Checkbox';
import ModelSelect from '../inputs/ModelSelect';
import ModelMultiSelect from '../inputs/ModelMultiSelect';
import SimpleDynamicRows from '../inputs/SimpleDynamicRows';
import ImageSelect from '../inputs/ImageSelect';

export default function Field({ field, control }) {
  const { type, name, rules, label, options, IndexComponent, images, labelField, valueField, includeParams, excludeParams } = field;

  return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field: controllerField, fieldState }) => {
                const commonProps = {
                    ...controllerField,
                    label,
                    errors: fieldState.error ? [fieldState.error.message] : [],
                };

                switch (type) {
                case "text":
                case "email":
                case "password":
                case "date":
                case "number":
                case "textarea":
                    return <Input type={type} {...commonProps} />;
                case "radio":
                    return <RadioButtons options={options} labelField={labelField} valueField={valueField} {...commonProps} />;
                case "checkbox":
                    return <Checkbox  {...commonProps} />;
                case 'multiselect':
                    return <MultiCheckbox labelField={labelField} valueField={valueField} {...commonProps} options={options} />
                case 'image':
                    return <ImageSelect {...commonProps} options={options} images={images} />
                case 'rows':
                    return <SimpleDynamicRows {...commonProps} />
                case 'model':
                    return <ModelSelect labelField={labelField} {...commonProps} IndexComponent={IndexComponent} includeParams={includeParams} excludeParams={excludeParams}/>
                case 'multimodel':
                    return <ModelMultiSelect labelField={labelField} {...commonProps} IndexComponent={IndexComponent} includeParams={includeParams} excludeParams={excludeParams}/>
                    
                default:
                    return <p>Unsupported field type: {type}</p>;
                }
            }}
        />
    );
}