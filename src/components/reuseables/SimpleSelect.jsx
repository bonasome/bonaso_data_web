import styles from '../../styles/reuseableComponents.module.css';
import { useEffect, useState } from 'react';
//note, when passing a callback, this component will automatically pass the selected value as a component

export default function SimpleSelect({ name, optionValues, optionLabels=null, label = null, multiple=false, search=false, callback=null, nullOption=true, defaultOption=null, required=false }){
    const [values, setValues] = useState(optionValues);
    const [labels, setLabels] = useState(optionLabels);
    const [selectedVal, setSelectedVal] = useState('');
    
    useEffect(() => {
        let vals = [...optionValues];
        let labs = optionLabels ? [...optionLabels] : [...optionValues];

        if (optionLabels && optionValues.length !== optionLabels.length) {
            console.warn('Warning: Labels do not match values. Using values as labels.');
            labs = [...optionValues];
        }
        if (nullOption) {
            vals = ['', ...vals];
            labs = ['-----', ...labs];
        }
        setValues(vals);
        setLabels(labs);

        if (!defaultOption && nullOption) {
            setSelectedVal('');
        } 
        else if (defaultOption && vals.includes(defaultOption)) {
            setSelectedVal(defaultOption);
        } 
        else if (defaultOption && !vals.includes(defaultOption)) {
            console.warn('Default option is not in list.');
            setSelectedVal('');
        } 
        else {
            setSelectedVal(vals[0]);
        }
    }, []);

    const [multiSelectVals, setMultiSelectVals] = useState([selectedVal]);
    const [searchValue, setSearchValue] = useState('')
    
    const handleChange = (event) => {
        if(multiple){
            let selected = [];
            const options = event.target.options;
            let none = false
            Array.from(options).forEach((option) => {
                if(option.selected){
                    if(option.value == ''){none=true;};
                    selected.push(option.value);
                };
            });
            if(none){
                selected = []
            }
            setMultiSelectVals(selected)
            if(callback){
                callback(event);
            }
        }
        else{
            setSelectedVal(event.target.value);
            if(callback){
                callback(event);
            };
        };
        
    }

    return(
        <label htmlFor={name}>
            {label ? label : name + (multiple ? '(cntrl+click to select multiple)': '')}
            {search ? <input id={`search_${name}`} className={styles.selectSearch} type="text" value = {searchValue} onChange={(e)=>setSearchValue(e.target.value)} placeholder={'start typing to search...'}/> : <></>}
            <select id={name} name={name} multiple={multiple} onChange={handleChange} className={styles.select} required={required} value={multiple ? multiSelectVals : selectedVal}>
                {values.map((val, index) => {
                    let show = false
                    if(val == ''){
                        show=true;
                    }
                    const searchTerm = searchValue.toLowerCase();
                    if(labels){
                        let searchLabel = labels[index].toString().toLowerCase();
                        if(searchLabel.includes(searchTerm)){
                            show=true;
                        }
                    }
                    let searchVal = val.toString().toLowerCase();
                    if(searchVal.includes(searchTerm) || searchVal == ''){
                        show=true;
                    }
                    if(show){
                        return(<option key={val} value={val} >{optionLabels ? labels[index] : val}</option>)
                    }
                })}
            </select>
        </label>
    )
}