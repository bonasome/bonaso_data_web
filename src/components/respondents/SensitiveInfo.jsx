import React from 'react';
import { useState, useEffect } from "react";
import errorStyles from '../../styles/errors.module.css';
import fetchWithAuth from "../../../services/fetchWithAuth";
import SimpleSelect from "../reuseables/SimpleSelect";
import { useRespondents } from "../../contexts/RespondentsContext";
import styles from './respondentDetail.module.css';
import ComponentLoading from '../reuseables/ComponentLoading';
import { useAuth } from '../../contexts/UserAuth';

export default function SensitiveInfo({ id }) {
    const { user } = useAuth();
    const { respondentsMeta, setRespondentsMeta } = useRespondents();
    const [form, setForm] = useState({
        hiv_positive: false,
        date_positive: '',
        is_pregnant: false,
        term_began: '',
        term_ended: '',
        kp_status_names: [],
        disability_status_names: [],
    })
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [edit, setEdit] = useState(false);
    const [labels, setLabels] = useState({})

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
        }, [respondentsMeta]
    )
    useEffect(() => {
        const setExisting = async () => {
            setLoading(true);
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/record/respondents/${id}/sensitive-info/`);
                const data = await response.json();
                setForm({
                    hiv_positive: data.hiv_status_info?.hiv_positive || false,
                    date_positive: data.hiv_status_info?.date_positive || '',
                    is_pregnant: data.pregnancy_info?.is_pregnant || false,
                    term_began: data.pregnancy_info?.term_began || '',
                    term_ended: data.pregnancy_info?.term_ended || '',
                    kp_status_names: data.kp_status?.map(kp => kp.name) || [],
                    disability_status_names: data.disability_status?.map(d => d.name) || [],
                });
                setLoading(false);
            } 
            catch (err) {
                console.error('Failed to fetch respondent: ', err);
                setLoading(false);
            }
        }
        setExisting();
    }, [id])

    useEffect(() => {
        if (!respondentsMeta?.kp_types || !form.kp_status_names) return;
            const kpIndexes = form.kp_status_names.map((kp) => respondentsMeta.kp_types.indexOf(kp));
            const kpLabels = kpIndexes.map((kp) => respondentsMeta.kp_type_labels[kp]);
        if(!respondentsMeta?.disability_types || !form.disability_status_names) return;
            const disIndexes = form.disability_status_names.map((d) => respondentsMeta.disability_types.indexOf(d));
            const disLabels = disIndexes.map((d) => respondentsMeta.disability_type_labels[d]);
        setLabels({
            kp_types: kpLabels || [],
            disability_types: disLabels || [],
        })
    }, [respondentsMeta, form])

    const handleSubmit = async (e) => {
        e.preventDefault()
        const submissionErrors = []
        const cleanedForm = { ...form };

        if (!form.is_pregnant) {
            cleanedForm.term_began = null;
            cleanedForm.term_ended = null;
        }
        if(form.term_began && !form.term_ended){
            cleanedForm.term_ended = null;
        }
        if (!form.hiv_positive) {
            cleanedForm.date_positive = null;
        }
        if (cleanedForm.date_positive && (isNaN(Date.parse(cleanedForm.date_positive)) || new Date(cleanedForm.date_positive) > new Date())) {
            submissionErrors.push('Date positive must be a valid date not in the future.');
        }

        if (cleanedForm.term_began && (isNaN(Date.parse(cleanedForm.term_began)) || new Date(cleanedForm.term_began) > new Date())) {
            submissionErrors.push('Pregnancy began must be a valid date not in the future.');
        }

        if (cleanedForm.term_ended && (isNaN(Date.parse(cleanedForm.term_ended)) || new Date(cleanedForm.term_ended) > new Date())) {
            submissionErrors.push('Pregnancy end must be a valid date not in the future.');
        }

        if (cleanedForm.term_began && cleanedForm.term_ended && new Date(cleanedForm.term_ended) < new Date(cleanedForm.term_began)) {
            submissionErrors.push('Pregnancy end may not be before the start.');
        }

        if (submissionErrors.length > 0) {
            setErrors(submissionErrors);
            return;
        }
        try{
            console.log('submitting data...')
            const url = `/api/record/respondents/${id}/sensitive-info/`; 
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(cleanedForm)
            });
            const returnData = await response.json();
            if(response.ok){
                setErrors([]);
                setEdit(false);
            }
            else{
                setErrors(['Something went wrong. Please try again later.']);
            }
        }
        catch(err){
            console.error('Could not record respondent: ', err)
        }
    }
    if(loading) return <ComponentLoading />

    if(edit){
        return(
            <div>
                <form onSubmit={handleSubmit}>
                    {errors.length != 0 && <div className={errorStyles.errors} role='alert'><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                    <SimpleSelect name='kp_status_names' label='Key Population Status' 
                        optionValues={respondentsMeta.kp_types} defaultOption={form.kp_status_names} 
                        multiple={true} optionLabels={respondentsMeta.kp_type_labels}
                        callback={(val) => setForm(prev => ({ ...prev, kp_status_names: val }))} 
                    />
                    <SimpleSelect name='disability_status_names' label='Disability Status' 
                        optionValues={respondentsMeta.disability_types} defaultOption={form.disability_status_names} 
                        multiple={true} optionLabels={respondentsMeta.disability_type_labels}
                        callback={(val) => setForm(prev => ({ ...prev, disability_status_names: val }))}
                    />
                    <div className={styles.checkbox}>
                        <input type="checkbox" id={'hiv_status'} name={'hiv_status'} checked={!!form.hiv_positive}  onChange={(e) => setForm(prev => ({ ...prev, hiv_positive: e.target.checked }))}/>
                        <label htmlFor='hiv_status'>Is this HIV Positive?</label>
                    </div>
                    {form.hiv_positive &&
                        <div>
                            <label htmlFor='date_positive'>When did this person become HIV Positve? (leave blank if unsure).</label>
                            <input type='date' id='date_positive' name='date_positive' value={form.date_positive ?? ''} onChange={(e)=> setForm(prev => ({ ...prev, date_positive: e.target.value }))}/>
                        </div>
                    }
                    <div className={styles.checkbox}>
                        <input type="checkbox" id={'is_pregnant'} name={'is_pregnant'} checked={!!form.is_pregnant}  onChange={(e) => setForm(prev => ({ ...prev, is_pregnant: e.target.checked }))}/>
                        <label htmlFor='is_pregnant'>Is this person pregnant?</label>
                    </div>
                    {form.is_pregnant &&
                        <div className={styles.pregnancyDates}>
                            <div>
                                <label htmlFor='term_began'>Pregnancy began</label>
                                <input type='date' id='term_began' name='term_began' value={form.term_began ?? ''} onChange={(e)=>setForm(prev => ({ ...prev, term_began: e.target.value }))}/>
                            </div>
                            <div>
                                <label htmlFor='term_ended'>Pregnancy Ended (leave blank if still pregnant or unsure)</label>
                                <input type='date' id='term_ended' name='term_ended' value={form.term_ended ?? ''} onChange={(e)=>setForm(prev => ({ ...prev, term_ended: e.target.value }))}/>
                            </div>
                        </div>
                    }
                    <button type='submit'>Save</button>
                </form>
                <button type='button' onClick={() => setEdit(!edit)}>Cancel</button>
            </div>
        )
    }
    else{
        return(
            <div>
                {form.kp_status_names && labels.kp_types?.length > 0 &&
                    <div>
                        <p>Key Populations:</p>
                        <ul>{labels.kp_types.map(kp =><li key={kp}>{kp}</li>)}</ul>
                    </div>
                }
                {form.disability_status_names && labels.disability_types?.length > 0 &&
                    <div>
                        <p>Disability Status:</p>
                        <ul>{labels.disability_types.map(d =><li key={d}>{d}</li>)}</ul>
                    </div>
                }
                <p>HIV Status: {form.hiv_positive ? 'Positive': 'Negative'}</p>
                {form.is_pregnant && <p>Pregnant Since: {form.term_began}</p>}
                {!['client'].includes(user?.role) && <button type='button' onClick={() => setEdit(!edit)}>Edit</button>}
            </div>
        )
    }
    
}