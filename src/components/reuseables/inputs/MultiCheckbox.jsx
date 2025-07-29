import { useState, useEffect } from 'react';
import Checkbox from './Checkbox';

export default function MultiCheckbox({ label, optionValues, optionLabels, callback, existing=[]}){
    const [isChecked, setIsChecked] = useState(existing);
    useEffect(() => {
        if(existing.length > 0){
            setIsChecked(existing)
        }
    }, [existing]);

    const handleCheck = (val, checked) => {
        if(checked){
            const updated = [...isChecked, val];
            setIsChecked(updated);
            callback(updated);
        }
        else{
            const updated = isChecked.filter(v => v !== val);
            setIsChecked(updated);
            callback(updated);
        }
    }

    return(
        <div>
            <p>{label}</p>
            {optionValues.length > 0 && optionValues.map((val, index) => (
                <Checkbox key={val} label={optionLabels?.[index] ?? val} checked={isChecked.includes(val)} callback={(checked)=> handleCheck(val, checked)} />
            ))}
        </div>
    )
}