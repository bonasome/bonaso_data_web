import { useState } from 'react';

import Messages from '../Messages';
import Tooltip from '../Tooltip';

import styles from './imgSelect.module.css';

function ImgCard({ value, label, Img, active, callback }) {
    /*
    Single image card
    - value (var): the value to be passed to the parent component
    - label (string): text to show when image is hovered over
    - Img (component): the image component
    - active (boolean): is this image currently selected (change styles if so)
    - callback (function): what to do onClick
    */
    const [hover, setHover] = useState(false);

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className={active ? styles.active : styles.passive}
            onClick={() => callback(value)}
            aria-label={label.replace(/\s+/g, '').toLowerCase()}
        >
            <div>{<Img style={{ fontSize: 50 }} />}</div>
            {hover && <p>{label}</p>}
        </div>
    );
}

export default function ImageSelect({ name, label, value = null, onChange, options, images, multiple=false, errors=[], tooltip=null, valueField='value', labelField='label' }) {
    /*
    Component that shows a set of images that when hovered over also show text. The user can click on the image 
    card to select it. Can be used to select and return one value or multiple values as an array.
    - name (string): html name/id
    - label (string): text to display to user above the component
    - value (var): whatever the value(s) of the selected items are
    - onChange (function): handle changes in user selection
    - options (array): array of objects that contain values and labels for each selection card
    - images (array): array of images to display alongside options. Should be in the same order as the options
    - multiple (boolean, optional): can the user select more than one item (if true, will return an array)
    - errors (array, RHF): display field errors
    - tooltip (string, optional): display a tooltip showing more information about the field
    - valueField (string, optional): the name of the key in the options array the component should use for the option value
    - labelField (string, optional): the name of the key in the options array the component should use for the option label
    */

    //handle a user selecting or unselecting items
    const handleChange = (val) => {
        //if multiple, either append or filter out the value depending on it it was already selected
        if (multiple) {
            const exists = value?.includes(val);
            const updated = exists ? value.filter(v => v !== val) : [...(value || []), val];
            onChange(updated);
        } 
        //else change value or set null if its already selected
        else {
            onChange(value === val ? null : val);
        }
    };

    return (
        <div>
            <fieldset style={{ border: 'none' }} name={name}>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <legend>{label}</legend>
                    {tooltip && <Tooltip msg={tooltip} />}
                </div>
                <Messages errors={errors} />
                <div className={styles.container}>
                    {options.map((o, index) => {
                        const optionValue = o[valueField];
                        const optionLabel = o[labelField];
                        return <ImgCard
                            key={optionValue}
                            value={optionValue}
                            label={optionLabel}
                            Img={images[index]}
                            active={multiple ? value?.includes(optionValue) : value === optionValue} 
                            callback={handleChange}
                        />
                    })}
                </div>
            </fieldset>
        </div>
    );
}