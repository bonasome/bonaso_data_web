import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import errorStyles from '../../styles/errors.module.css'
import Loading from '../reuseables/Loading';
import DynamicForm from '../reuseables/DynamicForm';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useRespondents } from '../../contexts/RespondentsContext';

export default function CreateRespondent(){
    const navigate = useNavigate();
    const [formConfig, setFormConfig] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { respondentsMeta, setRespondentsMeta, setRespondentDetails } = useRespondents();

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
        setFormConfig([
            //always show
            {name: 'is_anonymous', label: 'Does this respondent want to remain anonymous', type: 'checkbox', required: true, switchpath: true},
            
            //show if not anonymous

             // Conditionally include 'id_no'
            { name: 'id_no', label: 'ID/Passport Number', type: 'text', required: true, hideonpath: true},
            {name: 'first_name', label: 'First Name', type: 'text', required: true, hideonpath: true},
            {name: 'last_name', label: 'Surname', type: 'text', required: true, hideonpath: true},

            //always show
            {name: 'sex', label: 'Sex', type: 'select', required: true, constructors: {
                values: respondentsMeta.sexs,
                multiple: false,
                labels: respondentsMeta.sex_labels
            }},
            //show ONLY if anonymous
            {name: 'age_range', label: 'Age Range', type: 'select', required: true, showonpath:true, constructors: {
                values: respondentsMeta.age_ranges,
                multiple: false, showonpath: true,
                labels: respondentsMeta.age_range_labels
            }},
            //show if not anonymous
            {name: 'dob', label: 'Date of Birth', type: 'date', required: true, hideonpath: true},
            {name: 'ward', label: 'Ward', type: 'text', required: false, hideonpath: true},

            //always show
            {name: 'village', label: 'Village', type: 'text', required: true},
            {name: 'district', label: 'District', type: 'select', required: true, constructors: {
                values: respondentsMeta.districts,
                multiple: false,
                labels: respondentsMeta.district_labels
            }},
            {name: 'citizenship', label: 'Citizenship', type: 'text', value:'Motswana', required: true },
            
            //show if not anonymous
            {name: 'email', label: 'Email', type: 'email', required: false, hideonpath: true},
            {name: 'phone_number', label: 'Phone Number', type: 'number', required: false, hideonpath: true},
        
        ])
    }, [respondentsMeta])

    const handleCancel = () => {
        navigate('/respondents')
    }
    const handleSubmit = async(data) => {
        console.log('submitting data...', data)
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
                console.log(returnData);
            }
        }
        catch(err){
            console.error('Could not record respondent: ', err)
        }
    }

    if(loading) return <Loading />

    return(
        <div>
            <h1>Creating a New Respondent</h1>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <DynamicForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} errors={errors}/>
        </div>
    )
}