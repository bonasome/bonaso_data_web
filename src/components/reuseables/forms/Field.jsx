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
import MultiCheckboxNum from '../inputs/MultiCheckboxNum';

export default function Field({ field, control }) {
    /*
    Singular form field that will represent one input in an RHF setup. Meant to be used with [./FormSection].
    - field (object): information about the input
    - control (RHF control): the RHF form control
    */
    const { type, name, rules, label, options, IndexComponent, labelField, valueField,  images, includeParams, excludeParams, blacklist, tooltip, placeholder, search } = field;
    /*
    Field props:
    - type (string): what type of data is this collecting (used to determine what type of input to show)
    - name (string): name the input should use (for html name/id)
    - label (string): what the user should see
    - options (array, optional): if creating for radio/checkbox/select/image select, what are the options as an 
        array of objects with a value and label field
    - IndexComponent (component, optional): if using a model select to select a foreign key, pass the index component
        that contains the list of components you want the user to see
    - labelField (string, optional): used with options/IndexComponent, tells the component what key in 
        the object to use as the label (default, label)
    - valueField (string, optional): used with options/IndexComponent, tells the coomponent what key in 
        the object to use as the value (default, value)
    - images (array, optional): used with image select to display a list of icons. Expected to be in the same
         order as the options array
    - includeParams (array, optional): used with IndexComponent to pass a URL filter to only show values that 
        meet certain criteria (array of objects like {filed: 'field', value: value})
    - excludeParams (array, optional): used with IndexComponent to pass a URL filter to hide values that meet 
        certain criteria (array of objects like {filed: 'field', value: value})
    - blacklist (array, optional): list of object IDs to hide from an IndexComponent
    - tooltip (string, optional): text to display when hovering over a tooltip (no tooltip will show if left null)
    - placeholder (string, optional): placeholder text for blank inputs (for use with text/textarea/number)
    - search (boolean, optional): for select, allows the option to search the select by the label field
    */
  return (
        <Controller name={name} control={control} rules={rules}render={({ field: controllerField, fieldState }) => {
            const commonProps = {...controllerField, label, 
                errors: fieldState.error ? [fieldState.error.message] : [],
                tooltip,
            };
            {/* switch to correct input type based on the type prop */}
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
                case 'multiselectnum': //multiselect from checkbox with numeric component that appears if checked (for use with indicator num select)
                    return <MultiCheckboxNum labelField={labelField} valueField={valueField} {...commonProps} options={options} />
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
        }}/>
    );
}