import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import fetchWithAuth from "../../../services/fetchWithAuth";

import { useRespondents } from "../../contexts/RespondentsContext";
import { useIndicators } from "../../contexts/IndicatorsContext";
import Loading from "../reuseables/loading/Loading";
export default function AssessmentForm(){
    const navigate = useNavigate();

    const { id, assID} = useParams();
    const { setAssessmentDetails } = useIndicators();
    const { setRespondentDetails} = useRespondents();

    const [assessment, setAssessment] = useState(null);
    const [respondent, setRespondent] = useState(null);

    const [submissionErrors, setSubmissionErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    

    useEffect(() => {
        const getAssessmentDetail = async () => {
            try {
                console.log('fetching indicator details...');
                const response = await fetchWithAuth(`/api/indicators/assessments/${assID}/`);
                const data = await response.json();
                if(response.ok){
                    //update the context
                    setAssessmentDetails(prev => [...prev, data]);
                    setAssessment(data);
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
            finally {
                setLoading(false);
            }
        }
        getAssessmentDetail();
    }, [assID])
    useEffect(() => {
        const getRespondentDetails = async () => {
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/record/respondents/${id}/`);
                const data = await response.json();
                if(response.ok){
                    setRespondentDetails(prev => [...prev, data]);
                    setRespondent(data);
                }
                else{
                    navigate(`/not-found`);
                }
                
            } 
            catch (err) {
                console.error('Failed to fetch respondent: ', err);
                setSubmissionErrors(['Something went wrong. Please try again later.']);
            } 
        };
        getRespondentDetails();
    }, [id])

    console.log(assessment)
    if(loading) return <Loading />
    return(
        <div>
            <p>Ass thats what i like right tight shiggity shag</p>
        </div>
    )
}