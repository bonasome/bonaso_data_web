import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';

import fetchWithAuth from '../../../services/fetchWithAuth';

import Loading from '../reuseables/loading/Loading';
import Messages from '../reuseables/Messages';
import AggregateTable from './AggregateTable';

import styles from '../analytics/dashboards/dashboard.module.css';

import { BiSolidShow, BiSolidHide } from "react-icons/bi";
import { MdOutlinePivotTableChart } from "react-icons/md";
import prettyDates from '../../../services/prettyDates';

export default function Aggregates() {
    /*
    Displays a list of all aggregates. On selected, one will appear in the main panel.
    */
    //page information

    const { id } = useParams(); //optional param to load with a specfic aggie in view

    const [meta, setMeta] = useState({}); //load meta (breakdown options)
    const [aggies, setAggies] = useState([]); //list of aggregates
    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [viewing, setViewing] = useState(null); //controls which aggie is visible in the main panel
    const [hidden, setHidden] = useState(false); //controls sb visibility

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

    //get a lightweight list of aggregates
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

    //if an id param was passed, set viewing to that aggie (if it exists)
    useEffect(() => {
        if(!id) return;
        setViewing(id);
    }, [id, aggies]);

    if(loading || !meta) return <Loading />
    return(
        <div className={hidden ? styles.fullContainer : styles.container}>
            {/* Main Panel */}
            <div className={styles.mainPanel}>
                <Messages errors={errors} />

                {/*Show Selected aggregate*/}
                {viewing && <AggregateTable id={viewing} meta={meta} />}

                {/* Show a placeholder when nothing is selected */}
                {!viewing && <div className={styles.placeholder}>
                    <div>
                        <MdOutlinePivotTableChart style={{ fontSize: '150px', margin: 30, opacity: '75%' }} />
                    </div>
                    <h1>Select or create a an aggregate to begin.</h1>
                    <p>
                        Aggregates allow you to record data in a tabular form, without having to 
                        enter individual names. Please note that we strongly recommend always recording data
                        via the "respondents" tool. Only use this tool if you do not have access to 
                        respondent's demographic information. 
                    </p>
                    <p>
                        <strong>Please also make sure that you do not record
                        data here that you have recorded elsewhere in the site.</strong>
                    </p>
                </div>}
            </div>

            {/* Sidebar Component*/}
            <div className={hidden ? styles.hiddenSB : styles.SB}>
                <div className={styles.toggle} onClick={() => {setHidden(!hidden); visChange(!hidden)}}>
                    {hidden ? <BiSolidHide /> : <BiSolidShow />}
                </div>
                {!hidden && <div>
                    <h2>Your Aggregates</h2>
                    <Link to={'/aggregates/new'}><button><MdOutlinePivotTableChart /> Create a New Aggreate</button></Link>
                    {aggies.length > 0 && aggies.map((ag) => (
                        <div onClick={() => setViewing(ag.id)} className={styles.dbCard}>
                            <h3>{ag.indicator.name}</h3>
                            <p><i>{prettyDates(ag.start)} - {prettyDates(ag.end)}</i></p>
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    )
}