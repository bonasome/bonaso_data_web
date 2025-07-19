import { useEffect, useState } from 'react';
import fetchWithAuth from '../../../services/fetchWithAuth';
import ComponentLoading from '../reuseables/ComponentLoading';
import IndicatorChart from './IndicatorChart';

export default function Dashboard({ id, meta }){ 
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [adding, setAdding] = useState(false);
    const [charts, setCharts] = useState([]);
    const [saving, setSaving] = useState(false)
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
        finally{
            setSaving(false);
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
            <h1>{dashboard.name}</h1>
            {dashboard.description && <p>{dashboard.description}</p>}
            <button onClick={() => setAdding(!adding)}>{adding ? 'Cancel' : 'Add Chart'}</button>
            {adding && <IndicatorChart chartData={null} dashboard={dashboard} meta={meta} onUpdate={(data) => handleUpdate(data)} onRemove={() => handleRemove()}/>}
            {dashboard.indicator_charts.length === 0 && <p><i>No charts yet. Add one!</i></p>}
            {charts.length > 0 && <div>
                {charts.map((ic) => (
                    <IndicatorChart chartData={ic} dashboard={dashboard} meta={meta}  onUpdate={(data, id) => handleUpdate(data, id)} onRemove={(id) => handleRemove(id)}/>
                ))}
            </div>}
        </div>
    )
}