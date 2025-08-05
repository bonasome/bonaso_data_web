import Messages from "../Messages";
import Tooltip from '../Tooltip';

import styles from '../../../styles/form.module.css';

import { IoMdRadioButtonOff, IoMdRadioButtonOn } from "react-icons/io";

//single select radio buttons from a list of options
export default function RadioButtons({ name, label, value, onChange, options, errors = [], valueField = "value", labelField = "label", tooltip=null}) {

    return (
        <div className={styles.radio}>
            <div style={{ display: 'flex', flexDirection: 'row'}}>
                <label>{label}</label>
                {tooltip && <Tooltip msg={tooltip} style={{ marginBottom: 20}}/>}
                <p></p>
            </div>
            {options.map((option, index) => {
                const optionValue = option[valueField];
                const optionLabel = option[labelField];
                const isSelected = value === optionValue;

                return (
                    <div key={index} style={{ display: "flex", flexDirection: "row" }}>
                        <label htmlFor={`${name}__${optionValue}`} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <input
                            id={`${name}__${optionValue}`}
                            type="radio"
                            name={name}
                            value={optionValue}
                            checked={isSelected}
                            onClick={() => {
                                onChange(isSelected ? null : optionValue);
                            }}
                            style={{ display: "none" }}
                        />
                        <div style={{ margin: 4}}>
                            {isSelected ? <IoMdRadioButtonOn fontSize={20} /> : <IoMdRadioButtonOff fontSize={20}/>}
                        </div>
                        {optionLabel}
                        </label>
                    </div>
                );
            })}

            <Messages errors={errors} />
        </div>
    );
}