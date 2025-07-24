import React from 'react';
import { useEffect, useState, useRef } from "react";
import { useParams } from 'react-router-dom';
import { useRespondents } from '../../contexts/RespondentsContext';
import fetchWithAuth from '../../../services/fetchWithAuth';
import Loading from '../reuseables/Loading';
import { Link } from 'react-router-dom';
import SensitiveInfo from './SensitiveInfo';
import styles from './respondentDetail.module.css'
import Interactions from './interactions/Interactions'; 
import Tasks from '../tasks/Tasks';
import { useAuth } from '../../contexts/UserAuth';
import { useNavigate } from 'react-router-dom';
import ConfirmDelete from '../reuseables/ConfirmDelete';
import errorStyles from '../../styles/errors.module.css';
import { IoMdAdd, IoMdReturnLeft } from "react-icons/io";
import { BiSolidShow, BiSolidHide } from "react-icons/bi";
import useWindowWidth from '../../../services/useWindowWidth';
import Checkbox from '../reuseables/Checkbox';
import ButtonLoading from '../reuseables/ButtonLoading';
import { favorite, checkFavorited } from '../../../services/favorite';
import { ImPencil } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import { IoIosStar, IoIosStarOutline, IoIosSave,  IoIosArrowDropup, IoIosArrowDropdownCircle } from "react-icons/io";
import { MdFlag, MdLibraryAdd } from "react-icons/md";
import ButtonHover from '../reuseables/ButtonHover';
import { FcCancel } from "react-icons/fc";
import prettyDates from '../../../services/prettyDates';

