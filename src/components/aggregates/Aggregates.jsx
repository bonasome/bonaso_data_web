import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

import fetchWithAuth from '../../../../services/fetchWithAuth';

import Loading from '../../reuseables/loading/Loading';
import Messages from '../../reuseables/Messages';
import PivotTable from './PivotTable';
import PivotTableSettings from './PivotTableSettings';

import styles from '../dashboards/dashboard.module.css';

import { BiSolidShow, BiSolidHide } from "react-icons/bi";
import { MdOutlinePivotTableChart } from "react-icons/md";
import Counts from './Counts';

export default function Aggregates() {
    /*
    Displays a list of all aggregates. On selected, one will appear in the main panel.
    */
    //page information
    const [meta, setMeta] = useState({});
    const [aggies, setAggies] = useState([]); //list of a users pivot tables
    const [breakdowns, setBreakdowns] = useState({}); //breakdowns that contain information about demogrpahic fields
    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [viewing, setViewing] = useState(null); //controls which dashboard is visible in the main panel
    const [hidden, setHidden] = useState(false); //controls sb visibility
    const [creating, setCreating] = useState(false); //controls visibility of create modal

    //retrieve the model meta
    useEffect(() => {
        const getMeta = async() => {
            try {
                console.log('fetching meta...');
                const url = `/api/aggregates/meta/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                if(response.ok){
                    setMeta(data)
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
        getMeta();
    }, []);

    //get a list of the user's pivot tables
    useEffect(() => {
        const getAggies = async() => {
            try {
                console.log('fetching settings...');
                const url = `/api/aggregates/`;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                if(response.ok){
                    setAggies(data.results)
                    if(data.results.length === 0) setCreating(true);
                }
                else{
                    console.error(data);
                    setErrors(['Something went wrong. Please try again later.'])
                }
            } 
            catch (err) {
                console.error('Failed to get aggregates:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        }
        getAggies();
    }, []);

    //handle a change to settings to make sure it reflects in the sidebar
    const handleUpdate = (data) => {
        console.log(data)
        const others = aggies.filter((d) => (d.id != data.id));
        setAggies([...others, data]);
    }

    //handle deletion of a pivot table
    const handleRemove = (id) => {
        setAggies(prev => prev.filter((d) => (d.id != id)));
        setViewing(null);
    }

    if(loading || !meta) return <Loading />
    return(
        <div className={hidden ? styles.fullContainer : styles.container}>
            {/* Main Panel */}
            <div className={styles.mainPanel}>
                <Messages errors={errors} />

                {/* Show create modal */}
                {creating && <Counts />}

                {/*Show Selected count*/}
                {viewing && <Counts />}

                {/* Show a placeholder when nothing is selected */}
                {!viewing && <div className={styles.placeholder}>
                    <div>
                        <MdOutlinePivotTableChart style={{ fontSize: '150px', margin: 30, opacity: '75%' }} />
                    </div>
                    <h1>Select or create a an aggregate to begin.</h1>
                </div>}
            </div>

            {/* Sidebar Component*/}
            <div className={hidden ? styles.hiddenSB : styles.SB}>
                <div className={styles.toggle} onClick={() => {setHidden(!hidden); visChange(!hidden)}}>
                    {hidden ? <BiSolidHide /> : <BiSolidShow />}
                </div>
                {!hidden && <div>
                    <h2>Your Aggregates</h2>
                    <button onClick={() => setCreating(true)}> <MdOutlinePivotTableChart /> Create a New Aggreate</button>
                    {aggies.length > 0 && aggies.map((pt) => (
                        <div onClick={() => setViewing(pt.id)} className={styles.dbCard}>
                            <h3>{pt.display_name}</h3>
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    )
}