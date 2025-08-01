import Messages from "../Messages";
import { IoMdRadioButtonOff, IoMdRadioButtonOn } from "react-icons/io";
import styles from '../../../styles/form.module.css';
export default function RadioButtons({
    name,
    label,
    value,
    onChange,
    options,
    errors = [],
    valueField = "value",
    labelField = "label"
}) {

    return (
        <div className={styles.radio}>
            <label style={{ marginBottom: 20}}>{label}</label>

            {options.map((option, index) => {
                const optionValue = option[valueField];
                const optionLabel = option[labelField];
                const isSelected = value === optionValue;

                return (
                    <div key={index} style={{ display: "flex", flexDirection: "row" }}>
                        <label htmlFor={optionValue} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <input
                            id={optionValue}
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