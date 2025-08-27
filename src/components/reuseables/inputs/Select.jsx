import { useState } from 'react';
import Messages from '../Messages';
import Tooltip from '../Tooltip';
import { FaSearch } from 'react-icons/fa';

export default function Select({ name, type, label, onChange, onBlur, value, options, errors=[], tooltip=null, search=false }){
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = [
        { value: '', label: '-----' },
        ...options.filter(o =>
            o.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ];
    return(
        <div>
            <label htmlFor={name} style={{ display: 'flex', flexDirection: 'column'}}>
                <div style={{ display: 'flex', flexDirection: 'row'}}>
                    {label}
                    {tooltip && <Tooltip msg={tooltip} />}
                </div>
                {search && <div style={{ display: 'flex', flexDirection: 'row', marginLeft: 20}}>
                    <FaSearch style={{ marginTop: 'auto', marginBottom: 'auto'}} />
                    <input
                        id={`search_${name}`}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {setSearchTerm(e.target.value)}}
                        placeholder='Start typing to search...'
                        style={{ maxWidth: 200, padding: 4, marginBottom: 1}}
                    />
                </div>}
                <select
                    id={name}
                    name={name}
                    onChange={(e) => onChange(event.target.value)}
                    value={value}
                >
                    {filteredOptions.map(({ value, label }) => (
                        <option key={value + label} value={value}>
                        {label}
                        </option>
                    ))}
                </select>
            </label>
            <Messages errors={errors} />
        </div>
    )
}