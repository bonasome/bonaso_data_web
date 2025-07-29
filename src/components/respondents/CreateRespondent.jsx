import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from 'react-router-dom';

import { useRespondents } from '../../contexts/RespondentsContext';

import fetchWithAuth from "../../../services/fetchWithAuth";
import respondentsConfig from './respondentsConfig';

import Loading from '../reuseables/loading/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import ReturnLink from '../reuseables/ReturnLink';

import styles from '../reuseables/dynamicForm.module.css';
import modalStyles from '../../styles/modals.module.css';
import errorStyles from '../../styles/errors.module.css';

export default function CreateRespondent(){
    const navigate = useNavigate();
    //contexts
    const { respondentsMeta, setRespondentsMeta, setRespondentDetails } = useRespondents();

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [showModal, setShowModal] = useState(true); //shows data policy modal on load
    const [saving, setSaving] = useState(false);

    //helper field to return an existing ID if there is a db conflict
    const [existing, setExisting] = useState(null)
    
    //ref to scroll to alerts
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
            alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);
    
    //fetch the meta for building the form (preload from context if possible)
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
                    console.error('Failed to fetch respondent model information: ', err);
                    setErrors(['Something went wrong. Please try again later.']);
                    setLoading(false)
                }
            }
        }
        getRespondentMeta();
    }, [respondentsMeta, setRespondentsMeta])
    
    //set up the form config
    const formConfig = useMemo(() => {
        return respondentsConfig(respondentsMeta);
    }, [respondentsMeta])

    //navigate back to index on cancel
    const handleCancel = () => {
        navigate('/respondents')
    }

    //handle submission
    const handleSubmit = async(data) => {
        const submissionErrors = []
        //to handle situations where someone may have switched partway through, clear hidden values
        if(data.is_anonymous == ''){
            data.is_anonymous = false
        }
        //clear PII fields if anon
        if(data.is_anonymous){
            data.first_name = null,
            data.last_name = null,
            data.dob = null,
            data.ward = null,
            data.email = null,
            data.phone = null,
            data.id_no = null
        }
        //clear age range if not anon, since DOB should be present
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
                    //see if the respondent exists and build a link to their profile
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
    //simple data privacy alert
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
            <ReturnLink url={'/respondents'} display={'Return to respondents overview'} />
            <h1>Creating a New Respondent</h1>
            {errors.length != 0 &&
                <div className={errorStyles.errors} ref={alertRef}>
                    <ul>{errors.map((msg)=>
                        <li key={msg}>{msg}</li>)}
                    </ul>
                    {existing && <Link to={`/respondents/${existing}`}> <strong>Click here to view their profile.</strong></Link>}
                </div>}
            <DynamicForm 
                config={formConfig} 
                onSubmit={handleSubmit} 
                onCancel={handleCancel} 
                onError={(e) => setErrors(e)} 
                saving={saving} 
            />
        </div>
    )
}