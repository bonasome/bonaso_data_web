import { useEffect, useState } from 'react';

import fetchWithAuth from '../../../services/fetchWithAuth';

import ComponentLoading from '../reuseables/loading/ComponentLoading';
import IndicatorChart from './IndicatorChart';
import ChartSettingsModal from './ChartSettingsModal';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import ButtonHover from '../reuseables/inputs/ButtonHover';

import styles from './dashboard.module.css';

import { ImPencil } from 'react-icons/im';
import { MdAddchart } from "react-icons/md";
import { FcCancel } from 'react-icons/fc';
import { IoIosSave } from 'react-icons/io';

export default function Dashboard({ id, meta }){ 
    const [dashboard, setDashboard] = useState(null); //dashboard data
    const [adding, setAdding] = useState(false); //show chart settings modal
    //meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    
    const [saving, setSaving] = useState(false);
    //handle editing
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');

    //get the dashboard information, including charts/data
    useEffect(() => {
        const getData = async () => {
            if(!id) return;
            try {
                console.log('fetching settings...');
                const url = `/api/analysis/dashboards/${id}/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                if(response.ok){
                    setDashboard(data);
                    setName(data.name);
                    setDesc(data.description);
                }
                else{
                    console.error(data);
                    setErrors(['Something went wrong. Please try again later.'])
                }
            } 
            catch (err) {
                console.error('Failed to delete organization:', err);
                setErrors(['Something went wrong. Please try again later.'])
            } 
            finally {
                setLoading(false);
            }
        }
        getData();
    }, [id]);

    //handle name/desc changes (probably future things like order as well)
    const handleEdit = async () => {
        try{
            setSaving(true);
            const response = await fetchWithAuth(`/api/analysis/dashboards/${dashboard.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    name: name,
                    description: desc
                })
            });
            const returnData = await response.json();
            if(response.ok){
                setDashboard(prev => ({...prev, name: name, description: desc}));
                setEditing(false);
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
    }
    
    //remove chart
    const handleRemove = (id) => {
        const updated = dashboard.indicator_charts.filter(c => c.id != id)
        setDashboard(prev => ({...prev, indicator_charts: updated}));
    }
    //refresh chart with new data/settings
    const handleUpdate = (data) => {
        const others = dashboard.indicator_charts.filter(c => c.id != data.id);
        setDashboard(prev => ({...prev, indicator_charts: [...others, data]}))
    }

    if(!dashboard || loading) return <ComponentLoading />
    return(
        <div>
            <div className={styles.field}>
                <h1>{dashboard.name}</h1>
                {dashboard.description && <p>{dashboard.description}</p>}
                <div style={{ display: 'flex', flexDirection: 'row'}}>
                    {!editing && <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Details'} />}
                    {!adding && <ButtonHover callback={() => setAdding(true)} noHover={<MdAddchart />} hover={'Add Chart'} />}
                </div>
            </div>

            {editing && <div>
                {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                <div className={styles.field}>
                    <label htmlFor='name'>Dashboard Name</label>
                    <input id='name' type='text' onChange={(e) => setName(e.target.value)} value={name}/>
                </div>
                <div className={styles.field}>
                    <label htmlFor='desc'>Dashboard Description</label>
                    <textarea id='desc' onChange={(e) => setDesc(e.target.value)} value={desc} />
                </div>
                {!saving && <div style={{ dispaly: 'flex', flexDirection: 'row'}}>
                    <button onClick={() => handleEdit()}><IoIosSave /> Save</button>
                    <button onClick={() => setEditing(false)}><FcCancel /> Cancel</button>
                </div>}
                {saving && <ButtonLoading />}
            </div>}

            {adding && <ChartSettingsModal chart={null} onClose={() => setAdding(false)} onUpdate={(data) => handleUpdate(data)} meta={meta} dashboard={dashboard} />}
            {dashboard.indicator_charts.length === 0 && <p><i>No charts yet. Add one!</i></p>}
            {!editing && dashboard.indicator_charts.length > 0 && <div className={styles.charts}>
                { dashboard.indicator_charts.map((ic) => (
                    <IndicatorChart chartData={ic} dashboard={dashboard} meta={meta}  onUpdate={(data) => handleUpdate(data)} onRemove={(id) => handleRemove(id)}/>
                ))}
            </div>}
        </div>
    )
}