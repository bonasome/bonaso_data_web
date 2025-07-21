import { useState } from 'react'
import styles from './buttonHover.module.css';

export default function ButtonHover({ callback, noHover, hover, showBoth=true, forDelete=false }){
    const [hovered, setHovered] = useState(false);
    return (
        <button className={forDelete ? styles.delete : styles.dynamicButton} onMouseEnter={() => setHovered(true)} 
            onMouseLeave={() => setHovered(false)} 
            onClick={()=> callback()}>
                <div className={hovered ? styles.default : ''}>
                    {(!hovered || showBoth) && noHover }
                </div>
                <div>
                    {hovered && hover}
                </div>
        </button>
    )
}