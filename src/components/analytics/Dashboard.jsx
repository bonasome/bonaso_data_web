import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import IndicatorChart from './IndicatorChart';
import styles from './dashboard.module.css';
import { LuPencilLine } from "react-icons/lu";

export default function Dashboard({ id, meta }){ 
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [adding, setAdding] = useState(false);
    const [charts, setCharts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('')
    useEffect(() => {
        const getData = async () => {
            if(!id) return;
            try {
                console.log('fetching settings...');
                const url = `/api/analysis/dashboards/${id}/`
                const response = await fetchWithAuth(url);
                const data = await response.json();
                if(response.ok){
                    console.log(data)
                    setDashboard(data);
                    setName(data.name);
                    setDesc(data.description);
                    setCharts(data.indicator_charts)
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
    }, [id, refresh]);

    const handleUpdate = async (data, id) => {
        if(!name || name === ''){
            setErrors(['Please enter a name.']);
            return;
        }
        try{
            setSaving(true);
            const response = await fetchWithAuth(`/api/analysis/dashboards/${dashboard.id}/charts/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                if(id){
                    let others = charts.filter(c => c.id !== id)
                    others.push(returnData.chart_data)
                    setCharts(others)
                }
                else{
                    setCharts(prev => [...prev, data])
                }
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
                        console.log(returnData)
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
                        console.log(returnData)
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
    const handleRemove = async(id) => {
        if(!id){
            setAdding(false);
            return
        }
        try{
            setSaving(true);
            const response = await fetchWithAuth(`/api/analysis/dashboards/${dashboard.id}/remove-chart/${id}/`, {
                method: 'DELETE',
            });
            const returnData = await response.json();
            if(response.ok){
                setCharts(prev => prev.filter(c => c.id != id))
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
                        console.log(returnData)
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
    if(!dashboard) return <ComponentLoading />
    return(
        <div>
            <div>
                <div style={{ display: 'flex', flexDirection:'row'}}>
                    <h1>{dashboard.name}</h1>
                    {!editing && <LuPencilLine onClick={() => setEditing(true)} style={{ margin: 30}}/>}
                </div>
                {dashboard.description && <p>{dashboard.description}</p>}
                
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
                <div className={styles.field}>
                    <button onClick={() => handleEdit()}>Save</button>
                    <button onClick={() => setEditing(false)}>Cancel</button>
                </div>
            </div>}

            <button onClick={() => setAdding(!adding)}>{adding ? 'Cancel' : 'Add Chart'}</button>
            {adding && <IndicatorChart chartData={null} dashboard={dashboard} meta={meta} onUpdate={(data) => handleUpdate(data)} onRemove={() => handleRemove()}/>}
            {dashboard.indicator_charts.length === 0 && <p><i>No charts yet. Add one!</i></p>}
            {!editing && charts.length > 0 && <div className={styles.charts}>
                {charts.map((ic) => (
                    <IndicatorChart chartData={ic} dashboard={dashboard} meta={meta}  onUpdate={(data, id) => handleUpdate(data, id)} onRemove={(id) => handleRemove(id)}/>
                ))}
            </div>}
        </div>
    )
}