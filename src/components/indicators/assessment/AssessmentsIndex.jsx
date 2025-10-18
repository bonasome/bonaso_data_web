import React from 'react';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../../../contexts/UserAuth'
import { useIndicators } from '../../../contexts/IndicatorsContext';

import fetchWithAuth from '../../../../services/fetchWithAuth';

import IndexViewWrapper from '../../reuseables/IndexView';
import Loading from '../../reuseables/loading/Loading';
import ComponentLoading from '../../reuseables/loading/ComponentLoading';
import Filter from '../../reuseables/Filter';
import ButtonHover from '../../reuseables/inputs/ButtonHover';
import Messages from '../../reuseables/Messages';

import styles from '../../../styles/indexView.module.css'

import { MdAddToPhotos } from "react-icons/md";
import { ImPencil } from 'react-icons/im';
import { GiJumpAcross } from "react-icons/gi";
import AssessmentDetailsModal from './AssessmentDetailsModal';


function AssessmentCard({ assessment, callback = null, callbackText='Select Assessment' }) {
    /*
    Expandable card that displays details about particular assessment for use with an index component
    - assessment (object): the assessment this card displays information about
    - callback (function, optional): a callback function that allows information about this assessment to be selected and 
        passed to another component (passed down from the AssessmentIndex Component).
    - callbackText (string, optional): text to display on the button that triggers the callback function (passed 
        down from the AssessmentIndex Component)
    */

    //context
    const { user } = useAuth();
    const { assessmentDetails, setAssessmentDetails } = useIndicators();

    //state that stores the actual full assessment object, not just the highlights passed from the index query
    const [active, setActive] = useState(null);

    //card meta
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [errors, setErrors] = useState([]);

    //on click, expand the card and fetch the details
    const handleClick = async () => {
        const willExpand = !expanded;
        setExpanded(willExpand);

        if (!willExpand) return;
        //try fetching from context first
        const found = assessmentDetails.find(ind => ind.id === assessment.id);
        if (found) {
            setActive(found);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await fetchWithAuth(`/api/indicators/assessments/${assessment.id}/`);
            const data = await response.json();
            setAssessmentDetails(prev => [...prev, data]);
            setActive(data);
        } 
        catch (err) {
            console.error('Failed to fetch assessments: ', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        finally{
            setLoading(false);
        }
    };

    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={handleClick}>
            {(!callback && user.role == 'admin') ? <Link to={`/indicators/assessments/${assessment.id}`} style={{display:'flex', width:"fit-content"}}><h2>{assessment.display_name}</h2></Link> : <h2>{assessment.display_name}</h2>}
            {callback && (
                <button type="button" onClick={(e) => { e.stopPropagation(); callback(assessment); }}>
                    Select {assessment.name}
                </button>
            )}
            {expanded && loading && <ComponentLoading />}
            {expanded && active && (
                <div>
                    {active.description ? <p>{active.description}</p> : <p><i>No description.</i></p>}
                    {!callback && user.role =='admin' && <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <Link to={`/indicators/assessments/${assessment.id}`}>
                            <ButtonHover noHover={<GiJumpAcross />} hover={'Go to Page'} />
                        </Link>
                        <Link to={`/indicators/assessments/${assessment.id}/edit`}>
                            <ButtonHover noHover={<ImPencil />} hover={'Edit Details'} />
                        </Link>
                    </div>}
                </div>
            )}
        </div>
    );
}

export default function AssessmentsIndex({ callback=null, includeParams=[], excludeParams=[], updateTrigger=null, blacklist=[], }){
    /*
    Expandable card that displays details about particular assessment for use with an index component
    - callback (function, optional): a callback function that allows information about this assessment to be selected and 
        passed to another component
    - callbackText (string, optional): text to display on the button that triggers the callback function 
    - includeParams (array, optional): specify explicitly certain URL param filters
    - excludeParams (array, optional): specify explicitly certain URL params to not include in the index
    - updateTrigger (function, optional): provide a variable that will refetch the list of assessments
    - blacklist (array, optional): provide an array of ids to exclue from the list. 
    */
    
    //contexts
    const { user } = useAuth();
    const { assessments, setAssessments, indicatorseta, setIndicatorsMeta } = useIndicators();

    //page meta
    const [creating, setCreating] = useState(false);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);

    //information for navigating index view
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0); //total number of entries for calculating number of pages

    //ref to scroll to errors automatically
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);
    
    //retrieve the meta
    useEffect(() => {
        const getMeta = async() => {
            try {
                console.log('fetching meta...')
                const url = `/api/indicators/manage/meta/`;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setIndicatorsMeta(data);
                console.log(data)
                setLoading(false);
            } 
            catch (err) {
                setErrors(['Something went wrong. Plese try again later.'])
                console.error('Failed to fetch meta: ', err)
                setLoading(false)
            }
        }
        getMeta();
    }, []);

    //helper function that converts array of objects in include/exclude params and converts it to a string
    const params = useMemo(() => {
        //sepereate from filters, these are passed as params
        const allowedFields = ['project', 'organization'];
        const include = includeParams?.filter(p => allowedFields.includes(p?.field))
        ?.map(p => `&${p?.field}=${p?.value}`)
        .join('') ?? '';

        const exclude = excludeParams?.filter(p => allowedFields.includes(p?.field))
        ?.map(p => `&exclude_${p?.field}=${p?.value}`)
        .join('') ?? '';

        return include + exclude

    }, [includeParams, excludeParams]);

    //load the list of assessments, refresh on search/filter/page/params changes
    useEffect(() => {
        const loadAssessments = async () => {
            try {
                console.log('fetching assessments...');
                const url = `/api/indicators/assessments?search=${search}&page=${page}` + params;
                console.log(url)
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count); //total number of entries for page calculation
                setAssessments(data.results);
                console.log(data.results)
            } 
            catch (err) {
                console.error(err);
                setErrors(['Something went wrong. Please try again later.']);
            }
        };
        loadAssessments();
    }, [page, search, updateTrigger, params]);

    //filter out blacklisted IDs

    const filteredAssessments = assessments?.filter(ass => !blacklist.includes(ass.id));

    if(loading || !assessments) return callback ? <ComponentLoading /> : <Loading /> //on callback don't show full load
    return(
        <div className={styles.index}>
            <h1>All Assessments</h1>
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} >
                {creating && <AssessmentDetailsModal onCancel={() => setCreating(false)}/> }
                {['admin'].includes(user.role) && 
                <button onClick={() => setCreating(true)}><MdAddToPhotos />  Create a New Assessment</button>} 
                <Messages errors={errors} ref={alertRef} />
                {filteredAssessments.length === 0 ? 
                    <p>No assessments match your criteria.</p> :
                    filteredAssessments.map(ass => (
                        <AssessmentCard key={ass.id} assessment={ass} callback={callback ? (assessment)=> callback(assessment) : null} />)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}