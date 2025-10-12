import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm,  useWatch } from "react-hook-form";

import { useIndicators } from '../../../contexts/IndicatorsContext';

import fetchWithAuth from "../../../../services/fetchWithAuth";

import Loading from '../../reuseables/loading/Loading';
import IndicatorsIndex from '../IndicatorsIndex';
import FormSection from '../../reuseables/forms/FormSection';
import SimpleDynamicRows from '../../reuseables/inputs/SimpleDynamicRows';
import Messages from '../../reuseables/Messages';
import ReturnLink from '../../reuseables/ReturnLink';
import ButtonLoading from '../../reuseables/loading/ButtonLoading';
import AssessmentIndicator from './AssessmentIndicator';
import styles from '../../../styles/form.module.css';

import { ImPencil } from 'react-icons/im';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import AssessmentDetailsModal from './AssessmentDetailsModal';
import Input from '../../reuseables/inputs/Input';
import Select from '../../reuseables/inputs/Select';



export default function AssessmentForm(){
    /*
    Form that allows a user to create/edit an indicator. An optional ID param can be passed in the URL
    which will cause the form to try and fetch details from the server. 
    */
    const navigate = useNavigate();
    
    //param to get indicator (blank if creating)
    const { id } = useParams();

    //context
    const { setAssessmentDetails, indicatorsMeta, setIndicatorsMeta } = useIndicators();

    //existing value if editing
    const [assessment, setAssessment] = useState(null);
    const [indicators, setIndicators] = useState([]);
    //page meta
    const [editing, setEditing] = useState(false);
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [success, setSuccess] = useState([]);
    const [saving, setSaving] = useState(false);

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if ((submissionErrors.length > 0 || success.length > 0) && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors, success]);

    //fetch the meta
    useEffect(() => {
        const getMeta = async() => {
            if(Object.keys(indicatorsMeta).length != 0){
                setLoading(false);
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/indicators/manage/meta/`);
                    const data = await response.json();
                    setIndicatorsMeta(data);
                    setLoading(false);
                }
                catch(err){
                    console.error('Failed to fetch indicators meta: ', err)
                    setLoading(false)
                }
            }
        }
        getMeta();
    }, []);
    const getAssessmentDetail = async () => {
            try {
                console.log('fetching indicator details...');
                const response = await fetchWithAuth(`/api/indicators/assessments/${id}/`);
                const data = await response.json();
                if(response.ok){
                    //update the context
                    setAssessmentDetails(prev => [...prev, data]);
                    setAssessment(data);
                    setIndicators(data.indicators)
                }
                else{
                    //if a bad ID is provided, navigate to 404
                    navigate(`/not-found`);
                }
            } 
            catch (err) {
                console.error('Failed to fetch indicator: ', err);
                setSubmissionErrors(['Something went wrong. Please try again later.'])
            } 
        }
    //get the existing details if an id is found in the params
    useEffect(() => {
        const loadInitial = async () => {
            await getAssessmentDetail();
        }
        loadInitial();
    }, [id]);   

    console.log(indicators);
    if(loading || !assessment || !indicatorsMeta?.type) return <Loading />
    return(
        <div>
            <div className={styles.form}>
                {editing && <AssessmentDetailsModal onUpdate={(d) => setAssessment(d)} onCancel={() => setEditing(false)} existing={assessment} />}
                <h1>{assessment.name}</h1>
                <p>{assessment.description}</p>
                <ButtonHover noHover={<ImPencil />} hover={'Edit Details'} callback={() => setEditing(true)} />
            </div>
            <div>
                {indicators.map((ind) => (<AssessmentIndicator meta={indicatorsMeta} assessment={assessment} existing={ind} />))}
                {adding && <AssessmentIndicator meta={indicatorsMeta} assessment={assessment} onCancel={() => setAdding(false)} onUpdate={getAssessmentDetail} />}
                <ButtonHover noHover={<ImPencil />} hover={'New Question'} callback={() => setAdding(true)} />
            </div>
        </div>
    )
}