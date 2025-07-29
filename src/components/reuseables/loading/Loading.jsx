import styles from './loading.module.css'
import bonasoWhite from '../../../assets/bonasoWhite.png'
import { useState, useEffect } from 'react';

export default function Loading(){

      const messages = [
        "Loading data...",
        "Still working...",
        "Hang tight!",
        "Almost there...",
        "This is taking longer than expected...",
        "Sorry about the wait...",
        "Thank you for your patience...",
        "Still waiting? Wow, you have more patience than I do.",
        "Seriously, I'm impressed!.",
    ];
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
        // Start fade out
        setFade(false);

        // After fade out duration, switch message and fade in
        setTimeout(() => {
            setIndex((prev) => (prev + 1) % messages.length);
            setFade(true);
        }, 500); // match this to CSS fade duration
        }, 3000); // change message every 3 seconds
        return () => clearInterval(interval);
    }, [messages.length]);
    return(
        <div className={styles.loading}>
            <img src={bonasoWhite} className={styles.loadingImage} />
            <h2 style={{opacity: fade ? 1 : 0, transition: "opacity 0.5s ease-in-out"}}>{messages[index]}</h2>
            <div className={styles.loadingBars}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    )
}