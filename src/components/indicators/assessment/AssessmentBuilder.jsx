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
import styles from '../../../styles/form.module.css';

import { ImPencil } from 'react-icons/im';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import AssessmentDetailsModal from './AssessmentDetailsModal';
import Input from '../../reuseables/inputs/Input';
import Select from '../../reuseables/inputs/Select';
import ConfirmDelete from '../../reuseables/ConfirmDelete';
import { FaTrashAlt } from 'react-icons/fa';
import { FcAddRow } from 'react-icons/fc';
import theme from '../../../../theme/theme';



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
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    //existing value if editing
    const [assessment, setAssessment] = useState(null);
    const [indicators, setIndicators] = useState([]);
    //page meta
    const [editing, setEditing] = useState(false);
    const [adding, setAdding] = useState(false);
    const [del, setDel] = useState(false);
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
    
    //delete the organization
    const handleDelete = async() => {
        try {
            console.log('deleting organization...');
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
    console.log(indicators);
    if(loading || !assessment || !indicatorsMeta?.type) return <Loading />
    return(
        <div>
            <div className={styles.form}>
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
                <h2>Questions</h2>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={indicators.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        {indicators.sort((a, b) => a.order - b.order).map((ind) => (<AssessmentIndicator meta={indicatorsMeta} assessment={assessment} existing={ind} onUpdate={getAssessmentDetail} />))}
                    </SortableContext>
                </DndContext>
                
                {adding && <AssessmentIndicator meta={indicatorsMeta} assessment={assessment} onCancel={() => setAdding(false)} onUpdate={() => {getAssessmentDetail(); setAdding(false)}} />}
                <button onClick={() => setAdding(true)}> <FcAddRow />  Add Indicator</button> 
            </div>
        </div>
    )
}