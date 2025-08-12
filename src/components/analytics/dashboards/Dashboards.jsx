import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

import fetchWithAuth from '../../../../services/fetchWithAuth';

import Loading from '../../reuseables/loading/Loading';
import Messages from '../../reuseables/Messages';
import Dashboard from './Dashboard';
import CreateDashboardModal from './CreateDashboardModal';

import styles from './dashboard.module.css';

import { BiSolidShow, BiSolidHide } from "react-icons/bi";
import { MdInsertChart } from "react-icons/md";
import { FaChartPie } from "react-icons/fa6";
import { FaChartGantt } from "react-icons/fa6";

export default function Dashboards() {
    const { id } = useParams();
    //page information
    const [meta, setMeta] = useState({});
    const [dashboards, setDashboards] = useState([]);
    const [breakdowns, setBreakdowns] = useState({});
    //meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [viewing, setViewing] = useState(null); //controls which dashboard is visible in the main panel
    const [hidden, setHidden] = useState(false); //controls sb visibility
    const [creating, setCreating] = useState(false); //controls visibility of create modal

    useEffect(() => {
        const getMeta = async() => {
            try {
                console.log('fetching settings...');
                const url = `/api/analysis/dashboards/meta/`
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



    useEffect(() => {
        const getDashboards = async() => {
            try {
                console.log('fetching settings...');
                const url = `/api/analysis/dashboards/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                if(response.ok){
                    setDashboards(data.results)
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
        getDashboards();
    }, []);

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
    }, [])

    const handleUpdate = (data) => {
        const others = dashboards.filter((d) => (d.id != data.id));
        setDashboards([...others, data]);
    }
    const handleRemove = (id) => {
        setDashboards(prev => prev.filter((d) => (d.id != id)));
        setViewing(null);
    }

    if(loading || !meta) return <Loading />
    return(
        <div className={hidden ? styles.fullContainer : styles.container}>
            {/* Main Panel */}
            <div className={styles.mainPanel}>
                <Messages errors={errors} />

                {/* Show create modal */}
                {creating && <CreateDashboardModal onClose={() => setCreating(false)} onUpdate={(data) => handleUpdate(data)} />}

                {/*Show Selected DB */}
                {viewing && <Dashboard id={viewing} meta={meta} breakdowns={breakdowns} onUpdate={(data) => handleUpdate(data)} onRemove={(id) => handleRemove(id)} />}

                {/* Show a placeholder when nothing is selected */}
                {!viewing && <div className={styles.placeholder}>
                    <div>
                        <FaChartPie style={{ fontSize: '150px', margin: 30, opacity: '75%' }} />
                        <MdInsertChart style={{ fontSize: '150px', margin: 30, opacity: '75%'}}/>
                        <FaChartGantt style={{ fontSize: '150px', margin: 30, opacity: '75%'}}/>
                    </div>
                    <h1>Select or Create a Dashboard From the Sidebar to Begin.</h1>
                </div>}
            </div>

            {/* Sidebar Component*/}
            <div className={hidden ? styles.hiddenSB : styles.SB}>
                <div className={styles.toggle} onClick={() => {setHidden(!hidden); visChange(!hidden)}}>
                    {hidden ? <BiSolidHide /> : <BiSolidShow />}
                </div>
                {!hidden && <div>
                    <h2>Your Dashboards</h2>
                    <button onClick={() => setCreating(true)}> <FaChartPie /> Create a New Dashboard</button>
                    {dashboards.length > 0 && dashboards.map((db) => (
                        <div onClick={() => setViewing(db.id)} className={styles.dbCard}>
                            <h3>{db.name}</h3>
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    )
}