function HIVStatus({ respondent, onUpdate }){
    console.log(respondent)
    const [editing, setEditing] = useState(false);
    const [pos, setPos] = useState(respondent?.hiv_status?.hiv_positive || false);
    const [date, setDate] = useState(respondent?.hiv_status?.date_positive || '')
    const [success, setSuccess] = useState('');
    const [errors, setErrors] = useState([]);
    
    const handleSubmit = async() => {
        setSuccess('')
        setErrors([])
        try{
            const data = {'hiv_positive': pos, 'date_positive': date}
            const url = `/api/record/respondents/${respondent.id}/`; 
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({'hiv_status_data': data})
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate(data)
                setSuccess(['Changes Saved!'])
                setEditing(false);
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
                        serverResponse.push(`${field}: ${returnData[field]}`);
                    }
                }
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record respondent: ', err)
        }
    }

    return(
        <div>
            {!editing && <div>
                <p>HIV {pos ? `Positive since ${date}`: 'Negative'}</p>
                <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit HIV Status'} />
            </div>}
            {editing && <div>
                {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                {success !== '' && <div className={errorStyles.success}>{success}</div> }
                <Checkbox label='Is this person HIV Positive?' name='hiv_positive' callback={(c) => setPos(c)} checked={pos}/>
                {pos && <div>
                    <label htmlFor='date_positive'>When did this person become HIV Positve? (leave blank if unsure).</label>
                    <input type='date' id='date_positive' name='date_positive' value={date} onChange={(e)=> setDate(e.target.value)}/>
                </div>}
                <div style ={{ display: 'flex', flexDirection: 'row'}}>
                    <ButtonHover callback={() => handleSubmit()} noHover={<IoIosSave />} hover={'Save'} />
                    <ButtonHover callback={() => setEditing(false)} noHover={<FcCancel />} hover={'Cancel'} />
                </div>
            </div>}
        </div>
    )
}
function PregnancyRow({ respondent, onError, existing=null, onUpdate, onCancel }){
    const [errors, setErrors] = useState([]);
    const [term_began, setTermBegan] = useState(existing?.term_began || '');
    const [term_ended, setTermEnded] = useState(existing?.term_ended || '');
    const [editing, setEditing] = useState(existing ? false : true);
    
    useEffect(() => {
        onError(errors);
    }, [errors]);

    const handleDelete = async() => {
        setErrors([]);
        if(!existing) return;
        let data = {'term_began': null, term_ended: null, 'id': existing.id}
        send(data)
    }
    const handleSubmit = () => {
        setErrors([]);
        if(!term_began){ 
            setErrors(['Pregnancy must include Term Began.']);
            return
        }
        let data = {'term_began': term_began, 'term_ended': term_ended === '' ? null : term_ended, 'id': existing ? existing.id : null}
        send(data)
    }
    const send = async(data) => {
        try{
            console.log(data)
            const url = `/api/record/respondents/${respondent.id}/`; 
            const response = await fetchWithAuth(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({'pregnancy_data': [data]})
            });
            const returnData = await response.json();
            if(response.ok){
                onUpdate()
                setEditing(false);
                setErrors([])
            }
            else{
                console.log(returnData)
                const serverResponse = []
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
                setErrors(serverResponse)
            }
        }
        catch(err){
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Could not record respondent: ', err)
        }
    }
    return(
        <div style={{display: 'flex', flexDirection: 'row'}}>
            {!editing && <p>Pregnancy started on {term_began} {term_ended && `ended on ${term_ended}`}</p>}
            {editing && <div>
                <label htmlFor={'term_began'}>Term Began</label>
                <input type='date' id='term_began' name='term_began' value={term_began} onChange={(e)=> setTermBegan(e.target.value)}/>
                <label htmlFor={'term_ended'}>Term Began</label>
                <input type='date' id='term_ended' name='term_ended' value={term_ended} onChange={(e)=> setTermEnded(e.target.value)}/>
                <div style ={{ display: 'flex', flexDirection: 'row'}}>
                <ButtonHover callback={() => handleSubmit()} noHover={<IoIosSave />} hover={'Save'} />
                <ButtonHover callback={() => onCancel()} noHover={<FcCancel />} hover={'Cancel'} />
                </div>
            </div>}
            {existing && !editing && <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Details'} /> }
            {existing && !editing && <ButtonHover callback={() => handleDelete()} noHover={<FaTrashAlt />} hover={'Delete Pregnancy'} forDelete={true}/>}
        </div>
    )
}
function Pregnancies({ respondent, onUpdate }){
    const [errors, setErrors] = useState([]);
    const [pregnancies, setPregnancies] = useState(respondent?.pregnancies || [])
    const [adding, setAdding] = useState(false)
    const update = async () => {
        try {
            console.log('fetching respondent details...');
            const response = await fetchWithAuth(`/api/record/respondents/${respondent.id}/`);
            const data = await response.json();
            if(response.ok){
                setPregnancies(data?.pregnancies || [])
                onUpdate(data?.pregnancies || [])
            }
            else{
                navigate(`/not-found`);
            }
            
        } catch (err) {
            console.error('Failed to fetch respondent: ', err);
        } 
        setAdding(false);
    }
    return(
        <div>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            {!adding && <ButtonHover callback={() => setAdding(true)} noHover={<MdLibraryAdd />} hover={'Record New Pregnancy'} />}
            {adding && <PregnancyRow respondent={respondent} onError={(e) => setErrors(e)} onUpdate={()=>update()} onCancel={() => {setAdding(false); setErrors([])}}/>}
            {pregnancies.length > 0 && pregnancies.map((p) => (<PregnancyRow respondent={respondent} onError={(e) => setErrors(e)} existing={p} onUpdate={()=>update()} />))}
        </div>
    )
}

