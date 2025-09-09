import { useState } from 'react'

import styles from './buttonHover.module.css';


export default function ButtonHover({ callback, noHover, hover, showBoth=true, forDelete=false, forWarning=false }){
    /*
    Button that shows more information on hover, usually an icon that shows textual information on hover.
    - callback (function): onClick
    - noHover (child): item/text to display when not hovered
    - hover (child): item/text to display when hovered over
    - showBoth (boolean): optionally hide the noHover component on hover
    - forDelete (boolean): alters the button style if it is meant to be used for a delete/remove function
    - forWarning (boolean): alters the button style if it is used in a warning capacity (i.e. flags)
    */
    const [hovered, setHovered] = useState(false);

    return (
        <button className={forDelete ? styles.delete : forWarning ? styles.warning : styles.dynamicButton} onMouseEnter={() => setHovered(true)} 
            onMouseLeave={() => setHovered(false)} type='button'
            onClick={()=> {callback ? callback() : null}} aria-label={hover.replace(/\s+/g, '').toLowerCase()}
        >
            <div className={(hovered && hover) ? styles.default : styles.noHoverDefault}>
                {(!hovered || showBoth) && noHover }
            </div>
            <div>
                {hovered && hover}
            </div>
        </button>
    )
}