import Messages from '../Messages';
import Tooltip from '../Tooltip';
import Input from './Input';

export default function MutliInt({ name, label, options, value, onChange, onBlur, errors, valueField='value', labelField='label', tooltip=null, warnings=[] }){
    // options {value: id, label: name}
    // value: [id]: {value: int, option: fk}
    const setValue = (val, option) => {
        console.log(value, option)
        let toUpdate = value.find(v => v.option == option)
        const left = value.filter(v => v.option != option)
        toUpdate.value = val;
        onChange([...left, toUpdate])
    }

    if(!options || options.length ==0) return <></>
    return (
        <div>
            <Messages errors={errors} warnings={warnings} />
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <p>{label} (Enter a number for each category.)</p>
                {tooltip && <Tooltip msg={tooltip} />}
            </div>
            {options.map((o) => {
                return (<div style={{ display: 'flex', flexDirection: 'row' }}>
                    <p>{o.label}</p>
                    <Input name={o.label} onChange={(v) => setValue(v, o.value)} value={value?.find(v => v?.option == o?.value)?.value ?? ''} />
                </div>)
            })}
        </div>

    );
}