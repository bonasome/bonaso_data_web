import React from 'react';
import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import errorStyles from '../../styles/errors.module.css'
import Loading from '../reuseables/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useRespondents } from '../../contexts/RespondentsContext';
import respondentsConfig from './respondentsConfig';
import { Link } from 'react-router-dom';
import styles from '../reuseables/dynamicForm.module.css';
import modalStyles from '../../styles/modals.module.css';

export default function CreateRespondent(){
    const navigate = useNavigate();
    const [formConfig, setFormConfig] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { respondentsMeta, setRespondentsMeta, setRespondentDetails } = useRespondents();
    const [existing, setExisting] = useState(null)
    const [showModal, setShowModal] = useState(true)
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
            console.log(respondentsMeta)
            if(Object.keys(respondentsMeta).length !== 0){
                setLoading(false)
                return;
            }
            else{
                try{
                    console.log('fetching respondents meta...');
                    const response = await fetchWithAuth(`/api/record/respondents/meta/`);
                    const data = await response.json();
                    setRespondentsMeta(data);
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch respondent model information: ', err)
                    setLoading(false)
                }
            }
        }
        getRespondentMeta();
    }, [respondentsMeta, setRespondentsMeta])

    useEffect(() => {
        setFormConfig(respondentsConfig(respondentsMeta))
    }, [respondentsMeta])

    const handleCancel = () => {
        navigate('/respondents')
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
            data.phone = null,
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
            setSaving(true)
            const url = '/api/record/respondents/'; 
            const response = await fetchWithAuth(url, {
                method: 'POST',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                setRespondentDetails(prev => [...prev, returnData])
                navigate(`/respondents/${returnData.id}`);
            }
            else{
                const serverResponse = []
                for (const field in returnData) {
                    if(field == 'existing_id'){
                        setExisting(returnData[field])
                        continue
                    }
                    if (Array.isArray(returnData[field])) {
                        returnData[field].forEach(msg => {
                        serverResponse.push(`${field}: ${msg}`);
                        });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
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

    function DataModal(){
        return(
            <div className={modalStyles.modal} >
                <h3>Data Privacy Message</h3>
                <p>
                    Before you collect any information about this respondent, please explain to them
                    what data you are collecting and how it will be used. If you need more information,
                    you may visit our data policy <Link to='/policy'><b>here</b></Link>
                </p>
                <b>Before recording any personal
                    information about the respondent, make sure you have their express consent.
                </b>
                <p>
                    If this respondent does not consent to giving their information, please
                    mark them as anonymous.
                </p>
                <button onClick ={() => setShowModal(false)}>Got it</button>
                <></>
            </div>
        )
    }



    if(loading) return <Loading />

    return(
        <div className={styles.container}>
            {showModal && <DataModal />}
            <h1>Creating a New Respondent</h1>
            {errors.length != 0 &&
                <div className={errorStyles.errors} ref={alertRef}>
                    <ul>{errors.map((msg)=>
                        <li key={msg}>{msg}</li>)}
                    </ul>
                    {existing && <Link to={`/respondents/${existing}`}> <p>Click here to view their profile.</p></Link>}
                </div>}
            
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} onError={(e) => setErrors(e)} saving={saving} />
        </div>
    )
}