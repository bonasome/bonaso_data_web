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
import { IoMdReturnLeft } from "react-icons/io";

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
                    <ButtonHover callback={() => setDel(true)} noHover={<FaTrashAlt />} hover={'Delete Post'} forDelete={true}/>
                </div>
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