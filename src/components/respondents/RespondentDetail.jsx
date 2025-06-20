import React from 'react';
import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { useRespondents } from '../../contexts/RespondentsContext';
import fetchWithAuth from '../../../services/fetchWithAuth';
import Loading from '../reuseables/Loading';
import { Link } from 'react-router-dom';
import SensitiveInfo from './SensitiveInfo';
import styles from './respondentDetail.module.css'
import Interactions from './interactions/Interactions'; 
import Tasks from '../tasks/Tasks';
import { useAuth } from '../../contexts/UserAuth';
import { useNavigate } from 'react-router-dom';
import ConfirmDelete from '../reuseables/ConfirmDelete';
import errorStyles from '../../styles/errors.module.css';

export default function RespondentDetail(){
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { respondentDetails, setRespondentDetails, respondentsMeta, setRespondentsMeta } = useRespondents();
    const[activeRespondent, setActiveRespondent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sensative, setSensative] = useState(false);
    const [labels, setLabels] = useState({});
    const [added, setAdded] = useState([]);
    const[tasks, setTasks] = useState([]);
    const [del, setDel] = useState(false);
    const [errors, setErrors] = useState([])
    useEffect(() => {
        const getRespondentMeta = async () => {
            if(Object.keys(respondentsMeta).length !== 0){
                return;
            }
            else{
                try{
                    console.log('fetching respondents meta...');
                    const response = await fetchWithAuth(`/api/record/respondents/meta/`);
                    const data = await response.json();
                    setRespondentsMeta(data);
                }
                catch(err){
                    console.error('Failed to fetch respondent model information: ', err)
                }
            }
        }
        getRespondentMeta();
        const getRespondentDetails = async () => {
        const found = respondentDetails.find(r => r.id.toString() === id.toString());
            if (found) {
                setActiveRespondent(found);
                setLoading(false);
                return;
            }
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/record/respondents/${id}/`);
                const data = await response.json();
                setRespondentDetails(prev => [...prev, data]);
                setActiveRespondent(data);
            } catch (err) {
                console.error('Failed to fetch respondent: ', err);
            } finally {
                setLoading(false);
            }
        };
        getRespondentDetails();
    }, [id, respondentDetails, setRespondentDetails])

    useEffect(() => {
        if (!respondentsMeta?.sexs || !activeRespondent) return;
        const sexIndex = respondentsMeta.sexs.indexOf(activeRespondent.sex);
        const districtIndex = respondentsMeta.districts.indexOf(activeRespondent.district)
        const ageRangeIndex = respondentsMeta.age_ranges.indexOf(activeRespondent.age_range)
        setLabels({
            district: respondentsMeta.district_labels[districtIndex],
            sex: respondentsMeta.sex_labels[sexIndex],
            age_range: respondentsMeta.age_range_labels[ageRangeIndex]
        })
    }, [respondentsMeta, activeRespondent])

    const loadTasks = (data) => {
        setTasks(data);
    }
    const onUpdate = (data) => {
        setAdded(data)
    }

    const deleteRespondent = async() => {
        try {
            console.log('deleting organization...');
            const response = await fetchWithAuth(`/api/record/respondents/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                navigate('/respondents');
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
            console.error('Failed to delete organization:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        setDel(false)
    }

    if(loading) return <Loading /> 
    return(
        <div className={styles.respondentView}>
            <div className={styles.mainPanel}>
                <div className={styles.respondentDetails}>
                    {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                    {del && 
                        <ConfirmDelete 
                            name={activeRespondent.is_anonymous ? activeRespondent.uuid : (activeRespondent.first_name + activeRespondent.last_name)} 
                            statusWarning={'We advise against deleting respondents unless they have expressly asked to be deleted. Please note that if this respondent has any recorded interactions, you will be required to delete those first.'} 
                            onConfirm={() => deleteRespondent()} onCancel={() => setDel(false)} 
                    />}
                    {activeRespondent.is_anonymous && <h1>Anonymous Respondent {activeRespondent.uuid}</h1>}
                    {!activeRespondent.is_anonymous && <h1>{activeRespondent.first_name} {activeRespondent.last_name}</h1>}
                    <p>{labels.sex}, Age {labels.age_range}</p>
                    <p>{activeRespondent.ward && activeRespondent.ward + ', '}{activeRespondent.village}, {labels.district}</p>
                    <p>{activeRespondent.citizenship}</p>
                    <p>{}</p>
                    <Link to={`/respondents/${activeRespondent.id}/edit`}><button>Edit Details</button></Link>
                    <button onClick={() => setSensative(!sensative)}>
                        {sensative ? 'Hide Pregnancy & HIV Status' : 'View/Edit Pregnancy & HIV Status'}
                    </button>
                    {sensative && <SensitiveInfo id={id} />}
                    {user.role == 'admin' && <button className={errorStyles.deleteButton} onClick={()=> setDel(true)} >Delete</button>}
                </div>
                <div className={styles.interactions}>
                    <h2>Interactions</h2>
                    <Interactions id={id} tasks={tasks} onUpdate={onUpdate}/>
                </div>
            </div>
            <div className={styles.sidebar}>
                <Tasks callback={loadTasks} isDraggable={true} blacklist={added} />
            </div>
        </div>
    )
}