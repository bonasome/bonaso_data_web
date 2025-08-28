import Messages from '../Messages';
import Tooltip from '../Tooltip';

import styles from './checkbox.module.css';

import { GrCheckbox } from "react-icons/gr";
import { IoCheckboxSharp } from "react-icons/io5";

export default function MultiCheckboxNum({ options, name, value, label, onChange, error }) {

    const toggleValue = (val) => {
        const updated = value?.find(v => val?.id == v?.subcategory?.id)
            ? value?.filter(v => v?.subcategory?.id != val?.id)
            : [...value, {id: null, subcategory: {id: val.id, name: val.name}, numeric_component: ''}];
        onChange(updated);
    };

    const changeNumber = (val, num) => {
        const toUpdate = value?.find(v => val?.id == v.subcategory?.id);
        const others = value?.filter(v => val?.id != v.subcategory?.id);
        const updated = { ...toUpdate, numeric_component: num };
        onChange([...others, updated]);
    };

    return (
        <div>
            <p>{label}</p>
            {options.map(item => {
                const number = String(
                    value?.find(v => item?.id == v?.subcategory?.id)?.numeric_component ?? ''
                );
                const checked = value?.find(v => item?.id == v?.subcategory?.id);

                return (
                    <div className={styles.checkbox}>
                        <input
                            type="checkbox"
                            name={item.id}
                            checked={checked}
                            onChange={() => toggleValue(item)}
                            id={`${item.id}`}
                            style={{ display: "none" }}
                        />
                        <label htmlFor={`${item.id}`}>
                            {checked ? <IoCheckboxSharp style={{ marginRight: 12}} /> : 
                                <GrCheckbox style={{ marginRight: 12}}/>}
                            {item.name}
                        </label>
                        {checked && <input type="number" value={number} onChange={(e) => changeNumber(item, e.target.value)} />}
                    </div>
                )

            })}
            {error && <Messages errors={error} />}
        </div>
    );
}