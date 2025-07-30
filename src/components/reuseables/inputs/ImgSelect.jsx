import { useState, useEffect } from 'react';

import styles from './imgSelect.module.css';

function ImgCard({ value, label, Img, active, callback }){
    const[hover, setHover] = useState(false);

    return(
        <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} 
            className={active ? styles.active : styles.passive} 
            onClick={() => callback(value)}
        >
            <div>{<Img style={{ fontSize: 50}}/>}</div>
            {hover && <p>{label}</p>}
        </div>
    )
}

export default function ImgSelect({ title='Select', config, callback, existing=null, multiple=false }){
    const [selected, setSelected] = useState(multiple ? [] : null);

    useEffect(() => {
        if(!existing || existing?.length === 0 ) return;
        if(multiple) setSelected(existing || []);
        else setSelected(existing);
    }, [existing]);

    useEffect(() => {
        callback(selected);
    }, [selected]);

    const handleChange = (val) => {
        if(multiple){
            const found = selected.find(s => s == val)
            if(selected.find(s => s == val)){
                setSelected(prev => prev.filter(s => (s != val)));
            }
            else{
                setSelected(prev => [...prev, val]);
            }
        }
        else{
            if(selected==val) setSelected(null);
            else setSelected(val);
        }
    }


    return(
        <div>
            <p>{title}</p>
            <div className={styles.container}>
                {config.values.map((val, index) => (<div key={val}>
                    <ImgCard value={val} label={config.labels[index]} Img={config.imgs[index]}
                        active={(multiple ? (selected && selected.includes(val)) : selected == val)}
                        callback={(val) => handleChange(val)}
                    />
                </div>))}
            </div>
        </div>
    )
}