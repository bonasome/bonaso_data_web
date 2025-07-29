import FlagCard from './FlagCard';

import modalStyles from '../../styles/modals.module.css';
import { GiExitDoor } from "react-icons/gi";

export default function FlagDetailModal({ flags, model, id, displayName=null, onClose }){

    if(!flags || flags.length === 0) return <></>
    return(
        <div className={modalStyles.modal}>
            {displayName ? <h3>Flags for {displayName}</h3> : <h3>Flags</h3>}
            {flags.map((flag) => <FlagCard flag={flag} />)}
            <button onClick={() => onClose()}><GiExitDoor /> Close</button>
        </div>
    )

}