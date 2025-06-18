import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Loading from '../reuseables/Loading';
import RespondentForm from './RespondentForm';
import fetchWithAuth from "../../../services/fetchWithAuth";
import { useRespondents } from '../../contexts/RespondentsContext';
import { useParams } from 'react-router-dom';

export default function EditRespondent(){
    const { id } = useParams();
    const navigate = useNavigate();
    const [formConfig, setFormConfig] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const { respondentsMeta, setRespondentsMeta, setRespondentDetails } = useRespondents();
    const [active, setActive] = useState({});
    const [existingKPs, setExistingKPs] = useState([]);

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
            //force client to get newest data when editing to prevent asynchronous edits
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/record/respondents/${id}/`);
                const data = await response.json();
                setRespondentDetails(prev => [...prev, data]);
                
                setActive(data);
                setLoading(false);
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
        setFormConfig([
            //always show
            {name: 'is_anonymous', label: 'Does this respondent want to remain anonymous', type: 'checkbox', required: true, switchpath: true, value: active.is_anonymous ? active.is_anonymous : false},
            
            //show if not anonymous

            {name: 'first_name', label: 'First Name', type: 'text', required: true, hideonpath: true, value: active.first_name ? active.first_name : ''},
            {name: 'last_name', label: 'Surname', type: 'text', required: true, hideonpath: true, value: active.last_name ? active.last_name : ''},

            //always show
            {name: 'sex', label: 'Sex', type: 'select', required: true, value: active.sex ? active.sex : '', constructors: {
                values: respondentsMeta.sexs,
                multiple: false,
                labels: respondentsMeta.sex_labels
            }},
            //show ONLY if anonymous
            {name: 'age_range', label: 'Age Range', type: 'select', required: true, showonpath:true, value: active.age_range ? active.age_range : '', constructors: {
                values: respondentsMeta.age_ranges,
                multiple: false, showonpath: true,
                labels: respondentsMeta.age_range_labels
            }},
            //show if not anonymous
            {name: 'dob', label: 'Date of Birth', type: 'date', required: true, hideonpath: true, value: active.dob ? active.dob : ''},
            {name: 'ward', label: 'Ward', type: 'text', required: false, hideonpath: true, value: active.ward ? active.ward : ''},

            //always show
            {name: 'village', label: 'Village', type: 'text', required: true, value: active.village ? active.village : ''},
            {name: 'district', label: 'District', type: 'select', required: true, value: active.district ? active.district : '', constructors: {
                values: respondentsMeta.districts,
                multiple: false,
                labels: respondentsMeta.district_labels
            }},
            {name: 'citizenship', label: 'Citizenship', type: 'text', value: active.citizenship ? active.citizenship : 'Motswana', required: true, },
            
            //show if not anonymous
            {name: 'email', label: 'Email', type: 'email', required: false, hideonpath: true, value: active.email ? active.email : ''},
            {name: 'phone_number', label: 'Phone Number', type: 'number', required: false, hideonpath: true, value: active.phone_number ? active.phone_number : ''},
        
        ])
    }, [respondentsMeta, active, existingKPs])

    const handleCancel = () => {
        navigate(`/respondents/${id}`)
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
                data.phone_number = null,
                data.id_no = null
            }
            else if(!data.is_anonymous){
                data.age_range = null;
                console.log('here')
                if(data.dob && isNaN(Date.parse(data.dob)) || new Date(data.dob) > new Date()){
                    submissionErrors.push('Date of birth must be a valid date and may not be in the future.');
                }
            }
            if(submissionErrors.length > 0){
                setErrors(submissionErrors);
                return;
            }
            try{
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
                        const others = prev.filter(r => r.id !== data.id);
                        return [...others, data];
                    });
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
            <h1>Editing Respondent {active.is_anonymous ? active.uuid : (active.first_name + ' ' + active.last_name) }</h1>
            <RespondentForm config={formConfig} onSubmit={handleSubmit} onCancel={handleCancel} errors={errors}/>
        </div>
    )
}

