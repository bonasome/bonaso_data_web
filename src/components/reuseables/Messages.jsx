import styles from '../../styles/errors.module.css';

function Errors({ errors = [] }) {
    //displays errors (something went wrong, you forgot something)
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
    //displays warnings (this might cause a problem, might cause a flag, just so you know..)
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
    //it worked!
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


export default function Messages({ errors = [], success = [], warnings = [], ref=null }) {
    /*
    Simple comp that takes page messages (errors, warnings, and success messages) and returns them with
    proper stylings. Can also take ref for scrolling.
    - errors (array, optional): array of error messages to display
    - success (array, optional): array of success messages to display
    - warnings (array, optional): array of warning messages to display
    - ref (ref, optional): ref used to scroll to error location within the parent component
    */
    return (
        <div ref={ref ? ref : null}>
            <Errors errors={errors} />
            <Success success={success} />
            <Warnings warnings={warnings} />
        </div>
    );
}
