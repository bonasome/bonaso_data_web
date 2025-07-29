import { Link } from "react-router-dom"
import styles from './return.module.css';
import { IoMdReturnLeft } from "react-icons/io";

export default function ReturnLink({ url, display='Return to previous page' }){
    return(
        <Link to={url} className={styles.return}>
            <IoMdReturnLeft className={styles.returnIcon} />
            <p>{display}</p>
        </Link>
    )
}