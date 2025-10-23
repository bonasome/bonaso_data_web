import { useState } from 'react';
import Messages from '../Messages';
import Tooltip from '../Tooltip';
import { FaSearch } from 'react-icons/fa';

export default function Select({ name, label, onChange, onBlur, value, options, errors=[], tooltip=null, search=false, onSearchChange=null }){
    /*
    Select component that allows a user to select a single value from  a list. Radio Buttons are preferable 
    unless the list of options is on the longer side.
    - name (string): name the input should use (for html name/id)
    - label (string): what the user should see
    - options (array, optional): what are the options as an array of objects with a value and label field
    - labelField (string, optional): used with options/IndexComponent, tells the component what key in 
        the object to use as the label (default, label)
    - valueField (string, optional): used with options/IndexComponent, tells the coomponent what key in 
        the object to use as the value (default, value)
    - onBlur (function, RHF): onBlur
    - errors (array, RHF): field errors
    - tooltip (string, optional): text to display when hovering over a tooltip (no tooltip will show if left null)
    - search (boolean, optional): display a search bar that will only show options whose label includes the search term
    */

    //control search term (if search is enabled)
    const [searchTerm, setSearchTerm] = useState('');

    //filter based on search, also always include blank option
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
                {/* if search is enabled show the bar above the select */}
                {search && <div style={{ display: 'flex', flexDirection: 'row', marginLeft: 20}}>
                    <FaSearch style={{ marginTop: 'auto', marginBottom: 'auto'}} />
                    <input
                        id={`search_${name}`}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {setSearchTerm(e.target.value); onSearchChange ? onSearchChange(e.target.value) : null }}
                        placeholder='Start typing to search...'
                        style={{ maxWidth: 200, padding: 4, marginBottom: 1}}
                    />
                </div>}
                <select
                    id={name}
                    name={name}
                    onChange={(e) => onChange(event.target.value)}
                    value={value}
                    style={{ padding: 10, margin: 10, maxWidth: '40vh', borderRadius: 0}}
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