import Messages from '../Messages';

export default function Input({ name, type, label, onChange, onBlur, value, errors=[] }){
    if(type==='textarea'){
        return(
            <div>
                <label htmlFor={name}>{label}</label>
                <textarea id={name} name={name} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
                <Messages errors={errors} />
        </div>
        )
    }

    return(
        <div>
            <label htmlFor={name}>{label}</label>
            <input id={name} name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
            <Messages errors={errors} />
        </div>
    )
}