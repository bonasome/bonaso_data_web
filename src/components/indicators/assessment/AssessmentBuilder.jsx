import React from 'react';
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { useIndicators } from '../../../contexts/IndicatorsContext';

import fetchWithAuth from "../../../../services/fetchWithAuth";

import Loading from '../../reuseables/loading/Loading';
import AssessmentIndicator from './AssessmentIndicator';
import Messages from '../../reuseables/Messages';
import UpdateRecord from '../../reuseables/meta/UpdateRecord';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import AssessmentDetailsModal from './AssessmentDetailsModal';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import ReturnLink from '../../reuseables/ReturnLink';

import { ImPencil } from 'react-icons/im';
import { FaTrashAlt } from 'react-icons/fa';
import { FcAddRow } from 'react-icons/fc';

import styles from '../../../styles/form.module.css';
import theme from '../../../../theme/theme';


export default function AssessmentForm(){
    /*
    Component that allows a user to view/edit an assessment and its indicators. Editing the assessment
    will display the AssessmentDetailsModal component and each indicator will be rendered as an
    Assessment Indicator comp. 
    */
    const navigate = useNavigate();
    
    //param to get indicator (blank if creating)
    const { id } = useParams();

    //context
    const { setAssessmentDetails, indicatorsMeta, setIndicatorsMeta } = useIndicators();
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    
    const [assessment, setAssessment] = useState(null); //assessment
    const [indicators, setIndicators] = useState([]); //indicators of the assessment
    
    //page meta
    const [editing, setEditing] = useState(false); //controls AssessmentDetailModal for editing name/desc
    const [adding, setAdding] = useState(false); //shows a AssessmentIndicator comp with no existing
    const [del, setDel] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submissionErrors, setSubmissionErrors] = useState([]);

    //ref to scroll to errors
    const alertRef = useRef(null);
    useEffect(() => {
        if ((submissionErrors.length > 0) && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [submissionErrors]);

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

    //fetch the asssessment details (including indicators)
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

    //action to allow for reordering (from drag and drop)
    const reorder = async(ind, pos) => {
        try{
            console.log('submitting data...', pos);
            const url = `/api/indicators/manage/${ind}/change-order/`;
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({position: pos})
            });
            const returnData = await response.json();
            if(response.ok){
                getAssessmentDetail();
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
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setSubmissionErrors(serverResponse)
            }
        }
        catch(err){
            setSubmissionErrors(['Something went wrong. Please try again later.']);
            console.error('Could not record indicator: ', err)
        }
    }

    //helper functions for drag and drop for reordering
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = indicators.findIndex((i) => i.id === active.id);
        const newIndex = indicators.findIndex((i) => i.id === over.id);

        const newOrder = [...indicators];
        const [moved] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, moved);

        reorder(active.id, newIndex);
    };

    //get the existing details if an id is found in the params
    useEffect(() => {
        const loadInitial = async () => {
            await getAssessmentDetail();
        }
        loadInitial();
    }, [id]);   
    
    //delete the assessment
    const handleDelete = async() => {
        try {
            const response = await fetchWithAuth(`/api/indicators/assessments/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                navigate('/indicators/assessments');
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
                setSubmissionErrors(serverResponse);
            }
        } 
        catch (err) {
            setSubmissionErrors(['Something went wrong. Please try again later.'])
            console.error('Failed to delete organization:', err);
        }
        finally{
            setDel(false);
        }
    } 

    if(loading || !assessment || !indicatorsMeta?.type) return <Loading />
    return(
        <div>
            <div className={styles.form}>
                <ReturnLink url={'/indicators/assessments'} display='Return to asssessments' />
                {editing && <AssessmentDetailsModal onUpdate={(d) => setAssessment(d)} onCancel={() => setEditing(false)} existing={assessment} />}
                <h1>{assessment.name}</h1>
                <Messages errors={submissionErrors} ref={alertRef} />
                {assessment.description ? <p>{assessment.description}</p> : <p><i>No Description.</i></p>}
                <UpdateRecord created_at={assessment.created_at} created_by={assessment.created_by} updated_at={assessment.updated_at} updated_by={assessment.updated_by} />
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <ButtonHover noHover={<ImPencil />} hover={'Edit Details'} callback={() => setEditing(true)} />
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover='Delete Indicator' forDelete={true} />
                </div>
            </div>
            {del && <ConfirmDelete onCancel={() => setDel(false)} onConfirm={handleDelete} name={`the assessment "${assessment.display_name}"`} />}
            <div style={{ margin: '5vh', padding: '2vh', backgroundColor: theme.colors.bonasoDarkAccent  }}>
                <h2>Indicators</h2>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={indicators.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        {indicators.sort((a, b) => a.order - b.order).map((ind) => (<AssessmentIndicator meta={indicatorsMeta} assessment={assessment} existing={ind} onUpdate={getAssessmentDetail} />))}
                    </SortableContext>
                </DndContext>
                
                {adding && <AssessmentIndicator meta={indicatorsMeta} assessment={assessment} onCancel={() => setAdding(false)} onUpdate={() => {getAssessmentDetail(); setAdding(false)}} />}
                {!adding && <button onClick={() => setAdding(true)} style={{ marginTop: 30}}> <FcAddRow />  Add Indicator</button>}
            </div>
            <div style={{ padding: 20}}></div>
        </div>
    )
}