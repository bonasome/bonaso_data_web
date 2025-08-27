import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

import fetchWithAuth from '../../../../services/fetchWithAuth';

import Loading from '../../reuseables/loading/Loading';
import Messages from '../../reuseables/Messages';
import LineList from './LineList';
import LineListSettings from './LineListSettings';

import styles from '../dashboards/dashboard.module.css';

import { BiSolidShow, BiSolidHide } from "react-icons/bi";
import { MdOutlineViewList } from "react-icons/md";

export default function LineLists() {
    /*
    Displays a list of all of a users line lists. When one is selected, it will appear on the main panel
    */
    //page information
    const [lls, setLLs] = useState([]); //the line lists
    const [breakdowns, setBreakdowns] = useState({}); //the breakdown values used to mapping db values to readable labels
    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [viewing, setViewing] = useState(null); //controls which list is visible in the main panel
    const [hidden, setHidden] = useState(false); //controls sb visibility
    const [creating, setCreating] = useState(false); //controls visibility of create modal


    //get options list (basically the meta) for filters/legend/labels
    useEffect(() => {
        const getEventBreakdowns = async () => {
            try {
                console.log('fetching event details...');
                const response = await fetchWithAuth(`/api/analysis/dashboards/breakdowns/`);
                const data = await response.json();
                if(response.ok){
                    setBreakdowns(data)
                }
            } 
            catch (err) {
                setErrors(['Something went wrong. Please try again later.'])
                console.error('Failed to fetch event: ', err);
            } 
        }
        getEventBreakdowns();
    }, []);

    //get the list of line lists
    useEffect(() => {
        const getLL = async() => {
            try {
                console.log('fetching settings...');
                const url = `/api/analysis/lists/`;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                if(response.ok){
                    setLLs(data.results)
                    if(data.results.length === 0) setCreating(true);
                }
                else{
                    console.error(data);
                    setErrors(['Something went wrong. Please try again later.'])
                }
            } 
            catch (err) {
                console.error('Failed to get meta:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        }
        getLL();
    }, []);

    //on update to any settings, make sure it reflects in the sidebar
    const handleUpdate = (data) => {
        console.log(data)
        const others = lls.filter((l) => (l.id != data.id));
        setLLs([...others, data]);
    }

    //handle deletion of a line list
    const handleRemove = (id) => {
        setLLs(prev => prev.filter((l) => (l.id != id)));
        setViewing(null);
    }

    if(loading) return <Loading />
    return(
        <div className={hidden ? styles.fullContainer : styles.container}>
            {/* Main Panel */}
            <div className={styles.mainPanel}>
                <Messages errors={errors} />

                {/* Show create modal */}
                {creating && <LineListSettings onClose={() => setCreating(false)} onUpdate={(data) => handleUpdate(data)} breakdowns={breakdowns} />}

                {/*Show Selected DB */}
                {viewing && <LineList id={viewing} breakdowns={breakdowns} onUpdate={(data) => handleUpdate(data)} onDelete={(id) => handleRemove(id)} />}

                {/* Show a placeholder when nothing is selected */}
                {!viewing && <div className={styles.placeholder}>
                    <div>
                        <MdOutlineViewList style={{ fontSize: '150px', margin: 30, opacity: '75%' }} />
                    </div>
                    <h1>Select or Create a Line List From the Sidebar to Begin.</h1>
                </div>}
            </div>

            {/* Sidebar Component*/}
            <div className={hidden ? styles.hiddenSB : styles.SB}>
                <div className={styles.toggle} onClick={() => {setHidden(!hidden); visChange(!hidden)}}>
                    {hidden ? <BiSolidHide /> : <BiSolidShow />}
                </div>
                {!hidden && <div>
                    <h2>Your Line Lists</h2>
                    <button onClick={() => setCreating(true)}> <MdOutlineViewList /> Create a New Line List</button>
                    {lls.length > 0 && lls.map((l) => (
                        <div onClick={() => setViewing(l.id)} className={styles.dbCard}>
                            <h3>{l.name}</h3>
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    )
}