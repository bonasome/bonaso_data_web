import { useEffect, useState } from 'react';

import fetchWithAuth from '../../../../services/fetchWithAuth';

import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import IndicatorChart from './IndicatorChart';
import ChartSettingsModal from './ChartSettingsModal';
import Messages from '../../reuseables/Messages';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import CreateDashboardModal from './CreateDashboardModal';
import ConfirmDelete from '../../reuseables/ConfirmDelete';

import styles from './dashboard.module.css';

import { ImPencil } from 'react-icons/im';
import { MdAddchart } from "react-icons/md";
import { FaTrashAlt } from 'react-icons/fa';

export default function Dashboard({ id, meta, breakdowns, onUpdate, onRemove }){ 
    const [dashboard, setDashboard] = useState(null); //dashboard data
    const [adding, setAdding] = useState(false); //show chart settings modal
    //meta
    const [del, setDel] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    //handle editing
    const [editing, setEditing] = useState(false);

    const getData = async () => {
        if(!id) return;
        try {
            console.log('fetching settings...');
            const url = `/api/analysis/dashboards/${id}/`
            const response = await fetchWithAuth(url);
            const data = await response.json();
            if(response.ok){
                setDashboard(data);
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
    
    //get the dashboard information, including charts/data
    useEffect(() => {
        const initialLoad = async () => {
            await getData();
        }
        initialLoad();
    }, [id]);

    const handleDelete = async() => {
        try {
            console.log('deleting dashboard...');
            const response = await fetchWithAuth(`/api/analysis/dashboards/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onRemove(id)
            } 
            else {
                let data = {};
                try {
                    data = await response.json();
                } catch {
                    // no JSON body or invalid JSON
                    data = { detail: 'Unknown error occurred' };
                }

                const serverResponse = [];
                for (const field in data) {
                    if (Array.isArray(data[field])) {
                    data[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                    });
                    } else {
                    serverResponse.push(`${field}: ${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Failed to delete organization:', err);
        }
        finally{
            setDel(false);
        }
    }


    if(!dashboard || loading) return <ComponentLoading />
    return(
        <div>
            <div className={styles.field}>
                <h1>{dashboard.name}</h1>
                <Messages errors={errors} />
                {dashboard.description && <p>{dashboard.description}</p>}
                {del && <ConfirmDelete name={`dashboard ${dashboard.name}`} onConfirm={handleDelete} onCancel={() => setDel(false)} />}
                <div style={{ display: 'flex', flexDirection: 'row'}}>
                    <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Details'} />
                    <ButtonHover callback={() => setAdding(true)} noHover={<MdAddchart />} hover={'Add Chart'} />
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Dasbhoard'} forDelete={true} />
                </div>
            </div>

            {editing && <CreateDashboardModal existing={dashboard} onClose={() => setEditing(false)} onUpdate={(data) => {getData(); onUpdate(data)}} />}
            {adding && <ChartSettingsModal chart={null} onClose={() => setAdding(false)} onUpdate={getData} meta={meta} dashboard={dashboard} />}
            {dashboard?.indicator_charts?.length === 0 && <p><i>No charts yet. Add one!</i></p>}
            {!editing && dashboard.indicator_charts.length > 0 && <div className={styles.charts}>
                { dashboard.indicator_charts.map((ic) => (
                    <IndicatorChart chartData={ic} dashboard={dashboard} meta={meta} options={breakdowns} onUpdate={getData} onRemove={(id) => handleRemove(id)}/>
                ))}
            </div>}
        </div>
    )
}