import Messages from '../Messages';
import Tooltip from '../Tooltip';
import Input from './Input';

export default function MutliInt({ name, label, options, value, onChange, onBlur, errors, valueField='value', labelField='label', tooltip=null, warnings=[] }){
    /*
    Allows a user to enter a number paired to an option for a list of options.
    - name (string): field name
    - label (string): label to display to user
    - options (array): options to pair numeric inputs with ({value: id, label: name})
    - value (array): set of values to use with an option id and a value ({value: int, option: fk})
    ... RHF fields
    */
    
    const setValue = (val, option) => {
        //update the value
        let toUpdate = value.find(v => v.option == option)
        const left = value.filter(v => v.option != option)
        toUpdate.value = val;
        onChange([...left, toUpdate])
    }

    if(!options || options.length ==0) return <></>
    return (
        <div>
            <Messages errors={errors} warnings={warnings} />
            <fieldset style={{ border: 'none' }} name={name}>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <legend>{label} (Enter a number for each category.)</legend>
                    {tooltip && <Tooltip msg={tooltip} />}
                </div>
                {options.map((o) => {
                    return (<div style={{ display: 'flex', flexDirection: 'row' }}>
                        <p>{o.label}</p>
                        <Input name={o.label} onChange={(v) => setValue(v, o.value)} value={value?.find(v => v?.option == o?.value)?.value ?? ''} />
                    </div>)
                })}
            </fieldset>
        </div>

    );
}