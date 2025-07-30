import React from 'react';

import { useEffect, useState, useRef } from "react";
import { useParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import { useRespondents } from '../../contexts/RespondentsContext';
import { useAuth } from '../../contexts/UserAuth';

import fetchWithAuth from '../../../services/fetchWithAuth';
import useWindowWidth from '../../../services/useWindowWidth';
import { favorite, checkFavorited } from '../../../services/favorite';

import Interactions from './interactions/Interactions'; 
import Tasks from '../tasks/Tasks';
import Loading from '../reuseables/loading/Loading';
import ButtonLoading from '../reuseables/loading/ButtonLoading';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import Pregnancies from './respondentDetail/Pregnancies';
import HIVStatus from './respondentDetail/HIVStatus';
import FlagCard from '../flags/FlagCard';
import UpdateRecord from '../reuseables/meta/UpdateRecord';
import FlagModal from '../flags/FlagModal';
import ConfirmDelete from '../reuseables/ConfirmDelete';
import ReturnLink from '../reuseables/ReturnLink';

import errorStyles from '../../styles/errors.module.css';
import styles from './respondentDetail.module.css'

import { BiSolidShow, BiSolidHide } from "react-icons/bi";
import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { IoIosStar, IoIosStarOutline, IoIosArrowDropup, IoIosArrowDropdownCircle } from "react-icons/io";
import { MdFlag } from "react-icons/md";

export default function RespondentDetail(){
    const width = useWindowWidth();

    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    //respondent info
    const { respondentDetails, setRespondentDetails, respondentsMeta, setRespondentsMeta } = useRespondents();
    const[respondent, setRespondent] = useState(null);
    
    //page meta
    const [loading, setLoading] = useState(true);
    const [del, setDel] = useState(false); //control delete modal
    const [errors, setErrors] = useState([]);
    const[sbVisible, setSBVisible] = useState(true);
    const [favorited, setFavorited] = useState(false);

    //toggle dropdowns
    const [showDetails, setShowDetails] = useState(true);
    const [showFlags, setShowFlags] = useState(false);
    const[showHIV, setShowHIV] = useState(false);
    const [showPreg, setShowPreg] = useState(false);
    const [showKP, setShowKP] = useState(false);
    const [showDis, setShowDis] = useState(false);

    //parent helpers to manage passing information between tasks/interactions
    const [addingTask, setAddingTask] = useState(() => () => {});
    const [added, setAdded] = useState([]);

    //controls flag modal
    const [flagging, setFlagging] = useState(false);

    //ref to scroll to errors automatically
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //check if object is favorited and use result to set the favorite button
    useEffect(() => {
        const checkFavStatus = async() => {
            if(!respondent?.id) return;
            const isFavorited = await checkFavorited('respondents.respondent', respondent.id)
            setFavorited(isFavorited)
        }
        checkFavStatus()
    }, [respondent])

    useEffect(() => {
        //get the meta
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
                    console.error('Failed to fetch respondent model information: ', err);
                    setErrors(['Something went wrong. Please try again later.']);
                }
            }
        }
        getRespondentMeta();
        
        //fetch the details for this respondent (always have the most up to date data)
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
                setErrors(['Something went wrong. Please try again later.']);
            } 
            finally {
                setLoading(false);
            }
        };
        getRespondentDetails();
    }, [id])

    //helper function that converts db values to labels
    const getLabelFromValue = (field, value) => {
        if(!respondentsMeta) return null
        const match = respondentsMeta[field]?.find(range => range.value === value);
        return match ? match.label : null;
    };

    //if the user is a client, hide the sidebar since they can't create interactions
    //set the variable to false so that the grid layout readjusts
    useEffect(() => {
        if(user.role ==='client') setSBVisible(false);
    }, []);

    //helper functions that allow tasks/interactions to communicate with each other
    const handleButtonAdd = (task) => {
        addingTask(task);
    };
    const onUpdate = (data) => {
        setAdded(data)
    }

    //helper functions that call the api to update hiv/pregnancy status on update
    const miniHIVUpdate = (data) => {
        setRespondent(prev => ({...prev, hiv_status: data}))
    } 
    const miniPregUpdate = (data) => {
        setRespondent(prev => ({...prev, pregnancies: data}))
    } 
    const miniFlagUpdate = (data) => {
        setRespondent(prev => ({ ...prev, flags: [...(prev.flags || []), data] }));
    }
    //update when a flag is resolved
    const updateFlag = (data) => {
        const others = respondent.flags.filter(f => (f.id != data.id));
        setRespondent(prev => ({ ...prev, flags: [...others, data]}));
    }
    
    //delete respondent
    const deleteRespondent = async() => {
        setErrors([]);
        try {
            console.log('deleting organization...');
            const response = await fetchWithAuth(`/api/record/respondents/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                navigate('/respondents');
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
                        serverResponse.push(`${msg}`);
                    });
                    } else {
                    serverResponse.push(`${data[field]}`);
                    }
                }
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            console.error('Failed to delete organization:', err);
            setErrors(['Something went wrong. Please try again later.'])
        }
        setDel(false)
    }


    if(loading || !respondent) return <Loading /> 
    return(
        <div className={ sbVisible ? styles.respondentView : styles.respondentViewFull}>
            <div className={styles.mainPanel}>
                <div className={styles.respondentDetails}>
                    <ReturnLink url={'/respondents'} display={'Return to respondents overview'} />
                    {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                    
                    {del && 
                        <ConfirmDelete 
                            name={respondent.is_anonymous ? respondent.uuid : (respondent.first_name + respondent.last_name)} 
                            statusWarning={'We advise against deleting respondents unless they have expressly asked to be deleted. Please note that if this respondent has any recorded interactions, you will be required to delete those first.'} 
                            onConfirm={() => deleteRespondent()} onCancel={() => setDel(false)} 
                    />}
                    {flagging &&
                        <FlagModal id={respondent.id} model={'respondents.respondent'} onCancel={() => setFlagging(false)} 
                            onConfirm={(flag) => {setFlagging(false); miniFlagUpdate(flag)}} />
                    }
                    <h1>{respondent.display_name}</h1>
                    
                    <div className={styles.dropdownSegment}>
                        <div className={styles.toggleDropdown} onClick={() => setShowDetails(!showDetails)}>
                            <h3 style={{ textAlign: 'start'}}>Respondent Details</h3>
                            {showDetails ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                            <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                        </div>
                            
                        {showDetails && <div className={styles.dropdownContent}>
                            <p>
                                {getLabelFromValue('sexs', respondent.sex)}, Age {getLabelFromValue('age_ranges', respondent.age_range)}
                                {respondent?.special_attribute?.filter(s => (!['KP', 'PWD', 'PLWHIV'].includes(s.name))).length > 0 && 
                                    respondent.special_attribute.filter(s=> (!['KP', 'PWD', 'PLWHIV'].includes(s.name))).map((s) => `, ${getLabelFromValue('special_attributes', s.name)}`)}
                            </p>
                            <p>{respondent.ward && respondent.ward + ', '}{respondent.village}, {getLabelFromValue('districts', respondent.district)}</p>
                            <p>{respondent.citizenship}</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'row',}}>
                                {favorited && <ButtonHover callback={() => {setFavorited(false); favorite('respondents.respondent', respondent.id, true)}} noHover={<IoIosStar />} hover={'Unfavorite'} /> }
                                {!favorited && <ButtonHover callback={() => {setFavorited(true); favorite('respondents.respondent', respondent.id)}} noHover={<IoIosStarOutline />} hover={'Favorite'} /> }
                                {!['client'].includes(user.role) && <Link to={`/respondents/${respondent.id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit Respondent'} /></Link>}
                                {['meofficer', 'admin', 'manager'].includes(user.role) && <ButtonHover callback={() => setFlagging(true)} noHover={<MdFlag />} hover={'Flag Respondent'} forWarning={true} />}
                                {user.role == 'admin' && !del && <ButtonHover  callback={() => setDel(true)} forDelete={true} noHover={<FaTrashAlt />} hover={'Delete Respondent'}/>}
                                {del && <ButtonLoading forDelete={true} />}
                            </div>

                            <UpdateRecord created_at={respondent.created_at} created_by={respondent.created_by}
                                updated_at={respondent.updated_at} updated_by={respondent.updated_by} /> 
                        </div>}
                    </div>
                                    
                    {respondent.kp_status.length > 0 && <div className={styles.dropdownSegment}>
                        <div className={styles.toggleDropdown} onClick={() => setShowKP(!showKP)}>
                            <h3 style={{ textAlign: 'start'}}>Key Population Status</h3>
                            {showKP ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                            <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                        </div>

                        {showKP && <div className={styles.dropdownContent}>
                            <ul>{respondent.kp_status.map((kp) => (
                                <li key={kp.id}>{getLabelFromValue('kp_types', kp.name)}</li>
                            ))}</ul>
                        </div>}
                    </div>}

                    {respondent.disability_status.length > 0 && <div className={styles.dropdownSegment}>
                        <div className={styles.toggleDropdown} onClick={() => setShowDis(!showDis)}>
                            <h3 style={{ textAlign: 'start'}}>Disability Status</h3>
                            {showDis ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                            <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                        </div>

                        {showDis && <div className={styles.dropdownContent}>
                            <ul>{respondent.disability_status.map((dis) => (
                                <li key={dis.id}>{getLabelFromValue('disability_types', dis.name)}</li>
                            ))}</ul>
                        </div>}
                    </div>}
                    
                    <div className={styles.dropdownSegment}>
                        <div className={styles.toggleDropdown} onClick={() => setShowHIV(!showHIV)}>
                            <h3 style={{ textAlign: 'start'}}>HIV Status CONFIDENTIAL</h3>
                            {showDis ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                            <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                        </div>

                        {showHIV && <div className={styles.dropdownContent}>
                            <HIVStatus respondent={respondent} onUpdate={(data) => miniHIVUpdate(data)}/>
                        </div>}

                    </div>

                    <div className={styles.dropdownSegment}>
                        <div className={styles.toggleDropdown} onClick={() => setShowPreg(!showPreg)}>
                            <h3 style={{ textAlign: 'start'}}>Pregnancy Information</h3>
                            {showPreg ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                            <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                        </div>

                        {showPreg && <div className={styles.dropdownContent}>
                            <Pregnancies respondent={respondent} onUpdate={(data) => miniPregUpdate(data)}/>
                        </div>}
                    </div>
                    {respondent?.flags.length > 0 && <div className={styles.dropdownSegment}>
                        <div className={styles.toggleDropdown} onClick={() => setShowFlags(!showFlags)}>
                            <h3 style={{ textAlign: 'start'}}>Flags</h3>
                            {showFlags ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                            <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                        </div>

                        {showFlags && <div>
                            {respondent.flags.map((flag) => (<FlagCard flag={flag} onUpdate={(flag) => updateFlag(flag)}/>))}
                        </div>}
                    </div>}
                
                </div>
                
                <div className={styles.interactions}>
                    <h2>Interactions</h2>
                    <Interactions id={id} respondent={respondent} meta={respondentsMeta} onUpdate={onUpdate} 
                        setAddingTask={setAddingTask} onAdd={() => setAdded([])}/>
                </div>
            </div>

            {!['client'].includes(user.role) && <div className={styles.sidebar}>
                {width > 768 && <div className={styles.toggle} onClick={() => setSBVisible(!sbVisible)}>
                    {sbVisible ? <BiSolidHide /> : <BiSolidShow />}
                </div>}
                {sbVisible && <Tasks isDraggable={true} callback={(t) => handleButtonAdd(t)} blacklist={added} type={'respondent'} />}
            </div>}
        </div>
    )
}