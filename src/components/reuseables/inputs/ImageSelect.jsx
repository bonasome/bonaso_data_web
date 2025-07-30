import { useState } from 'react';
import styles from './imgSelect.module.css';

function ImgCard({ value, label, Img, active, callback }) {
    const [hover, setHover] = useState(false);

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className={active ? styles.active : styles.passive}
            onClick={() => callback(value)}
        >
            <div>{<Img style={{ fontSize: 50 }} />}</div>
            {hover && <p>{label}</p>}
        </div>
    );
}

export default function ImageSelect({ label, value = null, onChange, options, images, multiple = false, errors }) {
    const handleChange = (val) => {
        if (multiple) {
            const exists = value?.includes(val);
            const updated = exists ? value.filter(v => v !== val) : [...(value || []), val];
            onChange(updated);
        } else {
            onChange(value === val ? null : val);
        }
    };

    return (
        <div>
            <fieldset>
                <legend>{label}</legend>
                <Messages errors={errors} />
                <div className={styles.container}>
                    {options.values.map((val, index) => (
                        <ImgCard
                            key={val}
                            value={val}
                            label={options.labels[index]}
                            Img={images[index]}
                            active={multiple ? value?.includes(val) : value === val}
                            callback={handleChange}
                        />
                    ))}
                </div>
            </fieldset>
        </div>
    );
}