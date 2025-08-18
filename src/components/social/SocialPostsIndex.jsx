import React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../contexts/UserAuth'
import { useSocialPosts } from '../../contexts/SocialPostsContext';

import fetchWithAuth from '../../../services/fetchWithAuth';
import { initial, filterConfig } from './filterConfig';
import cleanLabels from '../../../services/cleanLabels';
import prettyDates from '../../../services/prettyDates';

import IndexViewWrapper from '../reuseables/IndexView';
import Loading from '../reuseables/loading/Loading';
import ComponentLoading from '../reuseables/loading/ComponentLoading';
import Filter from '../reuseables/Filter';

import styles from '../../styles/indexView.module.css'
import errorStyles from '../../styles/errors.module.css';

import { MdOutlinePostAdd } from "react-icons/md";
import { ImPencil } from 'react-icons/im';
import { GiJumpAcross } from 'react-icons/gi';

//card component to display post information
function PostCard({ post, callback = null, callbackText }) {
    const { user } = useAuth();
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={expanded ? styles.expandedCard : styles.card} onClick={() => setExpanded(!expanded)}>
            <Link to={`/social/${post.id}`} style={{display:'flex', width:"fit-content"}}><h2>{post.name}</h2></Link>
            {callback && (
                <button type="button" onClick={(e) => { e.stopPropagation(); callback(indicator); }}>
                    {callbackText}
                </button>
            )}
            {expanded && <div>
                <p>Posted on {cleanLabels(post.platform)} on {prettyDates(post.published_at)}</p>
                {post.description ? <p>{post.description}</p> : <p>No description.</p>}
            </div>}
            {!['client'].includes(user.role) && <div style={{ display: 'flex', flexDirection: 'row' }}>
                <Link to={`/social/${post.id}`}>
                    <ButtonHover noHover={<GiJumpAcross />} hover={'Go to Page'} />
                </Link>
                <Link to={`/social/${post.id}/edit`}>
                    <ButtonHover noHover={<ImPencil />} hover={'Edit Details'} />
                </Link>
            </div>}
        </div>
    );
}

export default function SocialPostsIndex({ callback=null, callbackText='Add Post', updateTrigger=null }){
    const { user } = useAuth()
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [entries, setEntries] = useState(0);
    const { socialPosts, setSocialPosts, socialPostsMeta, setSocialPostsMeta } = useSocialPosts();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);
    const [filters, setFilters] = useState(initial)

    const alertRef = useRef(null);
    useEffect(() => {
        if (errors.length > 0 && alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alertRef.current.focus({ preventScroll: true });
        }
    }, [errors]);

    //fetch the posts
    useEffect(() => {
        const loadPosts = async () => {
            const filterQuery = 
                (filters.platform ? `&platform=${filters.platform}` : '') + 
                (filters.start ? `&start=${filters.start}` : '') + 
                (filters.end ? `&end=${filters.end}` : '');

            try {
                const url = `/api/social/posts/?search=${search}&page=${page}` + filterQuery;
                const response = await fetchWithAuth(url);
                const data = await response.json();
                setEntries(data.count);
                setSocialPosts(data.results);
            } 
            catch (err) {
                console.error('Failed to fetch projects: ', err)
                setErrors(['Something went wrong. Please try again later.'])
            }
            finally{
                setLoading(false);
            }
        };
        loadPosts();
    }, [page, search, filters, updateTrigger]);

    useEffect(() => {
        const getMeta = async() => {
            if(Object.keys(socialPostsMeta).length != 0){
                return;
            }
            else{
                try{
                    console.log('fetching model info...')
                    const response = await fetchWithAuth(`/api/social/posts/meta/`);
                    const data = await response.json();
                    setSocialPostsMeta(data);
                }
                catch(err){
                    console.error('Failed to fetch posts meta: ', err);
                    setErrors(['Something went wrong. Please try again later.'])
                }
            }
        }
        getMeta();
    }, []);

    if(loading) return callback ? <ComponentLoading /> : <Loading />
    return(
        <div className={styles.index}>
            <h1>{user.role == 'admin' ? 'All Posts' : 'My Posts'}</h1> 
            <IndexViewWrapper onSearchChange={setSearch} page={page} onPageChange={setPage} entries={entries} filter={
                <Filter onFilterChange={(inputs) => {setFilters(inputs); setPage(1);}} 
                config={filterConfig(socialPostsMeta)} initial={initial} 
            /> }>
                {errors.length != 0 && <div className={errorStyles.errors} ref={alertRef}>
                    <ul>{errors.map((msg)=>
                        <li key={msg}>{msg}</li>)}
                    </ul>
                </div>}
                {['meofficer', 'manager', 'admin'].includes(user.role) && 
                    <Link to='/social/new'><button><MdOutlinePostAdd /> Record a New Post</button></Link>} 
                {socialPosts?.length === 0 ? 
                    <p>No posts match your criteria.</p> :
                    socialPosts?.map(post => (
                        <PostCard key={post.id} post={post} callback={callback ? (post)=> callback(post) : null} callbackText={callbackText} />)
                    )
                }
            </IndexViewWrapper>
        </div>
    )
}