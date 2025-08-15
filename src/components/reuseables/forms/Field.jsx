import { Controller }from 'react-hook-form';

import Input from '../inputs/Input';
import RadioButtons from '../inputs/RadioButtons';
import MultiCheckbox from '../inputs/MultiCheckbox';
import Checkbox from '../inputs/Checkbox';
import ModelSelect from '../inputs/ModelSelect';
import ModelMultiSelect from '../inputs/ModelMultiSelect';
import SimpleDynamicRows from '../inputs/SimpleDynamicRows';
import ImageSelect from '../inputs/ImageSelect';
import Select from '../inputs/Select';

//a singular field/question in a form. can support many different data types
export default function Field({ field, control }) {
  const { type, name, rules, label, options, IndexComponent, images, labelField, valueField, includeParams, excludeParams, tooltip, placeholder, search, blacklist } = field;
    //IndexComponent is the model select component, label/valueField are used to when providing maps (if not names label/valuve)
    //include/exclude params for filtering model index components
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
                    tooltip,
                };

                switch (type) {
                case "text":
                case "email":
                case "password":
                case "date":
                case "number":
                case "textarea":
                    return <Input type={type} {...commonProps} placeholder={placeholder} />;
                case 'select': //single select, radio is preferred unless the options are many
                    return <Select options={options} {...commonProps} search={search} />;
                case "radio": //single select from list
                    return <RadioButtons options={options} labelField={labelField} valueField={valueField} {...commonProps} />;
                case "checkbox": //toggle for true/false or switchpaths
                    return <Checkbox  {...commonProps} />;
                case 'multiselect': //multiselect from checkbox
                    return <MultiCheckbox labelField={labelField} valueField={valueField} {...commonProps} options={options} />
                case 'image': //select with an icon, for that pretty factor
                    return <ImageSelect {...commonProps} options={options} images={images} />
                case 'rows': //add/subtract dynamic number of rows with inputs
                    return <SimpleDynamicRows {...commonProps} />
                case 'model': //select a model instance 
                    return <ModelSelect labelField={labelField} {...commonProps} IndexComponent={IndexComponent} includeParams={includeParams} excludeParams={excludeParams} blacklist={blacklist} />
                case 'multimodel': //select multiple models
                    return <ModelMultiSelect labelField={labelField} {...commonProps} IndexComponent={IndexComponent} includeParams={includeParams} excludeParams={excludeParams} blacklist={blacklist} />
                    
                default:
                    return <p>Unsupported field type: {type}</p>;
                }
            }}
        />
    );
}