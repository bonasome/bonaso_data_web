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
import IndexViewWrapper from '../../reuseables/IndexView';

export default function PivotTables() {
    /*
    Displays a list of all of a users pivot tables. On selected, one will appear in the main panel.
    */
    //page information
    const [meta, setMeta] = useState({});
    const [pivotTables, setPivotTables] = useState([]); //list of a users pivot tables
    const [breakdowns, setBreakdowns] = useState({}); //breakdowns that contain information about demogrpahic fields
    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [viewing, setViewing] = useState(null); //controls which dashboard is visible in the main panel
    const [hidden, setHidden] = useState(false); //controls sb visibility
    const [creating, setCreating] = useState(false); //controls visibility of create modal
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const [search, setSearch] = useState('');

    //retrieve the model meta
    useEffect(() => {
        const getMeta = async() => {
            try {
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

    //get options list (basically the meta) for filters/legend/labels
    useEffect(() => {
        const getBreakdowns = async () => {
            try {
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
        getBreakdowns();
    }, []);

    //get a list of the user's pivot tables
    useEffect(() => {
        const getPT = async() => {
            try {
                const url = `/api/analysis/tables?search=${search}&page=${page}`;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                if(response.ok){
                    setPivotTables(data.results);
                    setEntries(data.count);
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
        getPT();
    }, [search, page]);

    //handle a change to settings to make sure it reflects in the sidebar
    const handleUpdate = (data) => {
        const others = pivotTables.filter((d) => (d.id != data.id));
        setPivotTables([...others, data]);
    }

    //handle deletion of a pivot table
    const handleRemove = (id) => {
        setPivotTables(prev => prev.filter((d) => (d.id != id)));
        setViewing(null);
    }

    if(loading || !meta) return <Loading />
    return(
        <div className={hidden ? styles.fullContainer : styles.container}>
            {/* Main Panel */}
            <div className={styles.mainPanel}>
                <Messages errors={errors} />

                {/* Show create modal */}
                {creating && <PivotTableSettings onClose={() => setCreating(false)} onUpdate={(data) => handleUpdate(data)} meta={meta} />}

                {/*Show Selected DB */}
                {viewing && <PivotTable id={viewing} breakdowns={breakdowns} onUpdate={(data) => handleUpdate(data)} onDelete={(id) => handleRemove(id)} meta={meta} />}

                {/* Show a placeholder when nothing is selected */}
                {!viewing && <div className={styles.placeholder}>
                    <div>
                        <MdOutlinePivotTableChart style={{ fontSize: '150px', margin: 30, opacity: '75%' }} />
                    </div>
                    <h1>Select or Create a Pivot Table From the Sidebar to Begin.</h1>
                </div>}
            </div>

            {/* Sidebar Component*/}
            <div className={hidden ? styles.hiddenSB : styles.SB}>
                <div className={styles.toggle} onClick={() => {setHidden(!hidden); visChange(!hidden)}}>
                    {hidden ? <BiSolidHide /> : <BiSolidShow />}
                </div>
                {!hidden && <div>
                    <h2>Your Pivot Tables</h2>
                    <IndexViewWrapper entries={entries} page={page} onPageChange={setPage} onSearchChange={setSearch}>
                    <button onClick={() => setCreating(true)}> <MdOutlinePivotTableChart /> Create a New Pivot Table</button>
                    {pivotTables.length > 0 && pivotTables.map((pt) => (
                        <div onClick={() => setViewing(pt.id)} className={styles.dbCard}>
                            <h3>{pt.display_name}</h3>
                        </div>
                    ))}
                    </IndexViewWrapper>
                </div>}
            </div>
        </div>
    )
}