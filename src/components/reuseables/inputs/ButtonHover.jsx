import { useState } from 'react'
import styles from './buttonHover.module.css';

export default function ButtonHover({ callback, noHover, hover, showBoth=true, forDelete=false, forWarning=false }){
    const [hovered, setHovered] = useState(false);
    return (
        <button className={forDelete ? styles.delete : forWarning ? styles.warning : styles.dynamicButton} onMouseEnter={() => setHovered(true)} 
            onMouseLeave={() => setHovered(false)} 
            onClick={()=> {callback ? callback() : null}}>
                <div className={hovered ? styles.default : styles.noHoverDefault}>
                    {(!hovered || showBoth) && noHover }
                </div>
                <div>
                    {hovered && hover}
                </div>
        </button>
    )
}