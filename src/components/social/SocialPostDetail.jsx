import { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from "react-router-dom";

import { useSocialPosts } from "../../contexts/SocialPostsContext";
import { useAuth } from '../../contexts/UserAuth';

import fetchWithAuth from '../../../services/fetchWithAuth';
import prettyDates from '../../../services/prettyDates';
import cleanLabels from '../../../services/cleanLabels';

import ButtonLoading from '../reuseables/loading/ButtonLoading';
import Loading from '../reuseables/loading/Loading';
import ButtonHover from '../reuseables/inputs/ButtonHover';
import ConfirmDelete from '../reuseables/ConfirmDelete';
import FlagModal from '../flags/FlagModal';
import FlagCard from '../flags/FlagCard';
import ReturnLink from '../reuseables/ReturnLink';
import UpdateRecord from '../reuseables/meta/UpdateRecord';
import Messages from '../reuseables/Messages';

import styles from './postDetail.module.css';

import { ImPencil } from 'react-icons/im';
import { FcCancel } from 'react-icons/fc';
import { IoSaveSharp } from 'react-icons/io5';
import { FaTrashAlt } from 'react-icons/fa';
import { IoIosArrowDropup, IoIosArrowDropdownCircle } from "react-icons/io";
import { MdFlag } from 'react-icons/md';

export default function SocialPostDetail(){
    /*
    Component that displays detailed information about a social media post. Also allows user to edit the metrics.
    Requires an ID URL param that is used to fetch the respondent details. 
    */
    const navigate = useNavigate();
    //existing post id param
    const { id } = useParams();

    //context
    const { user } = useAuth();
    const { socialPosts, setSocialPosts } = useSocialPosts();
    //current active post
    const [post, setPost] = useState(null);

    //control flag modals
    const [showFlags, setShowFlags] = useState(false);
    const [flagging, setFlagging] = useState(false);

    //page meta
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [del, setDel] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState([]);
    
    //mini form that can update engagement metrics
    const [formData, setFormData] = useState({
        likes: '',
        views: '',
        comments: '',
        reach: '',
    })

    //ref to scroll to errors automatically
    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //set engagement metric form if any data exists
    useEffect(() => {
        setFormData({
            likes: post?.likes || '',
            views: post?.views || '',
            comments: post?.comments || '',
            reach: post?.reach || '',
        })
    }, [post]);

    //get post details
    useEffect(() => {
        const getPostDetails = async () => {
            const found = socialPosts.find(o => o.id.toString() === id.toString()); //try context first
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
                        navigate(`/not-found`); //navigate to 404 if bad ID is provided
                    }

                } 
                catch (err) {
                    setErrors(['Something went wrong. Please try again later.'])
                    console.error('Failed to fetch post: ', err);
                } 
                finally{
                    setLoading(false);
                }
            }
        };
        getPostDetails();
    }, [id]);

    //handle a mini submission of engagement metrics
    const handleUpdate = async() => {
        //convert empty strings to null for the backend's sanity
        if(formData.likes == '') formData.likes = null;
        if(formData.views == '') formData.views = null;
        if(formData.comments == '') formData.comments = null;
        if(formData.reach == '') formData.reach = null;
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

    //handle deleting a post
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

    //update data when a flag is created
    const miniFlagUpdate = (data) => {
        setPost(prev => ({ ...prev, flags: [...(prev.flags || []), data] }));
        setFlagging(false);
    }

    //update when a flag is resolved
    const updateFlag = (data) => {
        const others = post.flags.filter(f => (f.id != data.id));
        setPost(prev => ({ ...prev, flags: [...others, data]}));
    }

    //helper function that safely adds all metrics to give total engagement (for what its worth)
    const getEngagement = () => {
        let likes = isNaN(parseInt(formData.likes)) ? 0 : parseInt(formData.likes)
        let views = isNaN(parseInt(formData.views)) ? 0 : parseInt(formData.views)
        let comments = isNaN(parseInt(formData.comments)) ? 0 : parseInt(formData.comments)
        let reach = isNaN(parseInt(formData.reach)) ? 0 : parseInt(formData.reach)
        return likes + views + comments + reach;
    }
    
    if(loading) return <Loading />
    return(
        <div>
            {del && <ConfirmDelete name={post.name} onConfirm={() => handleDelete()} onCancel={() => setDel(false)} /> }
            
            {flagging && <FlagModal model={'social.socialmediapost'} id={id} 
                onConfirm={(flag) => miniFlagUpdate(flag)} onCancel={() => setFlagging(false)} 
            />}

            <div className={styles.segment}>
                <ReturnLink url={'/social'} display={'Return to social overview'} />
                <h1>{post.name}</h1>
                <Messages errors={errors} ref={alertRef} />
                
                <div>
                    <p>On Platform: {post.platform==='other' ? post.other_platform : cleanLabels(post.platform)}</p>
                    <p>Published: {post.published_at ? prettyDates(post.published_at) : prettyDates(post.created_at)} </p>
                    <p>Linked to Tasks: </p>
                    <ul>
                        {post.tasks.map((t) => (<li key={t.id}> {t.display_name}</li>))}
                    </ul>
                    <h4>Link to Post:</h4>
                    {!post.link_to_post && <p>No link on record.</p>}
                    {post.link_to_post && <Messages warnings={['This link will take you to an external site. Please review it first.']} />}
                    {post.link_to_post && <a href={post.link_to_post}>See post here!</a>}
                    <UpdateRecord created_by={post.created_by} created_at={post.created_at} updated_by={post.updated_by}
                        updated_at={post.updated_at} 
                    />
                </div>

                {user.role != 'client' && <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <Link to={`/social/${id}/edit`}> <ButtonHover noHover={<ImPencil />} hover={'Edit Post Information'} /> </Link>
                    <ButtonHover callback={() => setFlagging(true)} noHover={<MdFlag />} hover={'Flag Post'} forWarning={true} />
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Post'} forDelete={true}/>
                </div>}

                {post.flags.length > 0 && <div className={styles.dropdownSegment}>
                    <div className={styles.toggleDropdown} onClick={() => setShowFlags(!showFlags)}>
                        <h3 style={{ textAlign: 'start'}}>Post Flags</h3>
                        {showFlags ? <IoIosArrowDropup style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px'}}/> : 
                        <IoIosArrowDropdownCircle style={{ marginLeft: 'auto', marginTop: 'auto', marginBottom: 'auto', fontSize: '25px' }} />}
                    </div>
        
                    {showFlags && <div>
                        {post.flags.map((flag) => (
                            <FlagCard flag={flag} onUpdate={(flag) => updateFlag(flag)} />))}
                    </div>}
                </div>}
            </div>
            {/* table that allows users to display/edit metrics */}
            <div className={styles.segment}>
                <h2>Metrics</h2>
                {!editing && <div className={styles.metricsTable}>
                    <table>
                        <thead>
                            <tr>
                                <td>Likes</td>
                                <td>Views</td>
                                <td>Comments</td>
                                <td>Reach</td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{formData.likes ==='' ? '-' : formData.likes}</td>
                                <td>{formData.views === '' ? '-' : formData.views}</td>
                                <td>{formData.comments === '' ? '-' : formData.comments}</td>
                                <td>{formData.reach === '' ? '-' : formData.reach}</td>
                            </tr>
                            <tr>
                                <td>Total Engagement:</td>
                                <td>-</td>
                                <td>{getEngagement()}</td>
                            </tr>
                        </tbody>
                    </table>

                    {user.role != 'client' && <ButtonHover callback={() => setEditing(true)} noHover={<ImPencil />} hover={'Edit Metrics'} />}
                
                </div>}
                
                {editing && <div>
                    <div>
                        <label>Likes</label>
                        <input id='likes' type='number' min='0' value={formData.likes} onChange={(e) => setFormData(prev => ({...prev, likes: e.target.value}))} />
                    </div>

                    <div>
                        <label>Views</label>
                        <input id='views' type='number' min='0' value={formData.views} onChange={(e) => setFormData(prev => ({...prev, views: e.target.value}))} />
                    </div>

                    <div>
                        <label>Comments</label>
                        <input id='comments' type='number' min='0' value={formData.comments} onChange={(e) => setFormData(prev => ({...prev, comments: e.target.value}))} />
                    </div>

                    <div>
                        <label>Reach</label>
                        <input id='reach' type='number' min='0' value={formData.reach} onChange={(e) => setFormData(prev => ({...prev, reach: e.target.value}))} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'row' }} >
                        {!saving && <ButtonHover callback={() => handleUpdate()} noHover={<IoSaveSharp />} hover={'Save Changes'} />}
                        <ButtonHover callback={() => setEditing(false)} noHover={<FcCancel />} hover={'Cancel'} />
                        {saving && <ButtonLoading />}
                    </div>
                </div>}
            </div>
        </div>
    )
}