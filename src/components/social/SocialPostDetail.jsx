import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from "react-router-dom";
import { useSocialPosts } from "../../contexts/SocialPostsContext";
import ButtonHover from '../reuseables/ButtonHover';
import { IoSaveSharp } from 'react-icons/io5';
import fetchWithAuth from '../../../services/fetchWithAuth';
import errorStyles from '../../styles/errors.module.css';
import { ImPencil } from 'react-icons/im';
import { FcCancel } from 'react-icons/fc';
import ButtonLoading from '../reuseables/ButtonLoading';
import Loading from '../reuseables/Loading';
import { FaTrashAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/UserAuth';
import ConfirmDelete from '../reuseables/ConfirmDelete';
import prettyDates from '../../../services/prettyDates';
import styles from './postDetail.module.css';
import { IoMdReturnLeft, IoIosSave, IoIosArrowDropup, IoIosArrowDropdownCircle } from "react-icons/io";
import { MdFlag } from 'react-icons/md';

function PostFlag({ flag, post }){
    const [resolving, setResolving] = useState(false);
    const [resolveReason, setResolveReason] = useState('');
    const [errors, setErrors] = useState([])
    const [flagDetail, setFlagDetail] = useState(flag);

    const resolveFlag = async() => {
        setErrors([]);
        if(resolveReason === ''){
            setErrors(['You must enter a reason for flagging this post.']);
            return
        }
        try {
            console.log('flagging post...');
            const response = await fetchWithAuth(`/api/social/posts/${post.id}/resolve-flag/${flag.id}/`, {
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

export default function SocialPostDetail(){
    const { user } = useAuth();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const { socialPosts, setSocialPosts } = useSocialPosts();
    const [editing, setEditing] = useState(false);
    const [del, setDel] = useState(false);
    const [post, setPost] = useState(null)
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    const [showFlags, setShowFlags] = useState(false);
    const [flagging, setFlagging] = useState(false);
    const [flagReason, setFlagReason] = useState('');
    const [formData, setFormData] = useState({
        likes: '',
        views: '',
        comments: '',
    })

    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    useEffect(() => {
        setFormData({
            likes: post?.likes || '',
            views: post?.views || '',
            comments: post?.comments || '',
        })
    }, [post])
    console.log(post)
    useEffect(() => {
        const getPostDetails = async () => {
            const found = socialPosts.find(o => o.id.toString() === id.toString());
            if (found) {
                setPost(found);
                setLoading(false);
                return;
            }
            else{
                try {
                    console.log('fetching post details...');
                    const response = await fetchWithAuth(`/api/social/posts/${id}/`);
                    const data = await response.json();
                    console.log(data)
                    if(response.ok){
                        setSocialPosts(prev => [...prev, data]);
                        setPost(data);
                    }
                    else{
                        navigate(`/not-found`);
                    }
                    
                } 
                catch (err) {
                    console.error('Failed to fetch post: ', err);
                } 
                finally{
                    setLoading(false);
                }
            }
        };
        getPostDetails();
    }, [id]);

    const handleUpdate = async() => {
        try{
            console.log('submitting changes...', formData)
            setSaving(true);
            const response = await fetchWithAuth(`/api/social/posts/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(formData)
            });
            const returnData = await response.json();
            if(response.ok){
                setSocialPosts(prev => {
                    const others = prev.filter(r => r.id !== returnData.id);
                    return [...others, returnData];
                });
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
            console.error('Could not record indicator: ', err)
        }
        finally{
            setSaving(false);
        }
    }

    const flagPost = async() => {
        setErrors([]);
        if(flagReason === ''){
            setErrors(['You must enter a reason for flagging this post.']);
            return
        }
        try {
            console.log('flagging post...');
            const response = await fetchWithAuth(`/api/social/posts/${id}/raise-flag/`, {
                method: 'PATCH',
                headers: {
                        'Content-Type': "application/json",
                    },
                body: JSON.stringify({'reason': flagReason})
            });
            const data = await response.json();
            if (response.ok) {
                setPost(prev => ({
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

    const handleDelete = async() => {
        try {
            console.log('deleting post...');
            const response = await fetchWithAuth(`/api/social/posts/${id}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
            // No need to parse JSON — just navigate away
            navigate('/social');
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
                setErrors(serverResponse);
            }
        } 
        catch (err) {
            setErrors(['Something went wrong. Please try again later.'])
            console.error('Failed to delete indicator:', err);
        }
        finally{
            setDel(false);
        }
    } 

    if(loading) return <Loading />
    return(
        <div>
            {del && <ConfirmDelete name={post.name} onConfirm={() => handleDelete()} onCancel={() => setDel(false)} /> }
            <div className={styles.segment}>
                <Link to={'/social'} className={styles.return}>
                    <IoMdReturnLeft className={styles.returnIcon} />
                    <p>Return to posts overview</p>   
                </Link>
                <h1>{post.name}</h1>
                {errors.length != 0 &&
                <div className={errorStyles.errors} ref={alertRef}>
                    <ul>{errors.map((msg)=>
                        <li key={msg}>{msg}</li>)}
                    </ul>
                </div>}
                
                <div>
                    <p>On Platform: {post.platform==='other' ? post.other_platform : post.platform}</p>
                    <p>Published: {post.published_at ? prettyDates(post.published_at) : prettyDates(post.created_at)} </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <Link to={`/social/${id}/edit`}> <ButtonHover noHover={<ImPencil />} hover={'Edit Post Information'} /> </Link>
                    <ButtonHover callback={() => setFlagging(true)} noHover={<MdFlag />} hover={'Flag Respondent'} forWarning={true} />
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Post'} forDelete={true}/>
                </div>
                {flagging && <div>
                    <label for='reason'>Flag Reason</label>
                    <textarea id='reason' type='text' onChange={(e) => setFlagReason(e.target.value)} value={flagReason} />
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <ButtonHover callback={() => flagPost()} noHover={<IoIosSave />} hover={'Save Flag'} />
                        <ButtonHover callback={() => setFlagging(false)} noHover={<FcCancel />} hover={'Cancel'} />
                    </div>
                </div>}

                {post.flags.length > 0 && <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowFlags(!showFlags)}>
                        <h3 style={{ textAlign: 'start'}}>Post Flags</h3>
                        {showFlags ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
                        
                    {showFlags && <div>
                        {post.flags.map((flag) => (
                            <PostFlag flag={flag} post={post} />))}
                    </div>}
                </div>}

            </div>
            



            <div className={styles.segment}>
                <h2>Metrics</h2>
                {!editing && <div className={styles.metricsTable}>
                    <table>
                        <thead>
                            <tr>
                                <td>Likes</td>
                                <td>Views</td>
                                <td>Comments</td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{formData.likes}</td>
                                <td>{formData.views}</td>
                                <td>{formData.comments}</td>
                            </tr>
                        </tbody>
                    </table>
                    <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Metrics'} />
                </div>}
                {editing && <div>

                    <div>
                        <label>Likes</label>
                        <input type='number' min='0' value={formData.likes} onChange={(e) => setFormData(prev => ({...prev, likes: e.target.value}))} />
                    </div>
                    <div>
                        <label>Views</label>
                        <input type='number' min='0' value={formData.views} onChange={(e) => setFormData(prev => ({...prev, views: e.target.value}))} />
                    </div>
                    <div>
                        <label>Comments</label>
                        <input type='number' min='0' value={formData.comments} onChange={(e) => setFormData(prev => ({...prev, comments: e.target.value}))} />
                    </div>
                    {!saving && <ButtonHover callback={() => handleUpdate()} noHover={<IoSaveSharp />} hover={'Save Changes'} />}
                    <ButtonHover callback={() => setEditing(false)} noHover={<FcCancel />} hover={'Cancel'} />
                    {saving && <ButtonLoading />}
                </div>}
            </div>
        </div>
    )
}