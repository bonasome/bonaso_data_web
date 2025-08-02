import styles from '../../styles/errors.module.css';

function Errors({ errors = [] }) {
    if (!errors.length) return null;
    return (
        <div className={styles.errors}>
        <ul>
            {errors.map((msg, idx) => (
            <li key={idx}>{msg}</li>
            ))}
        </ul>
        </div>
    );
}

function Warnings({ warnings = [] }) {
    if (!warnings.length) return null;
    return (
        <div className={styles.warnings}>
        <ul>
            {warnings.map((msg, idx) => (
            <li key={idx}>{msg}</li>
            ))}
        </ul>
        </div>
    );
}

function Success({ success = [] }) {
    if (!success.length) return null;
    return (
        <div className={styles.success}>
        <ul>
            {success.map((msg, idx) => (
            <li key={idx}>{msg}</li>
            ))}
        </ul>
        </div>
    );
}

//simple comp that takes key messages (errors, warnings, and success) and displays them with style
//also can take a ref from scrolling
export default function Messages({ errors = [], success = [], warnings = [], ref=null }) {
    return (
        <div ref={ref ? ref : null}>
            <Errors errors={errors} />
            <Success success={success} />
            <Warnings warnings={warnings} />
        </div>
    );
}
