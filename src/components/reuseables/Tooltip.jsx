import { useState } from 'react';
import styles from './tooltip.module.css';
import { IoInformationCircleSharp } from "react-icons/io5";


export default function Tooptip({ msg, style={} }){
    const [hovered, setHovered] = useState(false);

    return(
        <div className={styles.tooltipContainer}>
            <IoInformationCircleSharp onMouseEnter={() => setHovered(true)} 
                onMouseLeave={() => setHovered(false)} fontSize={20} style={{ marginTop: 'auto', marginBottom: 'auto', marginLeft: 5}}
            />
            {hovered && <div className={styles.tooltipBox}>
                <p>{msg}</p>
            </div>}
        </div>
    )
}