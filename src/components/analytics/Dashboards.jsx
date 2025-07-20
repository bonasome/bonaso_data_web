import { useEffect, useState, useRef } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import { useParams } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import errorStyles from '../../styles/errors.module.css'
import SimpleSelect from '../reuseables/SimpleSelect';
import ModelSelect from '../reuseables/ModelSelect';
import ProjectsIndex from '../projects/ProjectsIndex';
import Dashboard from './Dashboard';
import styles from './dashboard.module.css';
import { BiSolidShow, BiSolidHide } from "react-icons/bi";

 function NewDashboard({ onCreate, onCancel }){
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [project, setProject] = useState(null);
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    const handleSubmit = async () => {
        if(!name || name === ''){
            setErrors(['Please enter a name.']);
            return;
        }
        const data = {
            name: name,
            desc: desc,
            project: project
        }
        console.log('submitting dashboard...', data)
        try{
            setSaving(true);
            const response = await fetchWithAuth('/api/analysis/dashboards/', {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                console.log(returnData)
                onCreate()
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record project: ', err)
        }
        finally{
            setSaving(false);
        }
    }


    return(
        <div>
            <div className={styles.field}>
                <h2>Creating New Dashboard</h2>
            </div>
            {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <div className={styles.field}>
                <label htmlFor='name'>Dashboard Name</label>
                <input id='name' type='text' onChange={(e) => setName(e.target.value)} value={name}/>
            </div>
            <div className={styles.field}>
                <label htmlFor='desc'>Dashboard Description</label>
                <textarea id='desc' onChange={(e) => setDesc(e.target.value)} value={desc} />
            </div>
            <div className={styles.field}>
                <ModelSelect IndexComponent={ProjectsIndex} title={'Select a Project Scope (Optional)'} callback={(p) => setProject(p)} />
            </div>
            <div className={styles.field}>
                <button onClick={() => handleSubmit()}>Create</button>
                <button onClick={() => onCancel()}>Cancel</button>
            </div>
        </div>
    )
}


function DashboardSB({ dashboards, viewCallback, createCallback, visChange}){
    const [hidden, setHidden] = useState(false);

    return(
        <div className={hidden ? styles.hiddenSB : styles.SB}>
            <div className={styles.toggle} onClick={() => {setHidden(!hidden); visChange(!hidden)}}>
                {hidden ? <BiSolidHide /> : <BiSolidShow />}
            </div>
            {!hidden && <div>
                <h2>Your Dashboards</h2>
                <div className={styles.dbCard} onClick={() => createCallback()}>
                    <h3>Create New Dashboard</h3>
                </div>
                {dashboards.length > 0 && dashboards.map((db) => (
                    <div onClick={() => viewCallback(db.id)} className={styles.dbCard}>
                        <h3>{db.name}</h3>
                    </div>
                ))}
            </div>}
        </div>
    )
}

export default function Dashboards() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [meta, setMeta] = useState({})
    const [dashboards, setDashboards] = useState([]);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [refresh, setRefresh] = useState(0);
    const [viewing, setViewing] = useState(null);

    const [sbHidden, setSBHidden] = useState(false);

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
    }, [refresh]);


    if(loading || !meta) return <Loading />
    return(
        <div className={sbHidden ? styles.fullContainer : styles.container}>
            <div className={styles.mainPanel}>
                {creating && <NewDashboard onCreate={() => setRefresh(prev => prev+=1)} onCancel={() => setCreating(false)}/>}
                {viewing && !creating && <Dashboard id={viewing} meta={meta} />}
                {!creating && !viewing && <p>Select a Dasbhoard to begin.</p>}
            </div>
            <DashboardSB dashboards={dashboards} createCallback={() => setCreating(true)} viewCallback={(id) => {setViewing(id); setCreating(false)}} visChange={(vis) => setSBHidden(vis)}/>
        </div>
    )
}