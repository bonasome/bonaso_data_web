import Messages from '../Messages';
import Tooltip from '../Tooltip';

//input that generates most keyboard inputs
export default function Input({ name, type, label, onChange, onBlur, value, errors=[], tooltip=null, placeholder=null }){
    if(placeholder && !['text', 'number', 'textarea'].includes(type)) console.warn(`Input type ${type} does not support placeholders.`)
    
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

    return(
        <div>
            <label htmlFor={name} style={{ display: 'flex', flexDirection: 'row'}}>
                {label}
                {tooltip && <Tooltip msg={tooltip} />}
            </label>
            <input id={name} name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder}/>
            <Messages errors={errors} />
        </div>
    )
}