function RespondentFlag({ flag, respondent }){
    const [resolving, setResolving] = useState(false);
    const [resolveReason, setResolveReason] = useState('');
    const [errors, setErrors] = useState([])
    const [flagDetail, setFlagDetail] = useState(flag);

    const resolveFlag = async() => {
        setErrors([]);
        if(resolveReason === ''){
            setErrors(['You must enter a reason for flagging this respondent.']);
            return
        }
        try {
            console.log('flagging respondent...');
            const response = await fetchWithAuth(`/api/record/respondents/${respondent.id}/resolve-flag/${flag.id}/`, {
                method: 'PATCH',
                headers: {
                        'Content-Type': "application/json",
                    },
                body: JSON.stringify({'resolved_reason': resolveReason})
            });
            const data = await response.json();
            if (response.ok) {
                setFlagDetail(data.flag)
            } 
            else {
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
        finally{
            setResolving(false);
        }
    }
    if(!flagDetail) return <></>
    return(
        <div>
            <h2>{flagDetail.reason}</h2>
            {errors.length != 0 && <div className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
            <p><i>{flagDetail.auto_flagged ? 'Automatically Flagged' : `Flagged by ${flagDetail.created_by.first_name} ${flagDetail.created_by.last_name}`} at {prettyDates(flagDetail.created_at)}</i></p>
            
            {resolving && <div>
                <label for='reason'>Reason Resolved</label>
                <textarea id='reason' type='text' onChange={(e) => setResolveReason(e.target.value)} value={resolveReason} />
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <ButtonHover callback={() => resolveFlag()} noHover={<IoIosSave />} hover={'Save Flag'} />
                    <ButtonHover callback={() => setResolving(false)} noHover={<FcCancel />} hover={'Cancel'} />
                </div>
            </div>}
            {flagDetail.resolved && <div>
                <p><i>Resolved by {flagDetail.auto_resolved ? 'System' : `${flagDetail.resolved_by.first_name} ${flagDetail.resolved_by.last_name}`} at {prettyDates(flagDetail.resolved_at)} </i></p>
                {flagDetail.resolved_reason && <p>{flagDetail.resolved_reason}</p>}
            </div>}
            {!flagDetail.resolved && <ButtonHover callback={() => setResolving(true)} noHover={<IoIosSave />} hover={'Resolve Flag'} />}
        </div>
    )
}


export default function RespondentDetail(){
    const width = useWindowWidth();

    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { respondentDetails, setRespondentDetails, respondentsMeta, setRespondentsMeta } = useRespondents();
    const[activeRespondent, setActiveRespondent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [labels, setLabels] = useState({});
    const [added, setAdded] = useState([]);
    const[tasks, setTasks] = useState([]);
    const [del, setDel] = useState(false);
    const [errors, setErrors] = useState([]);
    const[sbVisible, setSBVisible] = useState(true);
    const [addingTask, setAddingTask] = useState(() => () => {});
    const [favorited, setFavorited] = useState(false)

    const [showDetails, setShowDetails] = useState(true);
    const [showFlags, setShowFlags] = useState(false);
    const[viewHIV, setViewHIV] = useState(false);
    const [viewPreg, setViewPreg] = useState(false);
    const [viewKP, setViewKP] = useState(false);
    const [viewDis, setViewDis] = useState(false);

    const [flagging, setFlagging] = useState(false);
    const [flagReason, setFlagReason] = useState('');


    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    useEffect(() => {
        const checkFavStatus = async() => {
            if(!activeRespondent?.id) return;
            const isFavorited = await checkFavorited('respondent', activeRespondent.id)
            setFavorited(isFavorited)
        }
        checkFavStatus()
    }, [activeRespondent])

    
    console.log(favorited)
    const handleButtonAdd = (task) => {
        addingTask(task);
    };
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
        const getRespondentDetails = async () => {
        const found = respondentDetails.find(r => r?.id.toString() === id?.toString());
            if (found) {
                setActiveRespondent(found);
                setLoading(false);
                return;
            }
            try {
                console.log('fetching respondent details...');
                const response = await fetchWithAuth(`/api/record/respondents/${id}/`);
                const data = await response.json();
                if(response.ok){
                    setRespondentDetails(prev => [...prev, data]);
                    setActiveRespondent(data);
                }
                else{
                    navigate(`/not-found`);
                }
                
            } catch (err) {
                console.error('Failed to fetch respondent: ', err);
            } finally {
                setLoading(false);
            }
        };
        getRespondentDetails();
    }, [id, respondentDetails, setRespondentDetails])

    useEffect(() => {
        if (!respondentsMeta?.sexs || !activeRespondent) return;
        const sexIndex = respondentsMeta.sexs.indexOf(activeRespondent.sex);
        const districtIndex = respondentsMeta.districts.indexOf(activeRespondent.district)
        const ageRangeIndex = respondentsMeta.age_ranges.indexOf(activeRespondent.age_range)
        const specialAttrIndexes = activeRespondent.special_attribute.map((s) => (respondentsMeta.special_attributes.indexOf(s.name))).filter(s => s!= -1)
        console.log(specialAttrIndexes)
        setLabels({
            district: respondentsMeta.district_labels[districtIndex],
            sex: respondentsMeta.sex_labels[sexIndex],
            age_range: respondentsMeta.age_range_labels[ageRangeIndex],
            special_attr: specialAttrIndexes.map((s) => (respondentsMeta.special_attribute_labels[s]))
        })
    }, [respondentsMeta, activeRespondent])

    useEffect(() => {
        if(user.role ==='client') setSBVisible(false);
    }, [])
    const loadTasks = (data) => {
        setTasks(data);
    }
    const onUpdate = (data) => {
        setAdded(data)
    }
    const flagRespondent = async() => {
        setErrors([]);
        if(flagReason === ''){
            setErrors(['You must enter a reason for flagging this respondent.']);
            return
        }
        try {
            console.log('flagging respondent...');
            const response = await fetchWithAuth(`/api/record/respondents/${id}/raise-flag/`, {
                method: 'PATCH',
                headers: {
                        'Content-Type': "application/json",
                    },
                body: JSON.stringify({'reason': flagReason})
            });
            const data = await response.json();
            if (response.ok) {
                setActiveRespondent(prev => ({
                    ...prev,
                    flags: [...(prev.flags || []), data.flag]
                }));
            } 
            else {
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
        finally{
            setFlagging(false);
        }
    }

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

    const miniHIVUpdate = (data) => {
        setActiveRespondent(prev => ({...prev, hiv_status: data}))
    } 
    const miniPregUpdate = (data) => {
        setActiveRespondent(prev => ({...prev, pregnancies: data}))
    } 

    if(loading) return <Loading /> 
    return(
        <div className={ sbVisible ? styles.respondentView : styles.respondentViewFull}>
            <div className={styles.mainPanel}>
                <div className={styles.respondentDetails}>
                        <Link to={'/respondents'} className={styles.return}>
                            <IoMdReturnLeft className={styles.returnIcon} />
                            <p>Return to respondents overview</p>
                        </Link>
                    {errors.length != 0 && <div ref={alertRef} className={errorStyles.errors}><ul>{errors.map((msg)=><li key={msg}>{msg}</li>)}</ul></div>}
                    {del && 
                        <ConfirmDelete 
                            name={activeRespondent.is_anonymous ? activeRespondent.uuid : (activeRespondent.first_name + activeRespondent.last_name)} 
                            statusWarning={'We advise against deleting respondents unless they have expressly asked to be deleted. Please note that if this respondent has any recorded interactions, you will be required to delete those first.'} 
                            onConfirm={() => deleteRespondent()} onCancel={() => setDel(false)} 
                    />}
                    {activeRespondent.is_anonymous && <h1>Anonymous Respondent {activeRespondent.uuid}</h1>}
                    {!activeRespondent.is_anonymous && <h1>{activeRespondent.first_name} {activeRespondent.last_name}</h1>}
                     <div className={styles.dropdownSegment}>
                        <div className={styles.toggleDropdown} onClick={() => setShowDetails(!showDetails)}>
                            <h3 style={{ textAlign: 'start'}}>Project Details</h3>
                            {showDetails ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                            <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                        </div>
                            
                        {showDetails && <div>
                            <p>{labels.sex}, Age {labels.age_range}{activeRespondent?.special_attribute.length > 0 && labels.special_attr && labels.special_attr.map((s) => `, ${s}`)}</p>
                            <p>{activeRespondent.ward && activeRespondent.ward + ', '}{activeRespondent.village}, {labels.district}</p>
                            <p>{activeRespondent.citizenship}</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'row',}}>
                                {favorited && <ButtonHover callback={() => {setFavorited(false); favorite('respondent', activeRespondent.id, true)}} noHover={<IoIosStar />} hover={'Unfavorite'} /> }
                                {!favorited && <ButtonHover callback={() => {setFavorited(true); favorite('respondent', activeRespondent.id)}} noHover={<IoIosStarOutline />} hover={'Favorite'} /> }
                                {!['client'].includes(user.role) && <Link to={`/respondents/${activeRespondent.id}/edit`}><ButtonHover noHover={<ImPencil />} hover={'Edit Respondent'} /></Link>}
                                {['meofficer', 'admin', 'manager'].includes(user.role) && <ButtonHover callback={() => setFlagging(true)} noHover={<MdFlag />} hover={'Flag Respondent'} forWarning={true} />}
                                {user.role == 'admin' && !del && <ButtonHover  callback={() => setDel(true)} forDelete={true} noHover={<FaTrashAlt />} hover={'Delete Respondent'}/>}
                                {del && <ButtonLoading forDelete={true} />}
                            </div>

                            {flagging && <div>
                                <label for='reason'>Flag Reason</label>
                                <textarea id='reason' type='text' onChange={(e) => setFlagReason(e.target.value)} value={flagReason} />
                                <div style={{ display: 'flex', flexDirection: 'row' }}>
                                    <ButtonHover callback={() => flagRespondent()} noHover={<IoIosSave />} hover={'Save Flag'} />
                                    <ButtonHover callback={() => setFlagging(false)} noHover={<FcCancel />} hover={'Cancel'} />
                                </div>
                            </div>}
                            {user.role == 'admin' && <div>
                                <p><i>Created by: {activeRespondent.created_by?.first_name} {activeRespondent.created_by?.last_name} at {new Date(activeRespondent.created_at).toLocaleString()}</i></p>
                                {activeRespondent.updated_by && activeRespondent.updated_by && <p><i>Updated by: {activeRespondent.updated_by?.first_name} {activeRespondent.updated_by?.last_name} at {new Date(activeRespondent.updated_at).toLocaleString()}</i></p>}
                            </div>} 
                        </div>}
                    </div>
                    

                    {activeRespondent?.flags.length > 0 && <div className={styles.dropdownSegment}>
                        <div className={styles.toggleDropdown} onClick={() => setShowFlags(!showFlags)}>
                            <h3 style={{ textAlign: 'start'}}>RespondentFlags</h3>
                            {showFlags ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                            <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                        </div>

                        {showFlags && <div>
                            {activeRespondent.flags.map((flag) => (
                                <RespondentFlag flag={flag} respondent={activeRespondent} 
                                     onRemove={(fid) => setActiveRespondent(prev => ({
                                        ...prev,
                                        flags: [...(prev.flags || []).filter(f => (f.id != fid))]
                                    }))} 
                                />))}
                        </div>}
                    </div>}


                    {activeRespondent.kp_status.length > 0 && <button onClick={() => setViewKP(!viewKP)}>{viewKP ? 'Hide KP Info' : 'Show KP Info'}</button>}
                    {viewKP && <div><ul>{activeRespondent.kp_status.map((kp) => (
                        <li key={kp.id}>{kp.name}</li>
                    ))}</ul></div>}
                    {activeRespondent.disability_status.length > 0 && <button onClick={() => setViewDis(!viewDis)}>{viewDis ? 'Hide Disability Info' : 'Show Disability Info'}</button>}
                    {viewDis && <div><ul>{activeRespondent.disability_status.map((d) => (
                        <li key={d.id}>{d.name}</li>
                    ))}</ul></div>}
                    <button onClick={() => setViewHIV(!viewHIV)} disabled={viewPreg}>{viewHIV ? 'Hide HIV Status' : 'View/Edit HIV Status'}</button>
                    <button onClick={() => setViewPreg(!viewPreg)} disabled={viewHIV}>{viewPreg ? 'Hide Pregnancies' : 'View/Edit Pregnancies'}</button>
                    {viewHIV && <HIVStatus respondent={activeRespondent} onUpdate={(data) => miniHIVUpdate(data)}/>}
                    {viewPreg && <Pregnancies respondent={activeRespondent} onUpdate={(data) => miniPregUpdate(data)}/>}
                </div>
                <div className={styles.interactions}>
                    <h2>Interactions</h2>
                    <Interactions id={id} tasks={tasks} onUpdate={onUpdate} setAddingTask={setAddingTask} onAdd={() => setAdded([])}/>
                </div>
            </div>
            {!['client'].includes(user.role) && <div className={styles.sidebar}>
                {width > 768 && <div className={styles.toggle} onClick={() => setSBVisible(!sbVisible)}>
                    {sbVisible ? <BiSolidHide /> : <BiSolidShow />}
                </div>}
                {sbVisible && <Tasks sendData={loadTasks} isDraggable={true} callback={(t) => handleButtonAdd(t)} blacklist={added} type={'Respondent'} />}
            </div>}
        </div>
    )
}