import { Link } from "react-router-dom";

import styles from './return.module.css';

import { IoMdReturnLeft } from "react-icons/io";

//generic comp that takes a url and displays an arrow return header
export default function ReturnLink({ url, display='Return to previous page' }){
    return(
        <Link to={url} className={styles.return}>
            <IoMdReturnLeft className={styles.returnIcon} />
            <p>{display}</p>
        </Link>
    )
}