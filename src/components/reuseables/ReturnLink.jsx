import { Link } from "react-router-dom";

import styles from './return.module.css';

import { IoMdReturnLeft } from "react-icons/io";

export default function ReturnLink({ url, display='Return to previous page' }){
    /*
    Returns a small box with an arrow and text that when clicked direct the user to another page (used mostly
    for return to index or return to detail type navigation)
    - url (string/url): page to redirect to on click
    - display (string, optional): what text to display next to the arrow
    */

    return(
        <Link to={url} className={styles.return}>
            <IoMdReturnLeft className={styles.returnIcon} />
            <p>{display}</p>
        </Link>
    )
}