import Messages from '../Messages';
import Tooltip from '../Tooltip';

//input that generates most keyboard inputs
export default function Input({ name, type, label, value, onChange, onBlur, errors=[], tooltip=null, placeholder=null, flexOverride=false }){
    /*
    Input for various types of keyboard inputs
    - name (string): html name/id
    - type (string): what type of input should this be (text, date, textarea, number)
    - label (string): checkbox label
    - value (boolean): is checkbox checked
    - onChange (function): what to do when clicked
    - onBlur (function, optional): what to do onBlur (RHF)
    - errors (array, optional): field errors to display (RHF)
    - tooltip (string, optional): text to display in tooltip
    -placeholder (string, optional): text to display when value is empty
  */
    {/* warn if they tried to pass a prop to a date */}
    if(placeholder && !['text', 'number', 'textarea'].includes(type)) console.warn(`Input type ${type} does not support placeholders.`)
    
        {/* if textarea return textarea */}
    if(type==='textarea'){
        return(
            <div>
                <label htmlFor={name} style={{ display: 'flex', flexDirection: 'row'}}>
                    {label}
                    {tooltip && <Tooltip msg={tooltip} />}
                </label>
                <textarea id={name} name={name} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} />
                <Messages errors={errors} />
            </div>
        )
    }
    {/* else return input with type prop */}
    return(
        <div style={flexOverride ? {display: 'flex', flexDirection: 'row'} : {}}>
            <label htmlFor={name} style={{ display: 'flex', flexDirection: 'row'}}>
                {label}
                {tooltip && <Tooltip msg={tooltip} />}
            </label>
            <input id={name} name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder}/>
            <Messages errors={errors} />
        </div>
    )
}