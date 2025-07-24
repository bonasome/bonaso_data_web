import React from 'react';
import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useRespondents } from '../../contexts/RespondentsContext';
import { useParams } from 'react-router-dom';
import respondentsConfig from './respondentsConfig';
import styles from '../reuseables/dynamicForm.module.css';
import errorStyles from '../../styles/errors.module.css';


export default function EditRespondent(){
    const { id } = useParams();
    const navigate = useNavigate();
    const [formConfig, setFormConfig] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { respondentsMeta, setRespondentsMeta, setRespondentDetails } = useRespondents();
    const [active, setActive] = useState({});
    const [saving, setSaving] = useState(false);

    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

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
        const getRespondentDetails = async () => {
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/record/respondents/${id}/`);
                const data = await response.json();
                if(response.ok){
                    setRespondentDetails(prev => [...prev, data]);
                    console.log(data)
                    setActive(data);
                    setLoading(false);
                }
                else{
                    navigate(`/not-found`);
                }
                
            } 
            catch (err) {
                console.error('Failed to fetch respondent: ', err);
                setLoading(false);
            } 
        };
        getRespondentMeta();
        getRespondentDetails();

    }, [id])

    useEffect(() => {
        setFormConfig(respondentsConfig(respondentsMeta, active))
    }, [respondentsMeta, active])

    const handleCancel = () => {
        navigate(`/respondents/${id}`)
    }

    const handleSubmit = async(data) => {
            console.log('submitting data...')
            const submissionErrors = []
            if(data.is_anonymous == ''){
                data.is_anonymous = false
            }
    
            if(data.is_anonymous){
                data.first_name = null,
                data.last_name = null,
                data.dob = null,
                data.ward = null,
                data.email = null,
                data.phone_number = null,
                data.id_no = null
            }
            else if(!data.is_anonymous){
                data.age_range = null;
                if(data.dob && isNaN(Date.parse(data.dob)) || new Date(data.dob) > new Date()){
                    submissionErrors.push('Date of birth must be a valid date and may not be in the future.');
                }
            }
            if(submissionErrors.length > 0){
                setErrors(submissionErrors);
                return;
            }
            try{
                setSaving(true);
                const url = `/api/record/respondents/${active.id}/`; 
                const response = await fetchWithAuth(url, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': "application/json",
                    },
                    body: JSON.stringify(data)
                });
                const returnData = await response.json();
                if(response.ok){
                    setRespondentDetails(prev => {
                        const others = prev.filter(r => r.id !== returnData.id);
                        return [...others, returnData];
                    });
                    navigate(`/respondents/${returnData.id}`);
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
                console.error('Could not record respondent: ', err)
            }
            finally{
                setSaving(false)
            }
        }
    
    if(loading) return <Loading />
    return(
        <div className={styles.container}>
            <h1>Editing Respondent {active.is_anonymous ? active.uuid : (active.first_name + ' ' + active.last_name) }</h1>
            {errors.length != 0 &&
                <div className={errorStyles.errors} ref={alertRef}>
                    <ul>{errors.map((msg)=>
                        <li key={msg}>{msg}</li>)}
                    </ul>
                </div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving}/>
        </div>
    )
}

