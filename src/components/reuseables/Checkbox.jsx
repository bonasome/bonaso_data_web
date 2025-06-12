import styles from '../../styles/reuseableComponents.module.css'

export default function Checkbox({ label, name, value, callback = null }){
    return(
        <div className={styles.checkbox}>
            <input type="checkbox" id={name} name={name} value={value} onChange={(e) => callback(e)}/>
            <label htmlFor={name}>{label}</label>
        </div>
    )
}