import React from 'react';
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

import { useRespondents } from '../../contexts/RespondentsContext';

import fetchWithAuth from "../../../services/fetchWithAuth";
import respondentsConfig from './respondentsConfig';

import Loading from '../reuseables/loading/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import ReturnLink from '../reuseables/ReturnLink';

import styles from '../reuseables/dynamicForm.module.css';
import errorStyles from '../../styles/errors.module.css';


export default function EditRespondent(){
    const navigate = useNavigate();
    //id param from url
    const { id } = useParams();
    //context
    const { respondentsMeta, setRespondentsMeta, setRespondentDetails } = useRespondents();

    //get existing information
    const [existing, setExisting] = useState(null)

    //page meta
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);

    //scroll to alerts
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //fetch the meta and the existing details first
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
                    setErrors(['Something went wrong. Please try again later.']);
                    console.error('Failed to fetch respondent model information: ', err);
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
                    setExisting(data);
                    setLoading(false);
                }
                else{
                    navigate(`/not-found`);
                }
            } 
            catch (err) {
                setErrors(['Something went wrong. Please try again later.'])
                console.error('Failed to fetch respondent: ', err);
                setLoading(false);
            } 
        };
        getRespondentMeta();
        getRespondentDetails();

    }, [id])

    //set up form with existing data
    const formConfig = useMemo(() => {
        return respondentsConfig(respondentsMeta, existing);
    }, [respondentsMeta, existing])

    //navigate to detail page on cancel
    const handleCancel = () => {
        navigate(`/respondents/${id}`)
    }

    //handle submission of edits
    const handleSubmit = async(data) => {
            console.log('submitting data...')
            const submissionErrors = [];

            //clear any hidden fields that may have been entered if switched from anon to not anon or vice versa
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
                const url = `/api/record/respondents/${id}/`; 
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
                    navigate(`/respondents/${id}`); //on success, return to detail page
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
            <ReturnLink url={`/respondents/${id}`} display={'Return to respondent page'} />
            <h1>Editing Respondent {existing.display_name}</h1>
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

