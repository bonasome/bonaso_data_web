import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import fetchWithAuth from '../../../../../services/fetchWithAuth';
import Loading from '../../../reuseables/Loading';
import errorStyles from '../../../../styles/errors.module.css';
import prettyDates from '../../../../../services/prettyDates';
import { useRespondents } from '../../../../contexts/RespondentsContext';
import styles from '../../../../styles/indexView.module.css';
import returnStyles from '../../respondentDetail.module.css';
import ButtonLoading from '../../../reuseables/ButtonLoading';
import { IoMdReturnLeft } from "react-icons/io";

function ManageFlag({ interaction, onSubmit, onCancel, flag=null}){
    const [errors, setErrors] = useState([])
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const updateFlag = async() => {
        if(reason === ''){
            setErrors(flag ? ['You must enter a reason for resolving this flag.'] : ['You must enter a reason for creating this flag.'])
            return;
        }
        try{
            setSaving(true);
            console.log('submitting flag...')
            const data = flag ? {'resolved_reason': reason} : {'reason': reason}
            const url = flag ? `/api/record/interactions/${interaction.id}/resolve-flag/${flag.id}/` : `/api/record/interactions/${interaction.id}/raise-flag/`
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(data)
            });
            const returnData = await response.json();
            if(response.ok){
                onSubmit();
                setErrors([]);
            }
            else{
                const serverResponse = [];
                for (const field in returnData) {
                    if (Array.isArray(returnData[field])) {
                    returnData[field].forEach(msg => {
                        serverResponse.push(`${msg}`);
                    });
                    } 
                    else {
                        serverResponse.push(`${returnData[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        }
        catch(err){
            console.error('Failed to apply changes to flag:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setSaving(false);
        }
    }
    return(
        <div>
            {flag && <h3>You are about to resolve flag {flag.reason} for task {interaction.task_detail.indicator.name}</h3>}
            {!flag && <h3>You are about to open a flag for task {interaction.task_detail.indicator.name}</h3>}
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <div>
                <label htmlFor='reason'>Please provide a reason this action.</label>
                <input id='reason' type='text' value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div>
                {!saving && <button onClick={() => updateFlag()}>{flag ? 'Resolve' : 'Flag'}</button>}
                {saving && <ButtonLoading /> }
                <button onClick={() => onCancel()}>Cancel</button>
            </div>
        </div>
    )
}

function FlagCard({ interaction, flag, onCancel, onSubmit }){
    const [expanded, setExpanded] = useState(false);
    const [resolving, setResolving] = useState(false);
    console.log(flag)
    return(
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            <div className={flag.resolved ? errorStyles.success : errorStyles.warnings} >
                <h3>{flag.resolved ? `Resolved Flag`: `Active Flag`}: {flag.reason}</h3>
            </div>
            {expanded && <div onClick={(e) => e.stopPropagation()}>
                <p><i>{flag.auto_flagged ? 'Automatically Flagged' : `Flagged by ${flag.created_by.first_name} ${flag.created_by.last_name}`} at {prettyDates(flag.created_at)}</i></p>
                {!flag.resolved && !resolving && <button onClick={() => setResolving(true)}>Resolve</button>}
                {resolving && <ManageFlag interaction={interaction} flag={flag} onSubmit={() => {setResolving(false); onSubmit()}} onCancel={() => setResolving(false)}/>}
                {flag.resolved &&
                    <div>
                        <h3>Reason Resolved</h3>
                        <p>{flag.resolved_reason}</p>
                        <p><i>{flag.auto_resolved ? 'Automatically Resolved' : `Resolved by ${flag.resolved_by.first_name} ${flag.resolved_by.last_name}`} at {prettyDates(flag.resolved_at)}</i></p>
                    </div>
                }
            </div>}
        </div>
    )
}

export default function InteractionFlags(){
    const { id } = useParams();
    const [errors, setErrors] = useState([]);
    const [flagging, setFlagging] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [interaction, setInteraction] = useState(null);
    const [respondent, setRespondent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);
    const { respondentDetails, setRespondentDetails } = useRespondents();

    useEffect(() => {
        const getInteraction = async() => {
            try{
                const response = await fetchWithAuth(`/api/record/interactions/${id}`);
                const data = await response.json();
                setInteraction(data);
                //setRefresh(prev => prev += 1)
                console.log(data);
            }
            catch(err){
                setErrors(['Something went wrong. Please try again later.'])
                console.error(err)
            }  
            finally{
                setLoading(false);
            }
        }
        getInteraction()
    }, [id, refresh])

    useEffect(() => {
        const getRespondentDetails = async () => {
            if(!interaction) return;
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/record/respondents/${interaction.respondent}/`);
                const data = await response.json();
                if(response.ok){
                    setRespondentDetails(prev => [...prev, data]);
                    setRespondent(data);
                    setLoading(false);
                }
                else{
                    navigate(`/not-found`);
                }
                
            } 
            catch (err) {
                console.error('Failed to fetch respondent: ', err);
                setLoading(false);
            } 
        };
        getRespondentDetails();

    }, [interaction])

    if(loading ||!interaction) return <Loading />
    return(
        <div className={styles.index}>
            <Link to={`/respondents/${respondent?.id}`} className={returnStyles.return}>
                <IoMdReturnLeft className={returnStyles.returnIcon} />
                <p>Return to respondent page</p>
            </Link>
            <Link to={`/respondents/flagged/`} className={returnStyles.return}>
                <IoMdReturnLeft className={returnStyles.returnIcon} />
                <p>Return to flags overview</p>
            </Link>
            <h1>
                Flag History for Interaction "{interaction.task_detail.indicator.name}"  for respondent 
                {respondent?.is_anonymous ? ` Anonymous Respondent ${respondent?.uuid} ` : ` ${respondent?.first_name} ${respondent?.last_name} `} 
                on {prettyDates(interaction.interaction_date)}
            </h1>
            {flagging && <ManageFlag interaction={interaction} existing={null} onSubmit={() => {setRefresh(prev => prev+=1); setFlagging(false)}} onCancel={() => setFlagging(false)}/>}
            {!flagging && <button onClick={() => setFlagging(!flagging)}>Raise New Flag</button>}
            {interaction.flags.length > 0 && <div>
                {interaction.flags.map((f) => (<FlagCard interaction={interaction} flag={f} onSubmit={() => {setRefresh(prev => prev+=1)}}/> ))}
            </div>}
            {interaction.flags.length === 0 && <p>No flags yet.</p>}
            
        </div>
    )
}